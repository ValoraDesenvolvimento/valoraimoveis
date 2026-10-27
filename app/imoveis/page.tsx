import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogPagination } from "@/components/CatalogPagination";
import { PropertyCard } from "@/components/PropertyCard";
import { DesktopFilters, MobileFilters } from "@/components/PropertyFilters";
import { PropertySortSelect } from "@/components/PropertySortSelect";
import { SiteShell } from "@/components/SiteShell";
import {
  buildListFilterOptionsFromFacets,
  describeActiveFilters,
  hasActiveFilters,
  normalizeSortOption,
  type PropertySearchParams,
} from "@/lib/property-filters";
import { toPublicProperty } from "@/lib/public-property";
import {
  CATALOG_PAGE_SIZE,
  normalizePage,
} from "@/lib/property-query";
import { getPublishedFacets, listPropertiesPage } from "@/lib/store";

export const metadata: Metadata = {
  title: "Imóveis",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<PropertySearchParams & { pagina?: string }>;
};

export default async function ImoveisPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = normalizePage(params.pagina);
  const sort = normalizeSortOption(params.ordenar);

  const [facets, result] = await Promise.all([
    getPublishedFacets(),
    listPropertiesPage({
      publishedOnly: true,
      filters: params,
      sort,
      page,
      pageSize: CATALOG_PAGE_SIZE,
    }),
  ]);

  const properties = result.items.map(toPublicProperty);
  const filterProps = buildListFilterOptionsFromFacets(facets);
  const activeFilters = describeActiveFilters(params);

  return (
    <SiteShell>
      <main className="pt-32 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <header className="mb-12">
          <nav className="flex text-xs uppercase tracking-widest text-muted gap-2 mb-4">
            <Link href="/" className="hover:text-brand transition-colors">
              Início
            </Link>
            <span>/</span>
            <span className="text-ink font-bold">Imóveis</span>
          </nav>
          <h1 className="h-display text-4xl md:text-6xl text-ink">Encontre seu próximo imóvel</h1>
          {hasActiveFilters(params) && (
            <p className="text-muted mt-4 text-sm">
              Filtros aplicados: {activeFilters.join(" · ")}
              {" · "}
              <Link href="/imoveis" className="text-brand font-bold hover:underline">
                Limpar
              </Link>
            </p>
          )}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 py-4 border-y border-line">
          <p className="text-sm text-muted">
            <span className="font-bold text-ink">{result.total}</span> imóveis encontrados
            {result.totalPages > 1 ? (
              <span className="text-muted">
                {" "}
                · mostrando {(result.page - 1) * result.pageSize + 1}–
                {Math.min(result.page * result.pageSize, result.total)}
              </span>
            ) : null}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-muted font-bold">
                Ordenar:
              </span>
              <Suspense fallback={null}>
                <PropertySortSelect />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <MobileFilters {...filterProps} />
            </Suspense>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          <Suspense fallback={null}>
            <DesktopFilters {...filterProps} />
          </Suspense>
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.slug}
                  property={property}
                  highlight={property.highlight}
                  priority={index < 3}
                />
              ))}
            </div>
            {!properties.length && (
              <p className="text-muted text-sm py-12 text-center">
                Nenhum imóvel encontrado com esses filtros.
              </p>
            )}
            <CatalogPagination
              params={params}
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
