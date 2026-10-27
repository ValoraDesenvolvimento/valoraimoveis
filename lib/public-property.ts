import {
  formatPublicAddress,
  formatPublicLocationShort,
  normalizeAddressDisplay,
  shouldExposeExactCoordinates,
  type AddressParts,
} from "@/lib/address-display";
import type { Property } from "@/lib/types";

/** Campos sensíveis omitidos ou redigidos na API/página pública. */
export type PublicProperty = Omit<
  Property,
  | "cep"
  | "address"
  | "number"
  | "complement"
  | "latitude"
  | "longitude"
  | "addressDisplay"
> & {
  cep: string;
  address: string;
  number: string;
  complement: string;
  latitude: string;
  longitude: string;
  addressDisplay: Property["addressDisplay"];
};

function addressParts(property: Property): AddressParts {
  return {
    address: property.address,
    number: property.number,
    complement: property.complement,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    cep: property.cep,
  };
}

/** Remove detalhes de endereço/coordenadas conforme a política do anúncio. */
export function toPublicProperty(property: Property): PublicProperty {
  const display = normalizeAddressDisplay(property.addressDisplay);
  const parts = addressParts(property);
  const exposeExact = shouldExposeExactCoordinates(display);

  return {
    ...property,
    location: formatPublicLocationShort(parts, display),
    locationFull: formatPublicAddress(parts, display),
    address: display === "all" || display === "street" ? property.address : "",
    number: exposeExact ? property.number : "",
    complement: exposeExact ? property.complement : "",
    cep: exposeExact ? property.cep : "",
    latitude: exposeExact ? property.latitude : "",
    longitude: exposeExact ? property.longitude : "",
    addressDisplay: display,
  };
}
