import { describe, expect, it } from "vitest";
import { sampleProperties } from "@/lib/__tests__/fixtures";
import {
  buildCompactPublicStats,
  buildPublicStatItems,
  getFieldVisibility,
} from "@/lib/property-type-fields";

describe("property-type-fields", () => {
  it("apartamento mostra andares/unidades/torres e esconde área terreno", () => {
    const visibility = getFieldVisibility("Apartamento");
    expect(visibility.floors).toBe(true);
    expect(visibility.units).toBe(true);
    expect(visibility.towers).toBe(true);
    expect(visibility.complement).toBe(true);
    expect(visibility.landArea).toBe(false);
    expect(visibility.condo).toBe(true);
  });

  it("casa/sobrado mostram terreno e escondem andares", () => {
    for (const type of ["Casa", "Sobrado"] as const) {
      const visibility = getFieldVisibility(type);
      expect(visibility.landArea).toBe(true);
      expect(visibility.floors).toBe(false);
      expect(visibility.units).toBe(false);
      expect(visibility.towers).toBe(false);
      expect(visibility.socialBathrooms).toBe(true);
      expect(visibility.roomFlags).toBe(true);
    }
  });

  it("studio/cobertura seguem regras de unidade", () => {
    for (const type of ["Studio", "Cobertura"] as const) {
      const visibility = getFieldVisibility(type);
      expect(visibility.floors).toBe(true);
      expect(visibility.complement).toBe(true);
      expect(visibility.landArea).toBe(false);
    }
  });

  it("terreno esconde cômodos e mostra área terreno", () => {
    const visibility = getFieldVisibility("Terreno");
    expect(visibility.bedrooms).toBe(false);
    expect(visibility.roomFlags).toBe(false);
    expect(visibility.landArea).toBe(true);
    expect(visibility.area).toBe(false);
    expect(visibility.condo).toBe(false);
    expect(visibility.floors).toBe(false);
  });

  it("não lista stats zerados no público", () => {
    const items = buildPublicStatItems({
      ...sampleProperties[0],
      type: "Casa",
      bedrooms: 0,
      suites: 0,
      bathrooms: 2,
      socialBathrooms: 0,
      parking: 0,
      area: 180,
      landArea: 0,
    });

    expect(items.map((item) => item.label)).toEqual(["Banheiros", "Área total"]);
  });

  it("inclui banheiro social quando preenchido", () => {
    const items = buildPublicStatItems({
      ...sampleProperties[0],
      type: "Casa",
      bedrooms: 0,
      suites: 0,
      bathrooms: 0,
      socialBathrooms: 1,
      parking: 0,
      area: 0,
      landArea: 0,
    });

    expect(items).toEqual([
      { icon: "fa-toilet", value: 1, label: "Banheiro social" },
    ]);
  });

  it("não mostra quartos em terreno mesmo com valor preenchido", () => {
    const items = buildPublicStatItems({
      ...sampleProperties[2],
      type: "Terreno",
      bedrooms: 3,
      bathrooms: 2,
      landArea: 500,
      area: 0,
    });

    expect(items.map((item) => item.label)).toEqual(["Área terreno"]);
  });

  it("compacta stats para cards/carrossel", () => {
    const compact = buildCompactPublicStats({
      ...sampleProperties[0],
      bedrooms: 3,
      suites: 1,
      bathrooms: 2,
      socialBathrooms: 1,
      parking: 2,
      area: 180,
    });
    expect(compact.length).toBeLessThanOrEqual(4);
  });
});
