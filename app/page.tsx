import Image from "next/image";
import Link from "next/link";
import { FeaturedHighlightCarousel } from "@/components/FeaturedHighlightCarousel";
import { HeroSearch } from "@/components/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import { SiteShell } from "@/components/SiteShell";
import { categories, testimonials } from "@/lib/data";
import { buildHeroFilterOptionsFromFacets, categoryHref } from "@/lib/property-filters";
import { toPublicProperty } from "@/lib/public-property";
import {
  HOME_FEATURED_LIMIT,
  HOME_HIGHLIGHT_LIMIT,
} from "@/lib/property-query";
import { getPublishedFacets, listPropertiesPage } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [facets, highlightsPage, featuredPage, fallbackPage] = await Promise.all([
    getPublishedFacets(),
    listPropertiesPage({
      publishedOnly: true,
      highlightOnly: true,
      pageSize: HOME_HIGHLIGHT_LIMIT,
    }),
    listPropertiesPage({
      publishedOnly: true,
      featuredOnly: true,
      excludeHighlight: true,
      pageSize: HOME_FEATURED_LIMIT,
    }),
    listPropertiesPage({
      publishedOnly: true,
      pageSize: 1,
    }),
  ]);

  const highlights = highlightsPage.items.map(toPublicProperty);
  const featuredSlides = highlights.length
    ? highlights
    : fallbackPage.items.map(toPublicProperty);
  const grid = featuredPage.items.map(toPublicProperty);
  const filterOptions = buildHeroFilterOptionsFromFacets(facets);

  return (
    <SiteShell>
      <header id="hero" className="relative min-h-svh overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            className="object-cover"
            src="/heroimages/home-hero.png"
            alt="Residência contemporânea em concreto e vidro"
            fill
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/80" />
        </div>

        <div className="relative z-10 min-h-svh flex flex-col">
          <div className="flex-1 flex items-center w-full max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
            <h1 className="h-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-white max-w-4xl">
              O lugar certo para viver.
            </h1>
          </div>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10 md:pb-14">
            <HeroSearch options={filterOptions} />
          </div>
        </div>
      </header>

      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-16">
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-widest text-brand font-bold mb-3 sm:mb-4 block">
              Exclusividade
            </span>
            <h2 className="h-display text-3xl sm:text-4xl md:text-6xl text-ink">
              Imóveis em destaque
            </h2>
          </div>
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-2 text-sm font-bold border-b border-ink pb-1 hover:text-brand hover:border-brand transition-colors self-start sm:self-auto"
          >
            Ver todo o catálogo
            <i className="fa-solid fa-arrow-right text-[10px]" />
          </Link>
        </div>

        {featuredSlides.length ? (
          <>
            <FeaturedHighlightCarousel properties={featuredSlides} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {grid.map((property, index) => (
                <PropertyCard
                  key={property.slug}
                  property={property}
                  priority={index < 2}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Nenhum imóvel publicado no momento.</p>
        )}
      </section>

      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="h-display text-3xl sm:text-4xl md:text-5xl mb-8 sm:mb-12 text-ink">
          Navegue por categorias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={categoryHref(category.name)}
              className="relative aspect-[4/3] sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden group cursor-pointer"
            >
              <Image
                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <span className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6 text-xl sm:text-2xl font-medium text-white">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="h-display text-3xl sm:text-4xl md:text-5xl mb-8 sm:mb-12 text-ink">
            O que dizem nossos clientes
          </h2>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="flex-none w-[min(20rem,85vw)] sm:w-96 p-6 sm:p-8 bg-white rounded-3xl border border-line shadow-sm"
              >
                <p className="text-muted-foreground mb-6 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <Image
                    className="rounded-full object-cover"
                    src={item.avatar}
                    alt={item.name}
                    width={48}
                    height={48}
                  />
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
