import { describe, expect, it } from "vitest";
import { rowToProperty, type PropertyRow } from "@/lib/property-mapper";

function baseRow(overrides: Partial<PropertyRow> = {}): PropertyRow {
  return {
    id: "row-1",
    slug: "casa-teste",
    title: "Casa Teste",
    location: "Centro",
    location_full: "Centro, Curitiba",
    city: "Curitiba",
    neighborhood: "Centro",
    state: "PR",
    cep: "80010-000",
    address: "Rua A",
    number: "10",
    complement: "",
    floors: 0,
    units: 0,
    towers: 0,
    address_display: "street",
    latitude: "",
    longitude: "",
    type: "Casa",
    type_label: "Casa",
    price: 100000,
    price_label: "R$ 100.000",
    ref: "VAL-T",
    status: "Publicado",
    bedrooms: 2,
    suites: 1,
    bathrooms: 1,
    social_bathrooms: 1,
    parking: 1,
    area: 100,
    built_area: 90,
    land_area: 120,
    image: "",
    images: "[]",
    featured: false,
    highlight: false,
    description: '["Parágrafo legado."]',
    condo: "",
    condo_exempt: false,
    iptu: "",
    iptu_period: "anual",
    iptu_exempt: false,
    rooms: "[]",
    leisure: "[]",
    extras: "[]",
    proximities: "[]",
    custom_fields: '[{"label":"Ano","value":"2020"}]',
    rooms_custom_fields: '[{"label":"Closet","value":"1"}]',
    location_custom_fields: '[{"label":"Condomínio","value":"Alfa"}]',
    broker: '{"name":"Equipe","creci":"1","avatar":""}',
    created_at: "2026-01-01T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("property-mapper", () => {
  it("converte description legada (JSON array) em HTML", () => {
    const property = rowToProperty(baseRow());
    expect(property.description).toBe("<p>Parágrafo legado.</p>");
  });

  it("mantém description HTML e campos extras de localização/características", () => {
    const property = rowToProperty(
      baseRow({
        description: "<h2>Sobre</h2><p>Rich <strong>text</strong></p>",
      }),
    );

    expect(property.description).toContain("<h2>Sobre</h2>");
    expect(property.description).toContain("<strong>text</strong>");
    expect(property.customFields).toEqual([{ label: "Ano", value: "2020" }]);
    expect(property.roomsCustomFields).toEqual([{ label: "Closet", value: "1" }]);
    expect(property.locationCustomFields).toEqual([
      { label: "Condomínio", value: "Alfa" },
    ]);
    expect(property.socialBathrooms).toBe(1);
  });

  it("normaliza address_display inválido", () => {
    const property = rowToProperty(baseRow({ address_display: "xyz" }));
    expect(property.addressDisplay).toBe("street");
  });
});
