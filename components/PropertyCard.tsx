"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";
import { ManagedImage } from "@/components/ManagedImage";
import { buildCompactPublicStats } from "@/lib/property-type-fields";
import type { Property } from "@/lib/types";

type PropertyCardProps = {
  property: Property;
  highlight?: boolean;
  priority?: boolean;
};

export function PropertyCard({ property, highlight, priority = false }: PropertyCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(property.slug);
  const stats = buildCompactPublicStats(property);

  return (
    <Link
      href={`/imoveis/${property.slug}`}
      className="group block cursor-pointer bg-white rounded-3xl border border-line p-3 transition-all hover:shadow-2xl hover:-translate-y-2"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3] mb-6">
        <ManagedImage
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          src={property.image}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
        <button
          type="button"
          className={`absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center transition-colors ${
            favorited ? "text-orange" : "text-ink hover:text-brand"
          }`}
          aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite({
              slug: property.slug,
              title: property.title,
              location: property.location,
              priceLabel: property.priceLabel,
              image: property.image,
              ref: property.ref,
            });
          }}
        >
          <Heart className={`h-4 w-4 ${favorited ? "fill-orange" : ""}`} />
        </button>
        <div className="absolute bottom-4 left-4">
          {highlight ? (
            <span className="bg-orange text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg font-bold">
              Destaque
            </span>
          ) : (
            <span className="bg-ink/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
              {property.typeLabel}
            </span>
          )}
        </div>
      </div>
      <div className="px-3 pb-4 space-y-4">
        <div>
          <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
            {property.title}
          </h3>
          {property.location ? (
            <p className="text-muted text-sm">{property.location}</p>
          ) : null}
        </div>
        {stats.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 border-y border-line text-xs text-muted">
            {stats.map((item) => (
              <span key={item.label} className="flex items-center gap-1">
                <i className={`fa-solid ${item.icon}`} /> {item.value}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <p className="text-2xl font-light text-ink">{property.priceLabel}</p>
          <span className="text-[10px] text-muted">Ref: {property.ref}</span>
        </div>
      </div>
    </Link>
  );
}
