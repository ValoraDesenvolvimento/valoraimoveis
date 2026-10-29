import { describe, expect, it } from "vitest";
import {
  formatCompanyAddress,
  listingPhones,
  normalizeCompanySettings,
  normalizeFacebookUrl,
  normalizeInstagramHandle,
  toWhatsappE164,
  whatsappLink,
} from "@/lib/contact";

describe("contact helpers", () => {
  it("normaliza WhatsApp E164", () => {
    expect(toWhatsappE164("(21) 97248-4647")).toBe("5521972484647");
    expect(toWhatsappE164("5521972484647")).toBe("5521972484647");
  });

  it("normaliza Instagram", () => {
    expect(normalizeInstagramHandle("valoraimoveisrj")).toBe("@valoraimoveisrj");
    expect(normalizeInstagramHandle("@valoraimoveisrj")).toBe("@valoraimoveisrj");
    expect(normalizeInstagramHandle("https://instagram.com/valoraimoveisrj")).toBe(
      "@valoraimoveisrj",
    );
  });

  it("normaliza Facebook", () => {
    expect(normalizeFacebookUrl("valoraimoveisrj")).toBe(
      "https://facebook.com/valoraimoveisrj",
    );
    expect(normalizeFacebookUrl("https://facebook.com/valoraimoveisrj")).toBe(
      "https://facebook.com/valoraimoveisrj",
    );
  });

  it("monta endereço e link do WhatsApp", () => {
    const settings = normalizeCompanySettings({
      address: "Rua A",
      number: "10",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ",
      cep: "20000-000",
      whatsappDisplay: "(21) 97248-4647",
    });
    expect(formatCompanyAddress(settings)).toContain("Rua A, 10");
    expect(whatsappLink("Oi", settings)).toContain("5521972484647");
    expect(whatsappLink("Oi", settings)).toContain("text=");
  });

  it("aceita múltiplos e-mails e telefones com flag", () => {
    const settings = normalizeCompanySettings({
      emails: [{ value: "A@Valora.com" }, { value: "b@valora.com" }, { value: "a@valora.com" }],
      phones: [
        { value: "(21) 3333-4444", showOnListing: true },
        { value: "(21) 99999-8888", showOnListing: false },
        { value: "(21) 3333-4444", showOnListing: true },
      ],
    });
    expect(settings.emails.map((item) => item.value)).toEqual([
      "a@valora.com",
      "b@valora.com",
    ]);
    expect(settings.phones).toEqual([
      { value: "(21) 3333-4444", showOnListing: true },
      { value: "(21) 99999-8888", showOnListing: false },
    ]);
    expect(listingPhones(settings)).toEqual(["(21) 3333-4444"]);
  });

  it("não preenche valores padrão quando vazio", () => {
    const settings = normalizeCompanySettings({});
    expect(settings.companyName).toBe("");
    expect(settings.emails).toEqual([]);
    expect(settings.phones).toEqual([]);
    expect(settings.email).toBe("");
    expect(settings.phoneDisplay).toBe("");
    expect(settings.whatsappDisplay).toBe("");
    expect(settings.whatsappE164).toBe("");
    expect(settings.instagramHandle).toBe("");
    expect(settings.city).toBe("");
    expect(settings.listingVisibility).toEqual({
      whatsapp: false,
      scheduleVisit: false,
    });
    expect(whatsappLink("Oi", settings)).toBe("#");
  });

  it("respeita toggles da página de venda", () => {
    const settings = normalizeCompanySettings({
      listingVisibility: {
        whatsapp: true,
        scheduleVisit: true,
      },
    });
    expect(settings.listingVisibility.whatsapp).toBe(true);
    expect(settings.listingVisibility.scheduleVisit).toBe(true);
  });
});
