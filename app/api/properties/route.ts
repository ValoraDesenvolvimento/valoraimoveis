import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { normalizeSortOption } from "@/lib/property-filters";
import { toPublicProperty } from "@/lib/public-property";
import { CATALOG_PAGE_SIZE, normalizePage } from "@/lib/property-query";
import { revalidatePropertyPages } from "@/lib/revalidate";
import { createProperty, listPropertiesPage } from "@/lib/store";
import type { PropertyInput, PropertyStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getServerSession();
  const { searchParams } = new URL(request.url);
  const page = normalizePage(searchParams.get("page") ?? searchParams.get("pagina"));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit") || searchParams.get("pageSize")) || CATALOG_PAGE_SIZE),
  );
  const sort = normalizeSortOption(searchParams.get("ordenar") ?? undefined);

  const filters = {
    onde: searchParams.get("onde") ?? undefined,
    tipo: searchParams.get("tipo") ?? undefined,
    cidade: searchParams.get("cidade") ?? undefined,
    bairro: searchParams.get("bairro") ?? undefined,
    preco: searchParams.get("preco") ?? undefined,
    precoMin: searchParams.get("precoMin") ?? undefined,
    precoMax: searchParams.get("precoMax") ?? undefined,
    ref: searchParams.get("ref") ?? undefined,
    quartos: searchParams.get("quartos") ?? undefined,
    banheiros: searchParams.get("banheiros") ?? undefined,
    vagas: searchParams.get("vagas") ?? undefined,
    areaMin: searchParams.get("areaMin") ?? undefined,
    areaMax: searchParams.get("areaMax") ?? undefined,
    ordenar: searchParams.get("ordenar") ?? undefined,
  };

  if (!session) {
    const result = await listPropertiesPage({
      publishedOnly: true,
      filters,
      sort,
      page,
      pageSize,
    });
    return NextResponse.json({
      items: result.items.map(toPublicProperty),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  }

  const status = (searchParams.get("status") as PropertyStatus | "all" | null) ?? "all";
  const publishedOnly = searchParams.get("published") === "1";
  const result = await listPropertiesPage({
    status,
    publishedOnly,
    filters,
    sort,
    page,
    pageSize,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PropertyInput;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }
    const property = await createProperty(body);
    revalidatePropertyPages(property.slug);
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível criar o imóvel." }, { status: 500 });
  }
}
