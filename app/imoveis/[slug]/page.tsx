import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteToggleButton } from "@/components/FavoriteToggleButton";
import { LocationMap } from "@/components/LocationMapClient";
import { PropertyDescription } from "@/components/PropertyDescription";
import { PropertyGallery } from "@/components/PropertyGallery";
import { SiteShell } from "@/components/SiteShell";
import { isDescriptionEmpty } from "@/lib/description-html";
import {
  buildPublicMapQuery,
  shouldExposeExactCoordinates,
} from "@/lib/address-display";
import { getCompanySettings } from "@/lib/company-store";
import { listingPhones, whatsappLink } from "@/lib/contact";
import { getLocationMapsUrl } from "@/lib/maps";
import { toPublicProperty } from "@/lib/public-property";
import {
  buildCompactPublicStats,
  buildPublicStatItems,
  getFieldVisibility,
} from "@/lib/property-type-fields";
import { RELATED_LIMIT } from "@/lib/property-query";
import { getPropertyBySlug, listPropertiesPage } from "@/lib/store";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  return { title: property?.title ?? "Imóvel" };
}

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const raw = await getPropertyBySlug(slug);
  if (!raw || raw.status !== "Publicado") notFound();

  const property = toPublicProperty(raw);
  const company = await getCompanySettings();
  const related = (
    await listPropertiesPage({
      publishedOnly: true,
      excludeSlug: property.slug,
      pageSize: RELATED_LIMIT,
    })
  ).items.map(toPublicProperty);
  const gallery = property.images.length
    ? property.images
    : property.image
      ? [property.image]
      : [];
  const whatsapp = whatsappLink(
    `Olá, tenho interesse no imóvel ${property.title} (Ref: ${property.ref}) e gostaria de mais informações.`,
    company,
  );
  const phonesOnListing = listingPhones(company);
  const addressDisplay = property.addressDisplay;
  const addressParts = {
    address: property.address,
    number: property.number,
    complement: property.complement,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    cep: property.cep,
  };
  const locationQuery = buildPublicMapQuery(addressParts, addressDisplay);
  const exposeCoordinates = shouldExposeExactCoordinates(addressDisplay);
  const publicLatitude = exposeCoordinates ? property.latitude : "";
  const publicLongitude = exposeCoordinates ? property.longitude : "";
  const mapsUrl = getLocationMapsUrl({
    latitude: publicLatitude,
    longitude: publicLongitude,
    query: locationQuery,
  });
  const fieldVisibility = getFieldVisibility(property.type);
  const publicStats = buildPublicStatItems(property);
  const condoLabel = property.condoExempt
    ? "Isento"
    : property.condo?.trim()
      ? property.condo
      : "";
  const iptuLabel = property.iptuExempt
    ? "Isento"
    : property.iptu?.trim()
      ? `${property.iptu}${property.iptuPeriod === "mensal" ? " / mês" : " / ano"}`
      : "";
  const costParts = [
    fieldVisibility.condo && condoLabel ? `Condomínio: ${condoLabel}` : null,
    iptuLabel ? `IPTU: ${iptuLabel}` : null,
  ].filter(Boolean);

  return (
    <SiteShell>
      <main className="pt-28 sm:pt-32 pb-36 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <nav className="flex min-w-0 max-w-full text-[10px] uppercase tracking-widest text-muted gap-2">
            <Link href="/" className="hover:text-brand transition-colors shrink-0">
              Início
            </Link>
            <span className="shrink-0">/</span>
            <Link href="/imoveis" className="hover:text-brand transition-colors shrink-0">
              Imóveis
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-ink font-bold truncate">{property.title}</span>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              className="flex items-center gap-2 text-xs font-bold text-ink hover:text-brand transition-colors"
            >
              <i className="fa-solid fa-share-nodes" />
              <span className="hidden xs:inline sm:inline">Compartilhar</span>
            </button>
            <FavoriteToggleButton
              property={{
                slug: property.slug,
                title: property.title,
                location: property.location,
                priceLabel: property.priceLabel,
                image: property.image,
                ref: property.ref,
              }}
            />
          </div>
        </div>

        <PropertyGallery images={gallery} title={property.title} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-8 space-y-10 sm:space-y-12 min-w-0">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-brand/10 text-brand text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold">
                  Venda
                </span>
                <span className="text-muted text-sm tracking-widest uppercase font-bold">
                  Ref: {property.ref}
                </span>
              </div>
              <h1 className="h-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ink leading-tight break-words">
                {property.title}
              </h1>
              <p className="text-base sm:text-xl text-muted flex items-start gap-2">
                <i className="fa-solid fa-location-dot text-brand shrink-0 mt-1" />
                <span className="min-w-0 break-words">{property.locationFull}</span>
              </p>
            </div>

            {publicStats.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8 py-8 sm:py-10 border-y border-line">
                {publicStats.map((item) => (
                  <div key={item.label} className="flex flex-col items-center text-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface flex items-center justify-center text-brand">
                      <i className={`fa-solid ${item.icon} text-lg sm:text-xl`} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-ink">{item.value}</p>
                      <p className="text-[9px] sm:text-[10px] uppercase text-muted tracking-wider leading-tight">
                        {item.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!isDescriptionEmpty(property.description) && (
              <div className="space-y-4 sm:space-y-6 min-w-0">
                <h2 className="h-display text-2xl sm:text-3xl text-ink">Sobre o imóvel</h2>
                <PropertyDescription html={property.description} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {fieldVisibility.roomFlags ? (
                <FeatureBlock icon="fa-door-open" title="Cômodos" items={property.rooms} />
              ) : null}
              <FeatureBlock
                icon="fa-tree"
                title="Características"
                items={[...property.leisure, ...property.extras]}
              />
              <FeatureBlock icon="fa-map-location" title="Proximidades" items={property.proximities} />
              {((fieldVisibility.floors && property.floors > 0) ||
                (fieldVisibility.units && property.units > 0) ||
                (fieldVisibility.towers && property.towers > 0) ||
                (property.customFields?.length ?? 0) > 0 ||
                (property.roomsCustomFields?.length ?? 0) > 0 ||
                (property.locationCustomFields?.length ?? 0) > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand">
                      <i className="fa-solid fa-building text-sm" />
                    </div>
                    <h3 className="font-bold text-ink">Informações adicionais</h3>
                  </div>
                  <dl className="space-y-2 text-sm text-muted">
                    {fieldVisibility.floors && property.floors > 0 ? (
                      <div className="flex gap-2">
                        <dt className="font-medium text-ink">Andares:</dt>
                        <dd>{property.floors}</dd>
                      </div>
                    ) : null}
                    {fieldVisibility.units && property.units > 0 ? (
                      <div className="flex gap-2">
                        <dt className="font-medium text-ink">Unidades:</dt>
                        <dd>{property.units}</dd>
                      </div>
                    ) : null}
                    {fieldVisibility.towers && property.towers > 0 ? (
                      <div className="flex gap-2">
                        <dt className="font-medium text-ink">Torres:</dt>
                        <dd>{property.towers}</dd>
                      </div>
                    ) : null}
                    {[
                      ...(property.roomsCustomFields ?? []),
                      ...(property.customFields ?? []),
                      ...(property.locationCustomFields ?? []),
                    ].map((field) => (
                      <div key={`${field.label}-${field.value}`} className="flex gap-2">
                        <dt className="font-medium text-ink">{field.label}:</dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div className="flex items-end justify-between">
                <h2 className="h-display text-3xl text-ink">Localização</h2>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand hover:underline flex items-center gap-2"
                >
                  Ver no Google Maps <i className="fa-solid fa-arrow-up-right-from-square" />
                </a>
              </div>
              <LocationMap
                className="h-[400px]"
                label={property.location}
                query={locationQuery}
                latitude={publicLatitude}
                longitude={publicLongitude}
                mapsUrl={mapsUrl}
              />
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky-card bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 sm:space-y-8">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted font-bold">
                  Valor de Venda
                </p>
                <p className="text-3xl sm:text-4xl font-light text-ink break-words">
                  {property.priceLabel}
                </p>
                {costParts.length > 0 ? (
                  <p className="text-xs text-muted break-words">{costParts.join(" / ")}</p>
                ) : null}
              </div>
              {(company.listingVisibility.whatsapp && company.whatsappE164) ||
              company.listingVisibility.scheduleVisit ? (
                <div className="space-y-3 sm:space-y-4">
                  {company.listingVisibility.whatsapp && company.whatsappE164 ? (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-3 w-full bg-brand hover:bg-brandhover text-white py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all shadow-lg shadow-brand/20 hover:scale-[1.02]"
                    >
                      <i className="fa-brands fa-whatsapp text-xl" />
                      Tenho interesse neste imóvel
                    </a>
                  ) : null}
                  {company.listingVisibility.scheduleVisit ? (
                    <button
                      type="button"
                      className="w-full border border-line hover:border-ink py-4 rounded-2xl font-bold text-ink transition-all"
                    >
                      Agendar Visita
                    </button>
                  ) : null}
                </div>
              ) : null}
              {phonesOnListing.length > 0 ? (
                <div className="space-y-4 pt-8 border-t border-line">
                  <p className="text-xs font-medium text-muted">Prefere nos ligar?</p>
                  <div className="space-y-2">
                    {phonesOnListing.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone.replace(/\D/g, "")}`}
                        className="text-lg font-bold text-ink flex items-center gap-2 hover:text-brand transition-colors"
                      >
                        <i className="fa-solid fa-phone text-brand text-sm" />
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24 lg:mt-32">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
            <h2 className="h-display text-2xl sm:text-3xl md:text-4xl text-ink">
              Você também pode gostar
            </h2>
            <Link
              href="/imoveis"
              className="text-sm font-bold border-b border-ink pb-1 hover:text-brand hover:border-brand transition-colors self-start sm:self-auto"
            >
              Ver catálogo completo
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/imoveis/${item.slug}`}
                className="group cursor-pointer bg-white rounded-3xl border border-line p-3 transition-all hover:shadow-2xl hover:-translate-y-2 block"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/2 relative overflow-hidden rounded-2xl aspect-[4/3]">
                    <Image
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-ink/80 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                        {item.typeLabel}
                      </span>
                    </div>
                  </div>
                  <div className="md:w-1/2 flex flex-col justify-center space-y-4">
                    <div>
                      <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                        {item.title}
                      </h3>
                      {item.location ? (
                        <p className="text-muted text-sm">{item.location}</p>
                      ) : null}
                    </div>
                    {(() => {
                      const relatedStats = buildCompactPublicStats(item).slice(0, 3);
                      if (!relatedStats.length) return null;
                      return (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                          {relatedStats.map((stat) => (
                            <span key={stat.label} className="flex items-center gap-1">
                              <i className={`fa-solid ${stat.icon}`} /> {stat.value}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                    <p className="text-2xl font-light text-ink">{item.priceLabel}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {company.listingVisibility.whatsapp && company.whatsappE164 ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden">
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-brand text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-brand/20"
          >
            <i className="fa-brands fa-whatsapp text-lg" />
            Tenho interesse neste imóvel
          </a>
        </div>
      ) : null}
    </SiteShell>
  );
}

function FeatureBlock({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-brand">
          <i className={`fa-solid ${icon}`} />
        </div>
        <h3 className="text-xs uppercase tracking-widest font-bold text-ink">{title}</h3>
      </div>
      <ul className="grid grid-cols-2 gap-y-3 text-sm text-muted">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <i className="fa-solid fa-check text-orange text-[10px]" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
