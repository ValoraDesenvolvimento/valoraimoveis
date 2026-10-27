import { normalizeAddressDisplay } from "@/lib/address-display";
import { normalizeDescriptionHtml } from "@/lib/description-html";
import { hydrateProperty } from "@/lib/property-display";
import type { Broker, CustomField, IptuPeriod, Property } from "@/lib/types";

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  location: string;
  location_full: string;
  city: string;
  neighborhood: string;
  state: string;
  cep: string;
  address: string;
  number: string;
  complement?: string | null;
  floors?: number | string | null;
  towers?: number | string | null;
  address_display?: string | null;
  latitude: string;
  longitude: string;
  type: string;
  type_label: string;
  price: string | number;
  price_label: string;
  ref: string;
  status: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  social_bathrooms?: number | string | null;
  parking: number;
  area: string | number;
  built_area: string | number;
  land_area: string | number;
  image: string;
  images: unknown;
  featured: boolean;
  highlight: boolean;
  description: unknown;
  condo: string;
  condo_exempt?: boolean | number | null;
  iptu: string;
  iptu_period?: string | null;
  iptu_exempt?: boolean | number | null;
  rooms: unknown;
  leisure: unknown;
  extras: unknown;
  proximities: unknown;
  custom_fields?: unknown;
  rooms_custom_fields?: unknown;
  location_custom_fields?: unknown;
  broker: unknown;
  created_at: string | Date;
  updated_at: string | Date;
};

function parseJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function asStringArray(value: unknown): string[] {
  const parsed = parseJsonValue(value);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === "string")
    : [];
}

function asCustomFields(value: unknown): CustomField[] {
  const parsed = parseJsonValue(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
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

function asIptuPeriod(value: unknown): IptuPeriod {
  return value === "mensal" ? "mensal" : "anual";
}

function asBooleanFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function asBroker(value: unknown): Broker {
  const parsed = parseJsonValue(value);
  if (parsed && typeof parsed === "object" && "name" in parsed) {
    const broker = parsed as Partial<Broker>;
    return {
      name: broker.name || "Equipe Valora",
      creci: broker.creci || "CRECI —",
      avatar:
        broker.avatar ||
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
    };
  }
  return {
    name: "Equipe Valora",
    creci: "CRECI —",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  };
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNumber(value: string | number) {
  return typeof value === "number" ? value : Number(value) || 0;
}

export function rowToProperty(row: PropertyRow): Property {
  return hydrateProperty({
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    locationFull: row.location_full,
    city: row.city,
    neighborhood: row.neighborhood,
    state: row.state,
    cep: row.cep ?? "",
    address: row.address ?? "",
    number: row.number ?? "",
    complement: row.complement ?? "",
    floors: toNumber(row.floors ?? 0),
    towers: toNumber(row.towers ?? 0),
    addressDisplay: normalizeAddressDisplay(row.address_display),
    latitude: row.latitude ?? "",
    longitude: row.longitude ?? "",
    type: row.type,
    typeLabel: row.type_label,
    price: toNumber(row.price),
    priceLabel: row.price_label,
    ref: row.ref,
    status: row.status as Property["status"],
    bedrooms: toNumber(row.bedrooms ?? 0),
    suites: toNumber(row.suites ?? 0),
    bathrooms: toNumber(row.bathrooms ?? 0),
    socialBathrooms: toNumber(row.social_bathrooms ?? 0),
    parking: toNumber(row.parking ?? 0),
    area: toNumber(row.area),
    builtArea: toNumber(row.built_area),
    landArea: toNumber(row.land_area),
    image: row.image ?? "",
    images: asStringArray(row.images),
    featured: asBooleanFlag(row.featured),
    highlight: asBooleanFlag(row.highlight),
    description: normalizeDescriptionHtml(row.description),
    condo: row.condo ?? "",
    condoExempt: asBooleanFlag(row.condo_exempt),
    iptu: row.iptu ?? "",
    iptuPeriod: asIptuPeriod(row.iptu_period),
    iptuExempt: asBooleanFlag(row.iptu_exempt),
    rooms: asStringArray(row.rooms),
    leisure: asStringArray(row.leisure),
    extras: asStringArray(row.extras),
    proximities: asStringArray(row.proximities),
    customFields: asCustomFields(row.custom_fields),
    roomsCustomFields: asCustomFields(row.rooms_custom_fields),
    locationCustomFields: asCustomFields(row.location_custom_fields),
    broker: asBroker(row.broker),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  });
}

export function rowsToProperties(rows: PropertyRow[]) {
  return rows.map(rowToProperty);
}
