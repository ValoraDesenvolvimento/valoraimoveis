"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ManagedImage } from "@/components/ManagedImage";
import {
  isDescriptionEmpty,
  stripDescriptionHtml,
} from "@/lib/description-html";
import { buildCompactPublicStats } from "@/lib/property-type-fields";
import type { Property } from "@/lib/types";

type FeaturedHighlightCarouselProps = {
  properties: Property[];
};

export function FeaturedHighlightCarousel({ properties }: FeaturedHighlightCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = properties.length;
  const current = properties[index] ?? properties[0];
  const showControls = total > 1;
  const stats = current ? buildCompactPublicStats(current).slice(0, 3) : [];

  useEffect(() => {
    setIndex(0);
  }, [properties]);

  useEffect(() => {
    if (!showControls || paused) return;
    const timer = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % total);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [showControls, paused, total]);

  if (!current) return null;

  function goTo(next: number) {
    setIndex(((next % total) + total) % total);
  }

  return (
    <div
      className="mb-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 relative">
          <Link
            href={`/imoveis/${current.slug}`}
            className="relative group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl block"
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-auto lg:h-[500px]">
              <ManagedImage
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                src={current.image}
                alt={current.title}
                fill
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <span className="bg-orange text-white text-[10px] uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold">
                Super Destaque
              </span>
            </div>
          </Link>

          {showControls ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg transition-colors hover:bg-white sm:left-4 sm:h-12 sm:w-12"
                aria-label="Destaque anterior"
                onClick={() => goTo(index - 1)}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-lg transition-colors hover:bg-white sm:right-4 sm:h-12 sm:w-12"
                aria-label="Próximo destaque"
                onClick={() => goTo(index + 1)}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          ) : null}
        </div>

        <div className="lg:col-span-5 flex min-w-0 flex-col gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            {current.location ? (
              <p className="text-muted-foreground text-sm flex items-start gap-2">
                <i className="fa-solid fa-location-dot text-brand shrink-0 mt-0.5" />
                <span className="line-clamp-2 min-w-0">{current.location}</span>
              </p>
            ) : null}
            <h3 className="h-display text-xl sm:text-2xl md:text-3xl lg:text-4xl text-ink leading-tight line-clamp-3">
              {current.title}
            </h3>
            {!isDescriptionEmpty(current.description) ? (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-3 sm:line-clamp-4 overflow-hidden">
                  {stripDescriptionHtml(current.description)}
                </p>
                <Link
                  href={`/imoveis/${current.slug}`}
                  className="inline-flex text-sm font-bold text-brand hover:underline"
                >
                  Ver descrição completa
                </Link>
              </div>
            ) : null}
          </div>

          {stats.length > 0 ? (
            <div
              className={`grid gap-3 sm:gap-6 py-6 sm:py-8 border-y border-line ${
                stats.length === 1
                  ? "grid-cols-1"
                  : stats.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
              }`}
            >
              {stats.map((item) => (
                <div key={item.label} className="text-center min-w-0 px-0.5">
                  <i className={`fa-solid ${item.icon} text-muted-foreground mb-2`} />
                  <p className="text-base sm:text-lg font-bold text-ink">{item.value}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase text-muted-foreground tracking-wider leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Valor de Venda</p>
              <p className="text-2xl md:text-3xl font-light text-ink break-words">
                {current.priceLabel}
              </p>
            </div>
            <Link
              href={`/imoveis/${current.slug}`}
              className="bg-ink text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-full text-sm font-bold hover:bg-brand transition-colors text-center shrink-0 w-full sm:w-auto"
            >
              Ver Imóvel
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Ref: {current.ref}
          </p>

          {showControls ? (
            <div className="flex items-center gap-2 pt-2" role="tablist" aria-label="Destaques">
              {properties.map((property, dotIndex) => (
                <button
                  key={property.id}
                  type="button"
                  role="tab"
                  aria-selected={dotIndex === index}
                  aria-label={`Ver destaque ${dotIndex + 1}: ${property.title}`}
                  className={`h-2.5 rounded-full transition-all ${
                    dotIndex === index ? "w-8 bg-brand" : "w-2.5 bg-line hover:bg-muted-foreground/40"
                  }`}
                  onClick={() => goTo(dotIndex)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
