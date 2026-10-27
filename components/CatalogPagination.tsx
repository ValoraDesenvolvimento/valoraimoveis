import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildCatalogHref } from "@/lib/property-query";
import type { PropertySearchParams } from "@/lib/property-filters";

type CatalogPaginationProps = {
  params: PropertySearchParams;
  page: number;
  totalPages: number;
  total: number;
};

export function CatalogPagination({
  params,
  page,
  totalPages,
  total,
}: CatalogPaginationProps) {
  if (totalPages <= 1 || total === 0) return null;

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <nav
      className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-line pt-8"
      aria-label="Paginação do catálogo"
    >
      <p className="text-sm text-muted">
        Página <span className="font-bold text-ink">{page}</span> de{" "}
        <span className="font-bold text-ink">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildCatalogHref(params, page - 1)}
            className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-sm font-bold text-muted opacity-50">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        )}

        {pages.map((item) => (
          <Link
            key={item}
            href={buildCatalogHref(params, item)}
            aria-current={item === page ? "page" : undefined}
            className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
              item === page
                ? "bg-brand text-white"
                : "border border-line text-ink hover:border-brand hover:text-brand"
            }`}
          >
            {item}
          </Link>
        ))}

        {page < totalPages ? (
          <Link
            href={buildCatalogHref(params, page + 1)}
            className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-sm font-bold text-ink hover:border-brand hover:text-brand transition-colors"
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-10 items-center gap-1 rounded-full border border-line px-4 text-sm font-bold text-muted opacity-50">
            Próxima
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
