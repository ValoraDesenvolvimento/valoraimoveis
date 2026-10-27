import { sanitizePortugueseText } from "@/lib/text-encoding";

export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

export function normalizeCep(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(value: string) {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = normalizeCep(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) return null;

  const buffer = await response.arrayBuffer();
  const payload = new TextDecoder("utf-8").decode(buffer);
  const data = JSON.parse(payload) as ViaCepAddress & { erro?: boolean };
  if (data.erro || !data.uf || !data.localidade) return null;

  return {
    cep: data.cep,
    logradouro: sanitizePortugueseText(data.logradouro || ""),
    complemento: sanitizePortugueseText(data.complemento || ""),
    bairro: sanitizePortugueseText(data.bairro || ""),
    localidade: sanitizePortugueseText(data.localidade),
    uf: data.uf,
  };
}
