import { describe, expect, it } from "vitest";
import { sampleProperties } from "@/lib/__tests__/fixtures";
import { hydrateProperty } from "@/lib/property-display";

describe("hydrateProperty", () => {
  it("preenche defaults sem apagar dados antigos", () => {
    const legacy = {
      ...sampleProperties[0],
      complement: undefined as unknown as string,
      socialBathrooms: undefined as unknown as number,
      customFields: undefined as unknown as [],
      roomsCustomFields: undefined as unknown as [],
      locationCustomFields: undefined as unknown as [],
      condoExempt: undefined as unknown as boolean,
      iptuPeriod: undefined as unknown as "anual",
    };

    const hydrated = hydrateProperty(legacy);

    expect(hydrated.title).toBe(sampleProperties[0].title);
    expect(hydrated.bedrooms).toBe(sampleProperties[0].bedrooms);
    expect(hydrated.price).toBe(sampleProperties[0].price);
    expect(hydrated.complement).toBe("");
    expect(hydrated.socialBathrooms).toBe(0);
    expect(hydrated.customFields).toEqual([]);
    expect(hydrated.roomsCustomFields).toEqual([]);
    expect(hydrated.locationCustomFields).toEqual([]);
    expect(hydrated.condoExempt).toBe(false);
    expect(hydrated.iptuPeriod).toBe("anual");
  });

  it("recalcula localização pública a partir do endereço", () => {
    const property = hydrateProperty({
      ...sampleProperties[0],
      address: "Rua das Flores",
      number: "120",
      neighborhood: "Batel",
      city: "Curitiba",
      state: "PR",
      addressDisplay: "street",
      location: "texto antigo com número 120",
      locationFull: "texto antigo completo 120",
    });

    expect(property.locationFull).toBe("Rua das Flores — Batel");
    expect(property.locationFull).not.toContain("120");
  });
});
