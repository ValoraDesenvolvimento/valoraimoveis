import { describe, expect, it } from "vitest";
import { sampleProperties } from "@/lib/__tests__/fixtures";
import { toPublicProperty } from "@/lib/public-property";

describe("toPublicProperty", () => {
  it("remove número, CEP e coordenadas quando display é street", () => {
    const source = {
      ...sampleProperties[0],
      address: "Rua das Flores",
      number: "120",
      complement: "Apto 1",
      cep: "80010-000",
      latitude: "-25.4",
      longitude: "-49.2",
      addressDisplay: "street" as const,
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
    };

    const publicProperty = toPublicProperty(source);

    expect(publicProperty.number).toBe("");
    expect(publicProperty.complement).toBe("");
    expect(publicProperty.cep).toBe("");
    expect(publicProperty.latitude).toBe("");
    expect(publicProperty.longitude).toBe("");
    expect(publicProperty.address).toBe("Rua das Flores");
    expect(publicProperty.locationFull).toBe("Rua das Flores — Batel");
  });

  it("omite a rua quando display é neighborhood", () => {
    const source = {
      ...sampleProperties[0],
      address: "Rua das Flores",
      number: "120",
      addressDisplay: "neighborhood" as const,
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
    };

    const publicProperty = toPublicProperty(source);
    expect(publicProperty.address).toBe("");
    expect(publicProperty.locationFull).toBe("Batel, Curitiba");
  });

  it("mantém apenas cidade/estado quando display é city", () => {
    const source = {
      ...sampleProperties[0],
      address: "Rua das Flores",
      number: "120",
      complement: "Apto 1",
      cep: "80010-000",
      latitude: "-25.4",
      longitude: "-49.2",
      addressDisplay: "city" as const,
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
    };

    const publicProperty = toPublicProperty(source);
    expect(publicProperty.address).toBe("");
    expect(publicProperty.number).toBe("");
    expect(publicProperty.locationFull).toBe("Curitiba, PR");
    expect(publicProperty.latitude).toBe("");
  });

  it("expõe endereço completo quando display é all", () => {
    const source = {
      ...sampleProperties[0],
      address: "Rua das Flores",
      number: "120",
      complement: "Fundos",
      cep: "80010-000",
      latitude: "-25.4",
      longitude: "-49.2",
      addressDisplay: "all" as const,
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
    };

    const publicProperty = toPublicProperty(source);
    expect(publicProperty.number).toBe("120");
    expect(publicProperty.cep).toBe("80010-000");
    expect(publicProperty.latitude).toBe("-25.4");
    expect(publicProperty.locationFull).toContain("120");
  });

  it("preserva description HTML e campos extras no público", () => {
    const source = {
      ...sampleProperties[0],
      description: "<h2>Sobre</h2><p>Texto <strong>rico</strong></p>",
      customFields: [{ label: "Ano", value: "2020" }],
      locationCustomFields: [{ label: "Portaria", value: "24h" }],
    };

    const publicProperty = toPublicProperty(source);
    expect(publicProperty.description).toContain("<strong>rico</strong>");
    expect(publicProperty.customFields).toEqual([{ label: "Ano", value: "2020" }]);
    expect(publicProperty.locationCustomFields).toEqual([
      { label: "Portaria", value: "24h" },
    ]);
  });
});
