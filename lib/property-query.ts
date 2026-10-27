import {
  normalizeSortOption,
  parseMinPlus,
  parseNumberParam,
  type PropertySearchParams,
  type SortOption,
} from "@/lib/property-filters";
import type { PropertyStatus } from "@/lib/types";

export const CATALOG_PAGE_SIZE = 12;
export const HOME_HIGHLIGHT_LIMIT = 8;
export const HOME_FEATURED_LIMIT = 9;
export const RELATED_LIMIT = 2;
export const ADMIN_PAGE_SIZE = 30;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListPropertiesPageOptions = {
  publishedOnly?: boolean;
  status?: PropertyStatus | "all";
  filters?: PropertySearchParams;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
  highlightOnly?: boolean;
  featuredOnly?: boolean;
  /** Exclui super destaques (útil na grade da home). */
  excludeHighlight?: boolean;
  excludeSlug?: string;
};

export type PublishedFacets = {
  types: string[];
  cities: string[];
  neighborhoods: string[];
  prices: number[];
  refs: string[];
  locations: string[];
};

export function normalizePage(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function paginateArray<T>(
  items: T[],
  page = 1,
  pageSize = CATALOG_PAGE_SIZE,
): PaginatedResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export function buildCatalogHref(
  params: PropertySearchParams & { pagina?: string },
  page?: number,
) {
  const search = new URLSearchParams();
  const entries: [string, string | undefined][] = [
    ["onde", params.onde],
    ["tipo", params.tipo],
    ["cidade", params.cidade],
    ["bairro", params.bairro],
    ["preco", params.preco],
    ["precoMin", params.precoMin],
    ["precoMax", params.precoMax],
    ["ref", params.ref],
    ["quartos", params.quartos],
    ["banheiros", params.banheiros],
    ["vagas", params.vagas],
    ["areaMin", params.areaMin],
    ["areaMax", params.areaMax],
    ["ordenar", params.ordenar && params.ordenar !== "recentes" ? params.ordenar : undefined],
  ];

  for (const [key, value] of entries) {
    if (value?.trim()) search.set(key, value.trim());
  }

  if (page && page > 1) search.set("pagina", String(page));

  const query = search.toString();
  return query ? `/imoveis?${query}` : "/imoveis";
}

export type SqlFilterBuild = {
  whereSql: string;
  params: unknown[];
  orderSql: string;
};

/** Monta WHERE/ORDER para listagens paginadas (MySQL e Postgres com ?). */
export function buildPublishedListSql(options: {
  filters?: PropertySearchParams;
  sort?: SortOption;
  highlightOnly?: boolean;
  featuredOnly?: boolean;
  excludeHighlight?: boolean;
  excludeSlug?: string;
}): SqlFilterBuild {
  const filters = options.filters ?? {};
  const clauses = ["status = 'Publicado'"];
  const params: unknown[] = [];

  if (options.highlightOnly) clauses.push("highlight = TRUE");
  if (options.featuredOnly) clauses.push("featured = TRUE");
  if (options.excludeHighlight) clauses.push("highlight = FALSE");
  if (options.excludeSlug?.trim()) {
    clauses.push("slug <> ?");
    params.push(options.excludeSlug.trim());
  }

  const tipo = filters.tipo?.trim();
  if (tipo) {
    clauses.push("(LOWER(type) = LOWER(?) OR LOWER(type_label) = LOWER(?))");
    params.push(tipo, tipo);
  }

  const cidade = filters.cidade?.trim();
  if (cidade) {
    clauses.push("LOWER(city) = LOWER(?)");
    params.push(cidade);
  }

  const bairro = filters.bairro?.trim();
  if (bairro) {
    clauses.push("LOWER(neighborhood) = LOWER(?)");
    params.push(bairro);
  }

  const onde = filters.onde?.trim();
  if (onde) {
    clauses.push(
      `(LOWER(location) = LOWER(?) OR LOWER(city) = LOWER(?) OR LOWER(neighborhood) = LOWER(?) OR LOWER(TRIM(CONCAT(COALESCE(neighborhood, ''), ', ', COALESCE(city, '')))) = LOWER(?))`,
    );
    params.push(onde, onde, onde, onde);
  }

  const ref = filters.ref?.trim();
  if (ref) {
    clauses.push("(LOWER(ref) LIKE LOWER(?) OR LOWER(slug) LIKE LOWER(?))");
    params.push(`%${ref}%`, `%${ref}%`);
  }

  const quartos = parseMinPlus(filters.quartos);
  if (quartos != null) {
    clauses.push("bedrooms >= ?");
    params.push(quartos);
  }
  const banheiros = parseMinPlus(filters.banheiros);
  if (banheiros != null) {
    clauses.push("bathrooms >= ?");
    params.push(banheiros);
  }
  const vagas = parseMinPlus(filters.vagas);
  if (vagas != null) {
    clauses.push("parking >= ?");
    params.push(vagas);
  }

  const areaMin = parseNumberParam(filters.areaMin);
  if (areaMin != null) {
    clauses.push("area >= ?");
    params.push(areaMin);
  }
  const areaMax = parseNumberParam(filters.areaMax);
  if (areaMax != null) {
    clauses.push("area <= ?");
    params.push(areaMax);
  }

  const precoMin = parseNumberParam(filters.precoMin);
  if (precoMin != null) {
    clauses.push("price >= ?");
    params.push(precoMin);
  }
  const precoMax = parseNumberParam(filters.precoMax);
  if (precoMax != null) {
    clauses.push("price <= ?");
    params.push(precoMax);
  }

  const preco = filters.preco?.trim() || "";
  if (preco.endsWith("+")) {
    const minPrice = Number(preco.replace("+", ""));
    if (Number.isFinite(minPrice)) {
      clauses.push("price >= ?");
      params.push(minPrice);
    }
  } else if (preco.includes("-")) {
    const [minRaw, maxRaw] = preco.split("-");
    const minPrice = Number(minRaw);
    const maxPrice = Number(maxRaw);
    if (Number.isFinite(minPrice)) {
      clauses.push("price >= ?");
      params.push(minPrice);
    }
    if (Number.isFinite(maxPrice)) {
      clauses.push("price <= ?");
      params.push(maxPrice);
    }
  }

  const sort = options.sort ?? normalizeSortOption(filters.ordenar);
  let orderSql = "ORDER BY highlight DESC, updated_at DESC";
  if (sort === "menor-preco") orderSql = "ORDER BY price ASC, updated_at DESC";
  if (sort === "maior-preco") orderSql = "ORDER BY price DESC, updated_at DESC";

  return {
    whereSql: clauses.join(" AND "),
    params,
    orderSql,
  };
}
