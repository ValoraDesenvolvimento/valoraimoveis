/** Máscaras de input no padrão brasileiro. */

export function onlyDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");
  return typeof maxLength === "number" ? digits.slice(0, maxLength) : digits;
}

export function formatCurrencyMask(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function parseCurrencyMask(value: string) {
  return Number(onlyDigits(value)) || 0;
}

/** Telefone BR: (21) 97248-4647 ou (21) 3333-4444 */
export function formatPhoneMask(value: string) {
  const digits = onlyDigits(value, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Inteiro simples (quartos, vagas, andares…). */
export function formatIntegerMask(value: string, maxLength = 6) {
  return onlyDigits(value, maxLength);
}

/** Área pt-BR: 1.250 ou 1.250,50 */
export function formatAreaMask(value: string) {
  const cleaned = value.replace(/[^\d,]/g, "");
  if (!cleaned) return "";

  const commaIndex = cleaned.indexOf(",");
  const hasComma = commaIndex >= 0;
  const intRaw = (hasComma ? cleaned.slice(0, commaIndex) : cleaned).replace(/\D/g, "");
  const decRaw = hasComma ? cleaned.slice(commaIndex + 1).replace(/\D/g, "").slice(0, 2) : "";

  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (hasComma) return `${intFormatted},${decRaw}`;
  return intFormatted;
}

export function parseAreaMask(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
