import { randomUUID } from "crypto";
import {
  formatPublicAddress,
  formatPublicLocationShort,
  normalizeAddressDisplay,
} from "@/lib/address-display";
import {
  isDescriptionEmpty,
  normalizeDescriptionHtml,
} from "@/lib/description-html";
import { buildLocationShort, formatPrice, slugify } from "@/lib/format";
import { readJsonFile, writeJsonFile } from "@/lib/json-file";
import { hydrateProperty } from "@/lib/property-display";
import {
  filterProperties,
  normalizeSortOption,
  sortProperties,
} from "@/lib/property-filters";
import {
  normalizePage,
  paginateArray,
  type ListPropertiesPageOptions,
  type PaginatedResult,
  type PublishedFacets,
} from "@/lib/property-query";
import type {
  AdminPropertyListItem,
  CustomField,
  IptuPeriod,
  Property,
  PropertyInput,
  PropertyStatus,
} from "@/lib/types";

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

let memoryProperties: Property[] | null = null;
let loadPromise: Promise<void> | null = null;
let skipPersistence = false;

export function resetMemoryStoreForTests() {
  memoryProperties = [];
  loadPromise = null;
  skipPersistence = true;
}

export async function ensureMemoryStoreLoaded() {
  if (skipPersistence && memoryProperties !== null) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      if (memoryProperties !== null) return;
      const raw = await readJsonFile<Property[]>("properties.json", []);
      memoryProperties = raw.map((item) => hydrateProperty(item));
    })();
  }
  await loadPromise;
}

function schedulePersist() {
  if (skipPersistence) return;
  void writeJsonFile("properties.json", getMemoryProperties()).catch((error) => {
    console.error("[Valora] Falha ao salvar imóveis.", error);
  });
}

function getMemoryProperties() {
  if (!memoryProperties) {
    memoryProperties = [];
  }
  return memoryProperties;
}

function uniqueSlug(base: string, properties: Property[], excludeId?: string) {
  const root = slugify(base) || "imovel";
  let candidate = root;
  let index = 2;
  while (properties.some((item) => item.slug === candidate && item.id !== excludeId)) {
    candidate = `${root}-${index}`;
    index += 1;
  }
  return candidate;
}

function normalizeProperty(
  input: PropertyInput,
  properties: Property[],
  existing?: Property,
): Property {
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

  return {
    id: existing?.id ?? input.id ?? randomUUID(),
    slug: uniqueSlug(input.slug || input.title || existing?.slug || "imovel", properties, existing?.id),
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

export function listProperties(options?: {
  status?: PropertyStatus | "all";
  publishedOnly?: boolean;
}) {
  const properties = getMemoryProperties();
  if (options?.publishedOnly || options?.status === "Publicado") {
    return properties.filter((item) => item.status === "Publicado");
  }
  if (options?.status && options.status !== "all") {
    return properties.filter((item) => item.status === options.status);
  }
  return properties;
}

export function listPropertiesPage(
  options: ListPropertiesPageOptions = {},
): PaginatedResult<Property> {
  const page = normalizePage(options.page);
  const pageSize = Math.max(1, options.pageSize ?? 12);
  const sort = options.sort ?? normalizeSortOption(options.filters?.ordenar);

  let items = listProperties({
    publishedOnly: options.publishedOnly,
    status: options.status,
  });

  if (options.highlightOnly) items = items.filter((item) => item.highlight);
  if (options.featuredOnly) items = items.filter((item) => item.featured);
  if (options.excludeHighlight) items = items.filter((item) => !item.highlight);
  if (options.excludeSlug) {
    items = items.filter((item) => item.slug !== options.excludeSlug);
  }
  if (options.filters) items = filterProperties(items, options.filters);
  items = sortProperties(items, sort);

  return paginateArray(items, page, pageSize);
}

export function getPublishedFacets(): PublishedFacets {
  const published = listProperties({ publishedOnly: true });
  const uniqueSorted = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const locations = uniqueSorted(
    published.map((item) => {
      const parts = [item.neighborhood, item.city].filter(Boolean);
      return parts.join(", ") || item.location;
    }),
  );

  return {
    types: uniqueSorted(published.map((item) => item.type)),
    cities: uniqueSorted(published.map((item) => item.city)),
    neighborhoods: uniqueSorted(published.map((item) => item.neighborhood)),
    prices: published.map((item) => item.price).filter((price) => price > 0),
    refs: uniqueSorted(published.map((item) => item.ref)),
    locations,
  };
}

export function getPropertyBySlug(slug: string) {
  return getMemoryProperties().find((item) => item.slug === slug) ?? null;
}

export function getPropertyById(id: string) {
  return getMemoryProperties().find((item) => item.id === id) ?? null;
}

export function listAdminProperties(): AdminPropertyListItem[] {
  return listProperties().map((item) => ({
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

export function createProperty(input: PropertyInput) {
  const properties = getMemoryProperties();
  const created = normalizeProperty(input, properties);
  properties.unshift(created);
  schedulePersist();
  return created;
}

export function updateProperty(id: string, input: PropertyInput) {
  const properties = getMemoryProperties();
  const index = properties.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = normalizeProperty(input, properties, properties[index]);
  properties[index] = updated;
  schedulePersist();
  return updated;
}

export function deleteProperty(id: string) {
  const properties = getMemoryProperties();
  const next = properties.filter((item) => item.id !== id);
  if (next.length === properties.length) return false;
  memoryProperties = next;
  schedulePersist();
  return true;
}
