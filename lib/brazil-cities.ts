import { resolveCityName, sanitizePortugueseText } from "@/lib/text-encoding";

const citiesCache = new Map<string, string[]>();

export async function fetchCitiesByState(uf: string): Promise<string[]> {
  const normalized = uf.trim().toUpperCase();
  if (!normalized) return [];

  const cached = citiesCache.get(normalized);
  if (cached) return cached;

  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${normalized}/municipios?orderBy=nome`,
  );
  if (!response.ok) {
    throw new Error("Não foi possível carregar as cidades.");
  }

  // Decodifica explicitamente como UTF-8 para evitar � em nomes como Jaraguá.
  const buffer = await response.arrayBuffer();
  const payload = new TextDecoder("utf-8").decode(buffer);
  const data = JSON.parse(payload) as { nome: string }[];
  const cities = data
    .map((item) => sanitizePortugueseText(item.nome))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));

  citiesCache.set(normalized, cities);
  return cities;
}

export function matchCityInState(city: string, cities: string[]) {
  return resolveCityName(city, cities);
}

export function clearCitiesCacheForTests() {
  citiesCache.clear();
}
