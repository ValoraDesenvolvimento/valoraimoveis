/** Dados de contato / empresa da Valora Imóveis. */

export type CompanyPhoneContact = {
  value: string;
  /** Exibir este telefone na página de venda do imóvel. */
  showOnListing: boolean;
};

export type CompanyEmailContact = {
  value: string;
};

/** Controles extras da página pública do imóvel (venda). */
export type CompanyListingVisibility = {
  whatsapp: boolean;
  scheduleVisit: boolean;
};

export const DEFAULT_LISTING_VISIBILITY: CompanyListingVisibility = {
  whatsapp: false,
  scheduleVisit: false,
};

export type CompanySettings = {
  companyName: string;
  emails: CompanyEmailContact[];
  phones: CompanyPhoneContact[];
  /** @deprecated Preferir `emails[0].value`. */
  email: string;
  /** @deprecated Preferir `phones[0].value`. */
  phoneDisplay: string;
  whatsappDisplay: string;
  /** DDI + DDD + número, sem símbolos */
  whatsappE164: string;
  instagramHandle: string;
  instagramUrl: string;
  facebookUrl: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  listingVisibility: CompanyListingVisibility;
};

/** Estado inicial vazio — sem valores pré-preenchidos. */
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: "",
  emails: [],
  phones: [],
  email: "",
  phoneDisplay: "",
  whatsappDisplay: "",
  whatsappE164: "",
  instagramHandle: "",
  instagramUrl: "",
  facebookUrl: "",
  cep: "",
  address: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  listingVisibility: { ...DEFAULT_LISTING_VISIBILITY },
};

/** @deprecated Use getCompanySettings() / CompanySettings. Mantido para compatibilidade. */
export const contact = DEFAULT_COMPANY_SETTINGS;

export function onlyContactDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function toWhatsappE164(displayOrDigits: string) {
  const digits = onlyContactDigits(displayOrDigits);
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits.slice(0, 13);
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("instagram.com")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      const handle = url.pathname.replace(/^\/+|\/+$/g, "").split("/")[0] || "";
      return handle ? (handle.startsWith("@") ? handle : `@${handle}`) : "";
    } catch {
      return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    }
  }
  const handle = trimmed.replace(/^@/, "");
  return handle ? `@${handle}` : "";
}

export function normalizeInstagramUrl(handleOrUrl: string) {
  const handle = normalizeInstagramHandle(handleOrUrl).replace(/^@/, "");
  if (!handle) return "";
  return `https://instagram.com/${handle}`;
}

export function normalizeFacebookUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes("facebook.com") || trimmed.includes("fb.com")) {
    return `https://${trimmed.replace(/^\/+/, "")}`;
  }
  return `https://facebook.com/${trimmed.replace(/^@/, "")}`;
}

export function formatCompanyAddress(settings: CompanySettings) {
  const line1 = [settings.address, settings.number].filter(Boolean).join(", ");
  const withComplement = [line1, settings.complement].filter(Boolean).join(" — ");
  const line2 = [settings.neighborhood, settings.city, settings.state]
    .filter(Boolean)
    .join(", ");
  const cep = settings.cep ? `CEP ${settings.cep}` : "";
  return [withComplement, line2, cep].filter(Boolean).join(" · ");
}

export function hasCompanyAddress(settings: CompanySettings) {
  return Boolean(
    settings.address.trim() ||
      settings.neighborhood.trim() ||
      settings.city.trim() ||
      settings.cep.trim(),
  );
}

export function listingPhones(settings: CompanySettings) {
  return settings.phones
    .filter((phone) => phone.showOnListing && phone.value.trim())
    .map((phone) => phone.value.trim());
}

export function publicEmails(settings: CompanySettings) {
  return settings.emails.map((item) => item.value).filter(Boolean);
}

export function publicPhones(settings: CompanySettings) {
  return settings.phones.map((item) => item.value).filter(Boolean);
}

function normalizeEmails(value: unknown, legacyEmail?: string): CompanyEmailContact[] {
  const result: CompanyEmailContact[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) return;
    seen.add(email);
    result.push({ value: email });
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object" && "value" in item) {
        push(String((item as { value?: unknown }).value ?? ""));
      }
    }
  } else if (typeof value === "string") {
    push(value);
  }

  if (!result.length && legacyEmail) push(legacyEmail);
  return result;
}

function normalizePhones(
  value: unknown,
  legacyPhone?: string,
  legacyShowAll?: boolean,
): CompanyPhoneContact[] {
  const result: CompanyPhoneContact[] = [];
  const seen = new Set<string>();

  const push = (raw: string, showOnListing: boolean) => {
    const display = raw.trim();
    if (!display) return;
    const key = onlyContactDigits(display) || display.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ value: display, showOnListing });
  };

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        push(item, Boolean(legacyShowAll));
      } else if (item && typeof item === "object") {
        const entry = item as { value?: unknown; showOnListing?: unknown };
        push(String(entry.value ?? ""), Boolean(entry.showOnListing));
      }
    }
  } else if (typeof value === "string") {
    push(value, Boolean(legacyShowAll));
  }

  if (!result.length && legacyPhone) push(legacyPhone, Boolean(legacyShowAll));
  return result;
}

function normalizeListingVisibility(value: unknown): CompanyListingVisibility {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<CompanyListingVisibility> & { phones?: unknown })
      : {};
  return {
    whatsapp: Boolean(raw.whatsapp),
    scheduleVisit: Boolean(raw.scheduleVisit),
  };
}

export function normalizeCompanySettings(
  input?: Record<string, unknown> | Partial<CompanySettings> | null,
): CompanySettings {
  const raw = (input ?? {}) as Record<string, unknown> & Partial<CompanySettings>;
  const base = { ...DEFAULT_COMPANY_SETTINGS, ...raw };
  const legacyVisibility =
    raw.listingVisibility && typeof raw.listingVisibility === "object"
      ? (raw.listingVisibility as { phones?: unknown })
      : base.listingVisibility && typeof base.listingVisibility === "object"
        ? (base.listingVisibility as { phones?: unknown })
        : {};

  const emails = normalizeEmails(raw.emails ?? base.emails, raw.email ?? base.email);
  const phones = normalizePhones(
    raw.phones ?? base.phones,
    raw.phoneDisplay ?? base.phoneDisplay,
    Boolean(legacyVisibility.phones),
  );

  const whatsappDisplay = String(base.whatsappDisplay || phones[0]?.value || "").trim();
  const instagramHandle = normalizeInstagramHandle(
    String(base.instagramHandle || base.instagramUrl || ""),
  );
  const instagramUrl =
    normalizeInstagramUrl(String(base.instagramUrl || instagramHandle)) ||
    (instagramHandle ? normalizeInstagramUrl(instagramHandle) : "");
  const facebookUrl = normalizeFacebookUrl(String(base.facebookUrl || ""));

  return {
    companyName: String(base.companyName || "").trim(),
    emails,
    phones,
    email: emails[0]?.value || "",
    phoneDisplay: phones[0]?.value || "",
    whatsappDisplay,
    whatsappE164: toWhatsappE164(String(base.whatsappE164 || whatsappDisplay)),
    instagramHandle,
    instagramUrl,
    facebookUrl,
    cep: String(base.cep || "").trim(),
    address: String(base.address || "").trim(),
    number: String(base.number || "").trim(),
    complement: String(base.complement || "").trim(),
    neighborhood: String(base.neighborhood || "").trim(),
    city: String(base.city || "").trim(),
    state: String(base.state || "").trim().toUpperCase(),
    listingVisibility: normalizeListingVisibility(
      raw.listingVisibility ?? base.listingVisibility,
    ),
  };
}

export function whatsappLink(message?: string, settings?: CompanySettings) {
  const data = settings ? normalizeCompanySettings(settings) : DEFAULT_COMPANY_SETTINGS;
  if (!data.whatsappE164) return "#";
  const base = `https://wa.me/${data.whatsappE164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
