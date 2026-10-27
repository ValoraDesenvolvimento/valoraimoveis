/** Dados de contato da Valora Imóveis (RJ). */
export const contact = {
  city: "Rio de Janeiro",
  state: "RJ",
  cityState: "Rio de Janeiro, RJ",
  phoneDisplay: "(21) 97248-4647",
  whatsappDisplay: "(21) 97248-4647",
  /** DDI + DDD + número, sem símbolos */
  whatsappE164: "5521972484647",
  email: "valoraimoveis7@gmail.com",
  instagramHandle: "@valoraimoveisrj",
  instagramUrl: "https://instagram.com/valoraimoveisrj",
} as const;

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${contact.whatsappE164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
