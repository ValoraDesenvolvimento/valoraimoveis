import {
  formatPublicAddress,
  formatPublicLocationShort,
  normalizeAddressDisplay,
} from "@/lib/address-display";
import { normalizeDescriptionHtml } from "@/lib/description-html";
import type { Property } from "@/lib/types";

/**
 * Garante defaults dos campos novos e recalcula textos públicos de localização
 * a partir do endereço salvo — assim imóveis antigos continuam preenchidos e
 * respeitam a política de privacidade sem precisar re-salvar.
 */
export function hydrateProperty(property: Property): Property {
  const addressDisplay = normalizeAddressDisplay(property.addressDisplay);
  const parts = {
    address: property.address,
    number: property.number,
    complement: property.complement,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    cep: property.cep,
  };
  const hasAddressParts = Boolean(
    parts.address?.trim() ||
      parts.neighborhood?.trim() ||
      parts.city?.trim() ||
      parts.state?.trim(),
  );

  return {
    ...property,
    complement: property.complement ?? "",
    floors: property.floors ?? 0,
    units: property.units ?? 0,
    towers: property.towers ?? 0,
    addressDisplay,
    socialBathrooms: property.socialBathrooms ?? 0,
    condoExempt: Boolean(property.condoExempt),
    iptuExempt: Boolean(property.iptuExempt),
    iptuPeriod: property.iptuPeriod === "mensal" ? "mensal" : "anual",
    description: normalizeDescriptionHtml(property.description),
    customFields: Array.isArray(property.customFields) ? property.customFields : [],
    roomsCustomFields: Array.isArray(property.roomsCustomFields)
      ? property.roomsCustomFields
      : [],
    locationCustomFields: Array.isArray(property.locationCustomFields)
      ? property.locationCustomFields
      : [],
    location: hasAddressParts
      ? formatPublicLocationShort(parts, addressDisplay) || property.location
      : property.location,
    locationFull: hasAddressParts
      ? formatPublicAddress(parts, addressDisplay) || property.locationFull
      : property.locationFull,
  };
}
