import { formatPrice } from "@/lib/format";
import type { Property } from "@/lib/types";

export type FilterOption = {
  value: string;
  label: string;
};

export type HeroFilterOptions = {
  locations: FilterOption[];
  types: FilterOption[];
  prices: FilterOption[];
  refs: string[];
};

export type PropertySearchParams = {
  intent?: string;
  onde?: string;
  tipo?: string;
  cidade?: string;
  bairro?: string;
  preco?: string;
  precoMin?: string;
  precoMax?: string;
  ref?: string;
  quartos?: string;
  banheiros?: string;
  vagas?: string;
  areaMin?: string;
  areaMax?: string;
  ordenar?: string;
};

export type PropertyListFilters = PropertySearchParams;

export type SortOption = "recentes" | "menor-preco" | "maior-preco";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

export const CATEGORY_TYPE_MAP: Record<string, string> = {
  Casas: "Casa",
  Apartamentos: "Apartamento",
  Terrenos: "Terreno",
  Condomínios: "Condomínio",
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

export function buildPriceBands(prices: number[]): FilterOption[] {
  const positive = prices.filter((price) => price > 0);
  const min = positive.length ? Math.min(...positive) : 0;
  const max = positive.length ? Math.max(...positive) : 0;
  const priceBands: FilterOption[] = [];

  if (!positive.length) return priceBands;
  if (min < 1_000_000) {
    priceBands.push({ value: "0-1000000", label: "Até R$ 1 milhão" });
  }
  if (max >= 1_000_000 && min < 5_000_000) {
    priceBands.push({ value: "1000000-5000000", label: "R$ 1M – R$ 5M" });
  }
  if (max >= 5_000_000) {
    priceBands.push({ value: "5000000+", label: "Acima de R$ 5M" });
  }
  if (!priceBands.length) {
    priceBands.push({
      value: `0-${max}`,
      label: `Até ${formatPrice(max)}`,
    });
  }
  return priceBands;
}

export function buildHeroFilterOptions(properties: Property[]): HeroFilterOptions {
  const locations = uniqueSorted(
    properties.map((item) => {
      const parts = [item.neighborhood, item.city].filter(Boolean);
      return parts.join(", ") || item.location;
    }),
  ).map((label) => ({ value: label, label }));

  return {
    locations,
    types: uniqueSorted(properties.map((item) => item.type)).map((label) => ({
      value: label,
      label,
    })),
    prices: buildPriceBands(properties.map((item) => item.price)),
    refs: uniqueSorted(properties.map((item) => item.ref)),
  };
}

export function buildHeroFilterOptionsFromFacets(facets: {
  locations: string[];
  types: string[];
  prices: number[];
  refs: string[];
}): HeroFilterOptions {
  return {
    locations: facets.locations.map((label) => ({ value: label, label })),
    types: facets.types.map((label) => ({ value: label, label })),
    prices: buildPriceBands(facets.prices),
    refs: facets.refs,
  };
}

export function buildListFilterOptions(properties: Property[]) {
  return {
    types: uniqueSorted(properties.map((item) => item.type)).map((value) => ({
      value,
      label: value,
    })),
    cities: uniqueSorted(properties.map((item) => item.city)).map((value) => ({
      value,
      label: value,
    })),
    neighborhoods: uniqueSorted(properties.map((item) => item.neighborhood)).map((value) => ({
      value,
      label: value,
    })),
  };
}

export function buildListFilterOptionsFromFacets(facets: {
  types: string[];
  cities: string[];
  neighborhoods: string[];
}) {
  return {
    types: facets.types.map((value) => ({ value, label: value })),
    cities: facets.cities.map((value) => ({ value, label: value })),
    neighborhoods: facets.neighborhoods.map((value) => ({ value, label: value })),
  };
}

export function parseMinPlus(value?: string) {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d+)\+?$/);
  return match ? Number(match[1]) : null;
}

export function parseNumberParam(value?: string) {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function matchesLocation(item: Property, params: PropertySearchParams) {
  const onde = params.onde?.trim().toLowerCase() || "";
  const cidade = params.cidade?.trim().toLowerCase() || "";
  const bairro = params.bairro?.trim().toLowerCase() || "";
  const locationLabel = [item.neighborhood, item.city].filter(Boolean).join(", ");

  const matchesOnde =
    !onde ||
    locationLabel.toLowerCase() === onde ||
    item.location.toLowerCase() === onde ||
    item.city.toLowerCase() === onde ||
    item.neighborhood.toLowerCase() === onde;

  const matchesCidade = !cidade || item.city.toLowerCase() === cidade;
  const matchesBairro = !bairro || item.neighborhood.toLowerCase() === bairro;

  return matchesOnde && matchesCidade && matchesBairro;
}

function matchesPrice(item: Property, params: PropertySearchParams) {
  const preco = params.preco?.trim() || "";
  const precoMin = parseNumberParam(params.precoMin);
  const precoMax = parseNumberParam(params.precoMax);

  let matchesBand = true;
  if (preco) {
    if (preco.endsWith("+")) {
      const minPrice = Number(preco.replace("+", ""));
      matchesBand = item.price >= minPrice;
    } else if (preco.includes("-")) {
      const [minRaw, maxRaw] = preco.split("-");
      const minPrice = Number(minRaw);
      const maxPrice = Number(maxRaw);
      matchesBand = item.price >= minPrice && item.price <= maxPrice;
    }
  }

  const matchesMin = precoMin == null || item.price >= precoMin;
  const matchesMax = precoMax == null || item.price <= precoMax;

  return matchesBand && matchesMin && matchesMax;
}

function matchesNumericMin(value: number, param?: string) {
  const min = parseMinPlus(param);
  return min == null || value >= min;
}

export function filterProperties(properties: Property[], params: PropertySearchParams) {
  const tipo = params.tipo?.trim().toLowerCase() || "";
  const ref = params.ref?.trim().toLowerCase() || "";
  const areaMin = parseNumberParam(params.areaMin);
  const areaMax = parseNumberParam(params.areaMax);

  return properties.filter((item) => {
    const matchesType =
      !tipo || item.type.toLowerCase() === tipo || item.typeLabel.toLowerCase() === tipo;
    const matchesRef =
      !ref || item.ref.toLowerCase().includes(ref) || item.slug.toLowerCase().includes(ref);
    const matchesAreaMin = areaMin == null || item.area >= areaMin;
    const matchesAreaMax = areaMax == null || item.area <= areaMax;

    return (
      matchesLocation(item, params) &&
      matchesType &&
      matchesRef &&
      matchesPrice(item, params) &&
      matchesNumericMin(item.bedrooms, params.quartos) &&
      matchesNumericMin(item.bathrooms, params.banheiros) &&
      matchesNumericMin(item.parking, params.vagas) &&
      matchesAreaMin &&
      matchesAreaMax
    );
  });
}

export function sortProperties(properties: Property[], sort: SortOption = "recentes") {
  const sorted = [...properties];
  switch (sort) {
    case "menor-preco":
      return sorted.sort((a, b) => a.price - b.price);
    case "maior-preco":
      return sorted.sort((a, b) => b.price - a.price);
    case "recentes":
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

export function normalizeSortOption(value?: string): SortOption {
  if (value === "menor-preco" || value === "maior-preco") return value;
  return "recentes";
}

export function hasActiveFilters(params: PropertySearchParams) {
  return Boolean(
    params.onde ||
      params.tipo ||
      params.cidade ||
      params.bairro ||
      params.preco ||
      params.precoMin ||
      params.precoMax ||
      params.ref ||
      params.quartos ||
      params.banheiros ||
      params.vagas ||
      params.areaMin ||
      params.areaMax,
  );
}

export function buildImoveisSearchParams(filters: PropertySearchParams) {
  const params = new URLSearchParams();
  const entries: [keyof PropertySearchParams, string | undefined][] = [
    ["onde", filters.onde],
    ["tipo", filters.tipo],
    ["cidade", filters.cidade],
    ["bairro", filters.bairro],
    ["preco", filters.preco],
    ["precoMin", filters.precoMin],
    ["precoMax", filters.precoMax],
    ["ref", filters.ref],
    ["quartos", filters.quartos],
    ["banheiros", filters.banheiros],
    ["vagas", filters.vagas],
    ["areaMin", filters.areaMin],
    ["areaMax", filters.areaMax],
    ["ordenar", filters.ordenar && filters.ordenar !== "recentes" ? filters.ordenar : undefined],
  ];

  for (const [key, value] of entries) {
    if (value?.trim()) params.set(key, value.trim());
  }

  return params;
}

export function buildImoveisHref(filters: PropertySearchParams) {
  const params = buildImoveisSearchParams(filters);
  const query = params.toString();
  return query ? `/imoveis?${query}` : "/imoveis";
}

export function categoryHref(categoryName: string) {
  const tipo = CATEGORY_TYPE_MAP[categoryName];
  return tipo ? buildImoveisHref({ tipo }) : "/imoveis";
}

export function describeActiveFilters(params: PropertySearchParams) {
  const parts: string[] = [];
  if (params.onde) parts.push(params.onde);
  if (params.cidade) parts.push(params.cidade);
  if (params.bairro) parts.push(params.bairro);
  if (params.tipo) parts.push(params.tipo);
  if (params.ref) parts.push(`ref ${params.ref}`);
  if (params.quartos) parts.push(`${params.quartos} quartos`);
  if (params.banheiros) parts.push(`${params.banheiros} banheiros`);
  if (params.vagas) parts.push(`${params.vagas} vagas`);
  if (params.preco || params.precoMin || params.precoMax) parts.push("preço");
  if (params.areaMin || params.areaMax) parts.push("área");
  return parts;
}
