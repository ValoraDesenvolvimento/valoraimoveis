import {
  DEFAULT_COMPANY_SETTINGS,
  normalizeCompanySettings,
  type CompanySettings,
} from "@/lib/contact";
import { dbExecute, dbQuery, ensureDbReady, getDbProvider } from "@/lib/db";
import { readJsonFile, writeJsonFile } from "@/lib/json-file";
import { usingMemoryStore } from "@/lib/store-backend";

const SETTINGS_ID = "default";
const MEMORY_FILE = "company.json";

type CompanyRow = {
  id: string;
  company_name: string;
  email: string;
  emails?: unknown;
  phone_display: string;
  phones?: unknown;
  whatsapp_display: string;
  whatsapp_e164: string;
  instagram_handle: string;
  instagram_url: string;
  facebook_url: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  listing_visibility?: unknown;
  updated_at: string | Date;
};

let memorySettings: CompanySettings | null = null;
let memoryReady: Promise<void> | null = null;
let skipPersistence = false;

export function resetCompanyStoreForTests() {
  memorySettings = null;
  memoryReady = null;
  skipPersistence = true;
}

async function ensureMemoryReady() {
  if (!memoryReady) {
    memoryReady = (async () => {
      const raw = await readJsonFile<Partial<CompanySettings> | null>(MEMORY_FILE, null);
      memorySettings = normalizeCompanySettings(raw ?? DEFAULT_COMPANY_SETTINGS);
    })();
  }
  await memoryReady;
}

function schedulePersistMemory(settings: CompanySettings) {
  if (skipPersistence) return;
  void writeJsonFile(MEMORY_FILE, settings).catch((error) => {
    console.error("[Valora] Falha ao salvar dados da empresa.", error);
  });
}

function parseJsonValue(value: unknown): unknown {
  if (value == null) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }
  return value;
}

function parseJsonList(value: unknown): string[] | undefined {
  const parsed = parseJsonValue(value);
  if (parsed == null) return undefined;
  if (Array.isArray(parsed)) return parsed.map((item) => String(item ?? ""));
  return undefined;
}

function rowToSettings(row: CompanyRow): CompanySettings {
  return normalizeCompanySettings({
    companyName: row.company_name,
    email: row.email,
    emails: parseJsonValue(row.emails),
    phoneDisplay: row.phone_display,
    phones: parseJsonValue(row.phones),
    whatsappDisplay: row.whatsapp_display,
    whatsappE164: row.whatsapp_e164,
    instagramHandle: row.instagram_handle,
    instagramUrl: row.instagram_url,
    facebookUrl: row.facebook_url,
    cep: row.cep,
    address: row.address,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    listingVisibility: parseJsonValue(row.listing_visibility),
  });
}

function jsonParam(value: unknown) {
  return JSON.stringify(value ?? null);
}

async function ensureCompanyExtraColumns() {
  const provider = getDbProvider();
  if (provider === "postgres") {
    await dbExecute(
      `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS emails JSONB NOT NULL DEFAULT '[]'::jsonb`,
    );
    await dbExecute(
      `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS phones JSONB NOT NULL DEFAULT '[]'::jsonb`,
    );
    await dbExecute(
      `ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS listing_visibility JSONB NOT NULL DEFAULT '{}'::jsonb`,
    );
    return;
  }

  for (const column of [
    ["emails", "JSON NULL"],
    ["phones", "JSON NULL"],
    ["listing_visibility", "JSON NULL"],
  ] as const) {
    try {
      await dbExecute(`ALTER TABLE company_settings ADD COLUMN ${column[0]} ${column[1]}`);
    } catch {
      // coluna já existe
    }
  }
}

async function seedDbDefaultsIfNeeded() {
  await ensureCompanyExtraColumns();
  const rows = await dbQuery<{ id: string }>(
    "SELECT id FROM company_settings WHERE id = ? LIMIT 1",
    [SETTINGS_ID],
  );
  if (rows.length) return;

  const defaults = DEFAULT_COMPANY_SETTINGS;
  const now = new Date().toISOString();
  await dbExecute(
    `INSERT INTO company_settings (
      id, company_name, email, emails, phone_display, phones, whatsapp_display, whatsapp_e164,
      instagram_handle, instagram_url, facebook_url,
      cep, address, number, complement, neighborhood, city, state, listing_visibility, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      SETTINGS_ID,
      defaults.companyName,
      defaults.email,
      jsonParam(defaults.emails),
      defaults.phoneDisplay,
      jsonParam(defaults.phones),
      defaults.whatsappDisplay,
      defaults.whatsappE164,
      defaults.instagramHandle,
      defaults.instagramUrl,
      defaults.facebookUrl,
      defaults.cep,
      defaults.address,
      defaults.number,
      defaults.complement,
      defaults.neighborhood,
      defaults.city,
      defaults.state,
      jsonParam(defaults.listingVisibility),
      now,
    ],
  );
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (await usingMemoryStore()) {
    await ensureMemoryReady();
    return memorySettings ?? DEFAULT_COMPANY_SETTINGS;
  }

  await ensureDbReady();
  await seedDbDefaultsIfNeeded();
  const rows = await dbQuery<CompanyRow>(
    "SELECT * FROM company_settings WHERE id = ? LIMIT 1",
    [SETTINGS_ID],
  );
  if (!rows[0]) return DEFAULT_COMPANY_SETTINGS;
  return rowToSettings(rows[0]);
}

export async function updateCompanySettings(
  input: Partial<CompanySettings>,
): Promise<CompanySettings> {
  const next = normalizeCompanySettings({
    ...(await getCompanySettings()),
    ...input,
  });

  if (await usingMemoryStore()) {
    await ensureMemoryReady();
    memorySettings = next;
    schedulePersistMemory(next);
    return next;
  }

  await ensureDbReady();
  await seedDbDefaultsIfNeeded();
  const now = new Date().toISOString();
  await dbExecute(
    `UPDATE company_settings SET
      company_name = ?, email = ?, emails = ?, phone_display = ?, phones = ?,
      whatsapp_display = ?, whatsapp_e164 = ?,
      instagram_handle = ?, instagram_url = ?, facebook_url = ?,
      cep = ?, address = ?, number = ?, complement = ?, neighborhood = ?, city = ?, state = ?,
      listing_visibility = ?, updated_at = ?
    WHERE id = ?`,
    [
      next.companyName,
      next.email,
      jsonParam(next.emails),
      next.phoneDisplay,
      jsonParam(next.phones),
      next.whatsappDisplay,
      next.whatsappE164,
      next.instagramHandle,
      next.instagramUrl,
      next.facebookUrl,
      next.cep,
      next.address,
      next.number,
      next.complement,
      next.neighborhood,
      next.city,
      next.state,
      jsonParam(next.listingVisibility),
      now,
      SETTINGS_ID,
    ],
  );
  return next;
}
