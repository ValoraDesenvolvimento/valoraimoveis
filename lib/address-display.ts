/** Níveis de divulgação de endereço no anúncio público. */
export type AddressDisplay = "all" | "street" | "neighborhood" | "city";

export type AddressParts = {
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
};

export const ADDRESS_DISPLAY_OPTIONS: {
  value: AddressDisplay;
  label: string;
  description: string;
}[] = [
  {
    value: "all",
    label: "Endereço completo",
    description: "Rua, número, bairro, cidade e estado.",
  },
  {
    value: "street",
    label: "Somente rua e bairro",
    description: "Rua e bairro, sem número nem complemento.",
  },
  {
    value: "neighborhood",
    label: "Somente bairro e cidade",
    description: "Bairro e cidade, sem rua nem número.",
  },
  {
    value: "city",
    label: "Somente cidade e estado",
    description: "Apenas cidade e estado — máxima privacidade.",
  },
];

export function normalizeAddressDisplay(value: unknown): AddressDisplay {
  if (value === "all" || value === "street" || value === "neighborhood" || value === "city") {
    return value;
  }
  return "street";
}

/** Texto público do anúncio conforme o nível de visibilidade. */
export function formatPublicAddress(
  parts: AddressParts,
  display: AddressDisplay = "street",
): string {
  const street = parts.address?.trim() || "";
  const number = parts.number?.trim() || "";
  const complement = parts.complement?.trim() || "";
  const neighborhood = parts.neighborhood?.trim() || "";
  const city = parts.city?.trim() || "";
  const state = parts.state?.trim() || "";

  if (display === "city") {
    return [city, state].filter(Boolean).join(", ") || "Localização sob consulta";
  }

  if (display === "neighborhood") {
    return [neighborhood, city].filter(Boolean).join(", ") || city || "Localização sob consulta";
  }

  if (display === "all") {
    const streetLine = [street, number].filter(Boolean).join(", ");
    const withComplement = [streetLine, complement].filter(Boolean).join(" — ");
    const area = [neighborhood, [city, state].filter(Boolean).join(", ")].filter(Boolean).join(", ");
    return [withComplement, area].filter(Boolean).join(" — ") || area || "Localização sob consulta";
  }

  // street: rua e bairro (sem número/complemento)
  if (street && neighborhood) return `${street} — ${neighborhood}`;
  if (street && city) return `${street} — ${city}`;
  return [street, neighborhood, city].filter(Boolean).join(", ") || "Localização sob consulta";
}

/** Versão curta para cards. */
export function formatPublicLocationShort(
  parts: AddressParts,
  display: AddressDisplay = "street",
): string {
  const street = parts.address?.trim() || "";
  const neighborhood = parts.neighborhood?.trim() || "";
  const city = parts.city?.trim() || "";
  const state = parts.state?.trim() || "";

  if (display === "city") {
    return [city, state].filter(Boolean).join(", ") || "Localização sob consulta";
  }

  if (display === "neighborhood") {
    return [neighborhood, city].filter(Boolean).join(", ") || city || "Localização sob consulta";
  }

  if (display === "all" || display === "street") {
    if (street && neighborhood) return `${street} · ${neighborhood}`;
    if (street && city) return `${street} · ${city}`;
    return [neighborhood, city].filter(Boolean).join(", ") || street || "Localização sob consulta";
  }

  return [neighborhood, city].filter(Boolean).join(", ") || "Localização sob consulta";
}

/** Query de mapa pública: só envia o que o nível de privacidade permite. */
export function buildPublicMapQuery(
  parts: AddressParts,
  display: AddressDisplay = "street",
): string {
  const street = parts.address?.trim() || "";
  const number = parts.number?.trim() || "";
  const neighborhood = parts.neighborhood?.trim() || "";
  const city = parts.city?.trim() || "";
  const state = parts.state?.trim() || "";

  if (display === "city") {
    return [city, state].filter(Boolean).join(", ");
  }

  if (display === "neighborhood") {
    return [neighborhood, city, state].filter(Boolean).join(", ");
  }

  if (display === "all") {
    return [street, number, neighborhood, city, state].filter(Boolean).join(", ");
  }

  return [street, neighborhood, city, state].filter(Boolean).join(", ");
}

export function shouldExposeExactCoordinates(display: AddressDisplay) {
  return display === "all";
}

/** Texto da prévia no formulário (usa dados reais do cadastro quando existirem). */
export function formatAddressPreview(
  parts: AddressParts,
  display: AddressDisplay,
): string {
  const previewParts: AddressParts = {
    address: parts.address?.trim() || "Rua das Palmeiras",
    number: parts.number?.trim() || "100",
    complement: parts.complement?.trim() || "",
    neighborhood: parts.neighborhood?.trim() || "Centro",
    city: parts.city?.trim() || "Jaraguá do Sul",
    state: parts.state?.trim() || "SC",
  };
  return formatPublicAddress(previewParts, display);
}
