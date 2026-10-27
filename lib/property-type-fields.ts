import { formatArea } from "@/lib/format";
import type { Property } from "@/lib/types";

/** Tipos suportados no cadastro. */
export const PROPERTY_TYPES = [
  "Casa",
  "Sobrado",
  "Apartamento",
  "Studio",
  "Cobertura",
  "Terreno",
] as const;

export type PropertyTypeName = (typeof PROPERTY_TYPES)[number];

export type PropertyFieldVisibility = {
  bedrooms: boolean;
  suites: boolean;
  bathrooms: boolean;
  socialBathrooms: boolean;
  parking: boolean;
  area: boolean;
  landArea: boolean;
  floors: boolean;
  towers: boolean;
  complement: boolean;
  condo: boolean;
  roomQuantities: boolean;
  roomFlags: boolean;
};

const UNIT_TYPES = new Set(["Apartamento", "Studio", "Cobertura"]);
const HOUSE_TYPES = new Set(["Casa", "Sobrado"]);

/** Quais campos fazem sentido para cada tipo de imóvel. */
export function getFieldVisibility(type: string): PropertyFieldVisibility {
  const isUnit = UNIT_TYPES.has(type);
  const isHouse = HOUSE_TYPES.has(type);
  const isLand = type === "Terreno";

  return {
    bedrooms: !isLand,
    suites: !isLand,
    bathrooms: !isLand,
    socialBathrooms: !isLand,
    parking: true,
    area: !isLand,
    landArea: isHouse || isLand,
    floors: isUnit,
    towers: isUnit,
    complement: isUnit,
    condo: !isLand,
    roomQuantities: !isLand,
    roomFlags: !isLand,
  };
}

export type PublicStatItem = {
  icon: string;
  value: string | number;
  label: string;
};

function hasPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/** Stats públicas: só campos do tipo + com valor preenchido. */
export function buildPublicStatItems(property: Property): PublicStatItem[] {
  const visible = getFieldVisibility(property.type);
  const items: PublicStatItem[] = [];

  if (visible.bedrooms && hasPositiveNumber(property.bedrooms)) {
    items.push({ icon: "fa-bed", value: property.bedrooms, label: "Quartos" });
  }
  if (visible.suites && hasPositiveNumber(property.suites)) {
    items.push({ icon: "fa-star", value: property.suites, label: "Suítes" });
  }
  if (visible.bathrooms && hasPositiveNumber(property.bathrooms)) {
    items.push({ icon: "fa-bath", value: property.bathrooms, label: "Banheiros" });
  }
  if (visible.socialBathrooms && hasPositiveNumber(property.socialBathrooms)) {
    items.push({
      icon: "fa-toilet",
      value: property.socialBathrooms,
      label: "Banheiro social",
    });
  }
  if (visible.parking && hasPositiveNumber(property.parking)) {
    items.push({ icon: "fa-car", value: property.parking, label: "Vagas" });
  }
  if (visible.area && hasPositiveNumber(property.area)) {
    items.push({
      icon: "fa-ruler-combined",
      value: formatArea(property.area),
      label: "Área total",
    });
  }
  if (visible.landArea && hasPositiveNumber(property.landArea)) {
    items.push({
      icon: "fa-maximize",
      value: formatArea(property.landArea),
      label: "Área terreno",
    });
  }

  return items;
}

/** Versão compacta para cards/carrossel (máx. 4 itens). */
export function buildCompactPublicStats(property: Property): PublicStatItem[] {
  return buildPublicStatItems(property).slice(0, 4);
}
