import { del, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import {
  getBlobCommandOptions,
  getUploadDir,
  getUploadPublicUrl,
  isManagedUploadUrl,
  usesBlobStorage,
  usesPersistentStorage,
} from "@/lib/storage";
import { listProperties } from "@/lib/store";

export type StoredImage = {
  pathname: string;
  url: string;
  filename: string;
};

export type ImageCleanupResult = {
  storage: "blob" | "local" | "none";
  referencedCount: number;
  storedCount: number;
  orphanCount: number;
  orphans: StoredImage[];
  deletedCount: number;
  deleted: StoredImage[];
  errors: string[];
  dryRun: boolean;
};

/** Converte URL salva no imóvel para chave canônica `uploads/{filename}`. */
export function imageUrlToStorageKey(url: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !isManagedUploadUrl(trimmed)) return null;

  const withoutQuery = trimmed.split("?")[0]?.split("#")[0] ?? "";
  const filename = withoutQuery.split("/").pop()?.trim();
  if (!filename) return null;

  return `uploads/${filename}`;
}

export async function collectReferencedImageKeys(): Promise<Set<string>> {
  const properties = await listProperties();
  const keys = new Set<string>();

  for (const property of properties) {
    const urls = new Set<string>();
    if (property.image) urls.add(property.image);
    for (const image of property.images) {
      if (image) urls.add(image);
    }

    for (const url of urls) {
      const key = imageUrlToStorageKey(url);
      if (key) keys.add(key);
    }
  }

  return keys;
}

async function listBlobUploads(): Promise<StoredImage[]> {
  const items: StoredImage[] = [];
  let cursor: string | undefined;

  do {
    const result = await list({
      prefix: "uploads/",
      cursor,
      limit: 1000,
      ...getBlobCommandOptions(),
    });

    for (const blob of result.blobs) {
      const filename = blob.pathname.split("/").pop() || blob.pathname;
      items.push({
        pathname: blob.pathname,
        url: blob.url,
        filename,
      });
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return items;
}

async function listLocalUploads(): Promise<StoredImage[]> {
  const uploadDir = getUploadDir();

  try {
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
      .map((entry) => ({
        pathname: `uploads/${entry.name}`,
        url: getUploadPublicUrl(entry.name),
        filename: entry.name,
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function listStoredImages(): Promise<{
  storage: ImageCleanupResult["storage"];
  items: StoredImage[];
}> {
  if (usesBlobStorage()) {
    return { storage: "blob", items: await listBlobUploads() };
  }

  if (usesPersistentStorage()) {
    return { storage: "local", items: await listLocalUploads() };
  }

  return { storage: "none", items: await listLocalUploads() };
}

export async function findOrphanedImages(): Promise<{
  storage: ImageCleanupResult["storage"];
  referenced: Set<string>;
  stored: StoredImage[];
  orphans: StoredImage[];
}> {
  const [referenced, { storage, items }] = await Promise.all([
    collectReferencedImageKeys(),
    listStoredImages(),
  ]);

  const orphans = items.filter((item) => !referenced.has(item.pathname));

  return { storage, referenced, stored: items, orphans };
}

async function deleteStoredImage(
  storage: ImageCleanupResult["storage"],
  item: StoredImage,
): Promise<void> {
  if (storage === "blob") {
    await del(item.pathname, getBlobCommandOptions());
    return;
  }

  const filePath = path.join(getUploadDir(), item.filename);
  await fs.unlink(filePath);
}

/** Apaga só as URLs informadas, e apenas se nenhum imóvel as referencia. */
export async function discardUnreferencedImages(urls: string[]): Promise<{
  deletedCount: number;
  skippedCount: number;
  errors: string[];
}> {
  const referenced = await collectReferencedImageKeys();
  const { storage, items } = await listStoredImages();
  const byPath = new Map(items.map((item) => [item.pathname, item]));
  const errors: string[] = [];
  let deletedCount = 0;
  let skippedCount = 0;

  const pending: StoredImage[] = [];
  for (const url of urls) {
    const key = imageUrlToStorageKey(url);
    if (!key || referenced.has(key)) {
      skippedCount += 1;
      continue;
    }
    const stored = byPath.get(key);
    pending.push(
      stored ?? {
        pathname: key,
        filename: key.split("/").pop() || key,
        url,
      },
    );
  }

  for (const item of pending) {
    try {
      await deleteStoredImage(storage === "none" ? "local" : storage, item);
      deletedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir imagem.";
      errors.push(`${item.filename}: ${message}`);
    }
  }

  return { deletedCount, skippedCount, errors };
}

export async function cleanupOrphanedImages(options?: {
  dryRun?: boolean;
}): Promise<ImageCleanupResult> {
  const dryRun = options?.dryRun ?? true;
  const { storage, referenced, stored, orphans } = await findOrphanedImages();

  const result: ImageCleanupResult = {
    storage,
    referencedCount: referenced.size,
    storedCount: stored.length,
    orphanCount: orphans.length,
    orphans,
    deletedCount: 0,
    deleted: [],
    errors: [],
    dryRun,
  };

  if (dryRun || orphans.length === 0) {
    return result;
  }

  if (storage === "blob" && orphans.length > 0) {
    const batchSize = 100;
    for (let index = 0; index < orphans.length; index += batchSize) {
      const batch = orphans.slice(index, index + batchSize);
      try {
        await del(
          batch.map((item) => item.pathname),
          getBlobCommandOptions(),
        );
        result.deleted.push(...batch);
        result.deletedCount += batch.length;
      } catch (error) {
        for (const item of batch) {
          try {
            await deleteStoredImage(storage, item);
            result.deleted.push(item);
            result.deletedCount += 1;
          } catch (itemError) {
            const message =
              itemError instanceof Error ? itemError.message : "Falha ao excluir imagem.";
            result.errors.push(`${item.filename}: ${message}`);
          }
        }

        if (error instanceof Error && result.errors.length === 0) {
          result.errors.push(error.message);
        }
      }
    }

    return result;
  }

  for (const item of orphans) {
    try {
      await deleteStoredImage(storage, item);
      result.deleted.push(item);
      result.deletedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir imagem.";
      result.errors.push(`${item.filename}: ${message}`);
    }
  }

  return result;
}
