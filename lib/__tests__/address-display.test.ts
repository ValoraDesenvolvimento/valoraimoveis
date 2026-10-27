import { describe, expect, it } from "vitest";
import {
  buildPublicMapQuery,
  formatAddressPreview,
  formatPublicAddress,
  formatPublicLocationShort,
  normalizeAddressDisplay,
} from "@/lib/address-display";

const sample = {
  address: "Rua das Flores",
  number: "120",
  complement: "Apto 402",
  neighborhood: "Batel",
  city: "Curitiba",
  state: "PR",
};

describe("address-display", () => {
  it("normaliza valores inválidos para street", () => {
    expect(normalizeAddressDisplay("xyz")).toBe("street");
    expect(normalizeAddressDisplay("all")).toBe("all");
    expect(normalizeAddressDisplay("city")).toBe("city");
  });

  it("formata endereço completo", () => {
    expect(formatPublicAddress(sample, "all")).toBe(
      "Rua das Flores, 120 — Apto 402 — Batel, Curitiba, PR",
    );
  });

  it("formata somente rua e bairro", () => {
    expect(formatPublicAddress(sample, "street")).toBe("Rua das Flores — Batel");
    expect(formatPublicLocationShort(sample, "street")).toBe("Rua das Flores · Batel");
  });

  it("formata somente bairro e cidade", () => {
    expect(formatPublicAddress(sample, "neighborhood")).toBe("Batel, Curitiba");
  });

  it("formata somente cidade e estado", () => {
    expect(formatPublicAddress(sample, "city")).toBe("Curitiba, PR");
    expect(formatPublicLocationShort(sample, "city")).toBe("Curitiba, PR");
  });

  it("monta query de mapa conforme o nível", () => {
    expect(buildPublicMapQuery(sample, "street")).toBe(
      "Rua das Flores, Batel, Curitiba, PR",
    );
    expect(buildPublicMapQuery(sample, "all")).toContain("120");
    expect(buildPublicMapQuery(sample, "city")).toBe("Curitiba, PR");
  });

  it("usa placeholders na prévia quando o cadastro ainda está vazio", () => {
    expect(formatAddressPreview({}, "street")).toBe("Rua das Palmeiras — Centro");
  });
});
