import { randomUUID } from "crypto";
import {
  formatPublicAddress,
  formatPublicLocationShort,
  normalizeAddressDisplay,
} from "@/lib/address-display";
import { dbExecute, dbQuery, ensureDbReady } from "@/lib/db";
import {
  isDescriptionEmpty,
  normalizeDescriptionHtml,
} from "@/lib/description-html";
import { buildLocationShort, formatPrice, slugify } from "@/lib/format";
import * as memoryStore from "@/lib/memory-store";
import { normalizeSortOption } from "@/lib/property-filters";
import { rowToProperty, rowsToProperties, type PropertyRow } from "@/lib/property-mapper";
import {
  buildPublishedListSql,
  CATALOG_PAGE_SIZE,
  normalizePage,
  type ListPropertiesPageOptions,
  type PaginatedResult,
  type PublishedFacets,
} from "@/lib/property-query";
import { usingMemoryStore } from "@/lib/store-backend";
import type {
  AdminPropertyListItem,
  CustomField,
  IptuPeriod,
  Property,
  PropertyInput,
  PropertyStatus,
} from "@/lib/types";

export type { ListPropertiesPageOptions, PublishedFacets };

function normalizeCustomFields(value: unknown): CustomField[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Partial<CustomField>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const fieldValue = typeof record.value === "string" ? record.value.trim() : "";
      if (!label || !fieldValue) return null;
      return { label, value: fieldValue };
    })
    .filter((item): item is CustomField => Boolean(item));
}

function normalizeIptuPeriod(value: unknown): IptuPeriod {
  return value === "mensal" ? "mensal" : "anual";
}

async function slugExists(slug: string, excludeId?: string) {
  const rows = excludeId
    ? await dbQuery<{ id: string }>(
        "SELECT id FROM properties WHERE slug = ? AND id != ? LIMIT 1",
        [slug, excludeId],
      )
    : await dbQuery<{ id: string }>("SELECT id FROM properties WHERE slug = ? LIMIT 1", [slug]);
  return rows.length > 0;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "imovel";
  let candidate = root;
  let index = 2;
  while (await slugExists(candidate, excludeId)) {
    candidate = `${root}-${index}`;
    index += 1;
  }
  return candidate;
}

async function normalizeProperty(
  input: PropertyInput,
  existing?: Property,
): Promise<Property> {
  const now = new Date().toISOString();
  const neighborhood = input.neighborhood?.trim() ?? existing?.neighborhood ?? "";
  const city = input.city?.trim() ?? existing?.city ?? "";
  const state = input.state?.trim() ?? existing?.state ?? "";
  const address = input.address?.trim() ?? existing?.address ?? "";
  const number = input.number?.trim() ?? existing?.number ?? "";
  const complement = input.complement?.trim() ?? existing?.complement ?? "";
  const floors = Number(input.floors ?? existing?.floors) || 0;
  const towers = Number(input.towers ?? existing?.towers) || 0;
  const addressDisplay = normalizeAddressDisplay(
    input.addressDisplay ?? existing?.addressDisplay ?? "street",
  );
  const addressParts = {
    address,
    number,
    complement,
    neighborhood,
    city,
    state,
    cep: input.cep?.trim() ?? existing?.cep ?? "",
  };
  const location =
    input.location?.trim() ||
    formatPublicLocationShort(addressParts, addressDisplay) ||
    existing?.location ||
    "";
  const locationFull =
    input.locationFull?.trim() ||
    formatPublicAddress(addressParts, addressDisplay) ||
    existing?.locationFull ||
    location;
  const price = Number(input.price ?? existing?.price) || 0;
  const images = (input.images ?? existing?.images ?? []).filter(Boolean);
  const image = input.image || images[0] || existing?.image || "";
  const id = existing?.id ?? input.id ?? randomUUID();
  const slug = await uniqueSlug(
    input.slug || input.title || existing?.slug || "imovel",
    existing?.id,
  );

  return {
    id,
    slug,
    title: input.title?.trim() || existing?.title || "Imóvel sem título",
    location,
    locationFull,
    city,
    neighborhood,
    state,
    cep: input.cep?.trim() ?? existing?.cep ?? "",
    address,
    number,
    complement,
    floors,
    towers,
    addressDisplay,
    latitude: input.latitude?.trim() ?? existing?.latitude ?? "",
    longitude: input.longitude?.trim() ?? existing?.longitude ?? "",
    type: input.type?.trim() || existing?.type || "Casa",
    typeLabel: input.typeLabel?.trim() || input.type?.trim() || existing?.typeLabel || "Casa",
    price,
    priceLabel: input.priceLabel?.trim() || formatPrice(price),
    ref: input.ref?.trim() || existing?.ref || `VAL-${String(Date.now()).slice(-5)}`,
    status: input.status ?? existing?.status ?? "Rascunho",
    bedrooms: Number(input.bedrooms ?? existing?.bedrooms) || 0,
    suites: Number(input.suites ?? existing?.suites) || 0,
    bathrooms: Number(input.bathrooms ?? existing?.bathrooms) || 0,
    socialBathrooms: Number(input.socialBathrooms ?? existing?.socialBathrooms) || 0,
    parking: Number(input.parking ?? existing?.parking) || 0,
    area: Number(input.area ?? existing?.area) || 0,
    builtArea: Number(input.builtArea ?? existing?.builtArea) || 0,
    landArea: Number(input.landArea ?? existing?.landArea) || 0,
    image,
    images: images.length ? images : image ? [image] : [],
    featured: Boolean(input.featured ?? existing?.featured),
    highlight: Boolean(input.highlight ?? existing?.highlight),
    description: (() => {
      if (input.description !== undefined) {
        const html = normalizeDescriptionHtml(input.description);
        return isDescriptionEmpty(html) ? "" : html;
      }
      return existing?.description ?? "";
    })(),
    condo: input.condo?.trim() ?? existing?.condo ?? "",
    condoExempt: Boolean(input.condoExempt ?? existing?.condoExempt),
    iptu: input.iptu?.trim() ?? existing?.iptu ?? "",
    iptuPeriod: normalizeIptuPeriod(input.iptuPeriod ?? existing?.iptuPeriod),
    iptuExempt: Boolean(input.iptuExempt ?? existing?.iptuExempt),
    rooms: input.rooms ?? existing?.rooms ?? [],
    leisure: input.leisure ?? existing?.leisure ?? [],
    extras: input.extras ?? existing?.extras ?? [],
    proximities: input.proximities ?? existing?.proximities ?? [],
    customFields: normalizeCustomFields(input.customFields ?? existing?.customFields ?? []),
    roomsCustomFields: normalizeCustomFields(
      input.roomsCustomFields ?? existing?.roomsCustomFields ?? [],
    ),
    locationCustomFields: normalizeCustomFields(
      input.locationCustomFields ?? existing?.locationCustomFields ?? [],
    ),
    broker: input.broker ??
      existing?.broker ?? {
        name: "Equipe Valora",
        creci: "CRECI —",
        avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
      },
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function propertyParams(property: Property) {
  return [
    property.id,
    property.slug,
    property.title,
    property.location,
    property.locationFull,
    property.city,
    property.neighborhood,
    property.state,
    property.cep,
    property.address,
    property.number,
    property.complement,
    property.floors,
    property.towers,
    property.addressDisplay,
    property.latitude,
    property.longitude,
    property.type,
    property.typeLabel,
    property.price,
    property.priceLabel,
    property.ref,
    property.status,
    property.bedrooms,
    property.suites,
    property.bathrooms,
    property.socialBathrooms,
    property.parking,
    property.area,
    property.builtArea,
    property.landArea,
    property.image,
    JSON.stringify(property.images),
    property.featured,
    property.highlight,
    JSON.stringify(property.description),
    property.condo,
    property.condoExempt,
    property.iptu,
    property.iptuPeriod,
    property.iptuExempt,
    JSON.stringify(property.rooms),
    JSON.stringify(property.leisure),
    JSON.stringify(property.extras),
    JSON.stringify(property.proximities),
    JSON.stringify(property.customFields),
    JSON.stringify(property.roomsCustomFields),
    JSON.stringify(property.locationCustomFields),
    JSON.stringify(property.broker),
    property.createdAt,
    property.updatedAt,
  ];
}

async function saveProperty(property: Property) {
  const params = propertyParams(property);
  const placeholders = params.map(() => "?").join(", ");
  await dbExecute(
    `INSERT INTO properties (
      id, slug, title, location, location_full, city, neighborhood, state,
      cep, address, number, complement, floors, towers, address_display, latitude, longitude, type, type_label,
      price, price_label, ref, status, bedrooms, suites, bathrooms, social_bathrooms, parking,
      area, built_area, land_area, image, images, featured, highlight,
      description, condo, condo_exempt, iptu, iptu_period, iptu_exempt, rooms, leisure, extras, proximities, custom_fields, rooms_custom_fields, location_custom_fields, broker,
      created_at, updated_at
    ) VALUES (${placeholders})`,
    params,
  );
}

async function updateStoredProperty(property: Property) {
  await dbExecute(
    `UPDATE properties SET
      slug = ?, title = ?, location = ?, location_full = ?, city = ?, neighborhood = ?, state = ?,
      cep = ?, address = ?, number = ?, complement = ?, floors = ?, towers = ?, address_display = ?,
      latitude = ?, longitude = ?,
      type = ?, type_label = ?,
      price = ?, price_label = ?, ref = ?, status = ?, bedrooms = ?, suites = ?, bathrooms = ?,
      social_bathrooms = ?, parking = ?,
      area = ?, built_area = ?, land_area = ?, image = ?, images = ?, featured = ?, highlight = ?,
      description = ?, condo = ?, condo_exempt = ?, iptu = ?, iptu_period = ?, iptu_exempt = ?,
      rooms = ?, leisure = ?, extras = ?,
      proximities = ?, custom_fields = ?, rooms_custom_fields = ?, location_custom_fields = ?, broker = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      property.slug,
      property.title,
      property.location,
      property.locationFull,
      property.city,
      property.neighborhood,
      property.state,
      property.cep,
      property.address,
      property.number,
      property.complement,
      property.floors,
      property.towers,
      property.addressDisplay,
      property.latitude,
      property.longitude,
      property.type,
      property.typeLabel,
      property.price,
      property.priceLabel,
      property.ref,
      property.status,
      property.bedrooms,
      property.suites,
      property.bathrooms,
      property.socialBathrooms,
      property.parking,
      property.area,
      property.builtArea,
      property.landArea,
      property.image,
      JSON.stringify(property.images),
      property.featured,
      property.highlight,
      JSON.stringify(property.description),
      property.condo,
      property.condoExempt,
      property.iptu,
      property.iptuPeriod,
      property.iptuExempt,
      JSON.stringify(property.rooms),
      JSON.stringify(property.leisure),
      JSON.stringify(property.extras),
      JSON.stringify(property.proximities),
      JSON.stringify(property.customFields),
      JSON.stringify(property.roomsCustomFields),
      JSON.stringify(property.locationCustomFields),
      JSON.stringify(property.broker),
      property.updatedAt,
      property.id,
    ],
  );
}

export async function listProperties(options?: {
  status?: PropertyStatus | "all";
  publishedOnly?: boolean;
}) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.listProperties(options);
  }
  await ensureDbReady();

  let rows: PropertyRow[];
  if (options?.publishedOnly || options?.status === "Publicado") {
    rows = await dbQuery<PropertyRow>(
      "SELECT * FROM properties WHERE status = 'Publicado' ORDER BY highlight DESC, updated_at DESC",
    );
  } else if (options?.status && options.status !== "all") {
    rows = await dbQuery<PropertyRow>(
      "SELECT * FROM properties WHERE status = ? ORDER BY updated_at DESC",
      [options.status],
    );
  } else {
    rows = await dbQuery<PropertyRow>("SELECT * FROM properties ORDER BY updated_at DESC");
  }

  return rowsToProperties(rows);
}

export async function listPropertiesPage(
  options: ListPropertiesPageOptions = {},
): Promise<PaginatedResult<Property>> {
  const page = normalizePage(options.page);
  const pageSize = Math.max(1, options.pageSize ?? CATALOG_PAGE_SIZE);
  const sort = options.sort ?? normalizeSortOption(options.filters?.ordenar);

  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.listPropertiesPage({
      ...options,
      page,
      pageSize,
      sort,
    });
  }

  await ensureDbReady();

  const publishedScope =
    options.publishedOnly ||
    options.status === "Publicado" ||
    options.highlightOnly ||
    options.featuredOnly ||
    Boolean(options.filters);

  if (!publishedScope && options.status && options.status !== "all") {
    const countRows = await dbQuery<{ total: number | string }>(
      "SELECT COUNT(*) AS total FROM properties WHERE status = ?",
      [options.status],
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    const rows = await dbQuery<PropertyRow>(
      "SELECT * FROM properties WHERE status = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      [options.status, pageSize, offset],
    );
    return {
      items: rowsToProperties(rows),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  if (!publishedScope) {
    const countRows = await dbQuery<{ total: number | string }>(
      "SELECT COUNT(*) AS total FROM properties",
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;
    const rows = await dbQuery<PropertyRow>(
      "SELECT * FROM properties ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      [pageSize, offset],
    );
    return {
      items: rowsToProperties(rows),
      total,
      page: safePage,
      pageSize,
      totalPages,
    };
  }

  const sql = buildPublishedListSql({
    filters: options.filters,
    sort,
    highlightOnly: options.highlightOnly,
    featuredOnly: options.featuredOnly,
    excludeHighlight: options.excludeHighlight,
    excludeSlug: options.excludeSlug,
  });

  const countRows = await dbQuery<{ total: number | string }>(
    `SELECT COUNT(*) AS total FROM properties WHERE ${sql.whereSql}`,
    sql.params,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const rows = await dbQuery<PropertyRow>(
    `SELECT * FROM properties WHERE ${sql.whereSql} ${sql.orderSql} LIMIT ? OFFSET ?`,
    [...sql.params, pageSize, offset],
  );

  return {
    items: rowsToProperties(rows),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getPublishedFacets(): Promise<PublishedFacets> {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.getPublishedFacets();
  }

  await ensureDbReady();
  const rows = await dbQuery<{
    type: string;
    city: string;
    neighborhood: string;
    location: string;
    price: number | string;
    ref: string;
  }>(
    `SELECT type, city, neighborhood, location, price, ref
     FROM properties
     WHERE status = 'Publicado'`,
  );

  const uniqueSorted = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const locations = uniqueSorted(
    rows.map((row) => {
      const parts = [row.neighborhood, row.city].filter(Boolean);
      return parts.join(", ") || row.location;
    }),
  );

  return {
    types: uniqueSorted(rows.map((row) => row.type)),
    cities: uniqueSorted(rows.map((row) => row.city)),
    neighborhoods: uniqueSorted(rows.map((row) => row.neighborhood)),
    prices: rows.map((row) => Number(row.price) || 0).filter((price) => price > 0),
    refs: uniqueSorted(rows.map((row) => row.ref)),
    locations,
  };
}

export async function getPropertyBySlug(slug: string) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.getPropertyBySlug(slug);
  }
  await ensureDbReady();
  const rows = await dbQuery<PropertyRow>("SELECT * FROM properties WHERE slug = ? LIMIT 1", [
    slug,
  ]);
  return rows[0] ? rowToProperty(rows[0]) : null;
}

export async function getPropertyById(id: string) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.getPropertyById(id);
  }
  await ensureDbReady();
  const rows = await dbQuery<PropertyRow>("SELECT * FROM properties WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? rowToProperty(rows[0]) : null;
}

export async function listAdminProperties(): Promise<AdminPropertyListItem[]> {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.listAdminProperties();
  }
  const properties = await listProperties();
  return properties.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    ref: item.ref,
    type: item.type,
    location: buildLocationShort(item.neighborhood, item.city, item.state) || item.location,
    price: item.priceLabel,
    status: item.status,
    image: item.image || item.images[0] || "",
  }));
}

export async function createProperty(input: PropertyInput) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.createProperty(input);
  }
  await ensureDbReady();
  const created = await normalizeProperty(input);
  await saveProperty(created);
  return created;
}

export async function updateProperty(id: string, input: PropertyInput) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.updateProperty(id, input);
  }
  await ensureDbReady();
  const existing = await getPropertyById(id);
  if (!existing) return null;

  const updated = await normalizeProperty(input, existing);
  await updateStoredProperty(updated);
  return updated;
}

export async function deleteProperty(id: string) {
  if (await usingMemoryStore()) {
    await memoryStore.ensureMemoryStoreLoaded();
    return memoryStore.deleteProperty(id);
  }
  await ensureDbReady();
  const affected = await dbExecute("DELETE FROM properties WHERE id = ?", [id]);
  return affected > 0;
}
