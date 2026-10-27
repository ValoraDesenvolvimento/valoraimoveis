import { beforeEach, describe, expect, it } from "vitest";
import { sampleProperties } from "@/lib/__tests__/fixtures";
import * as memoryStore from "@/lib/memory-store";
import type { PropertyInput } from "@/lib/types";

describe("memory-store", () => {
  beforeEach(() => {
    memoryStore.resetMemoryStoreForTests();
    for (const property of sampleProperties) {
      memoryStore.createProperty({
        ...property,
        id: property.id,
        slug: property.slug,
      });
    }
  });

  it("lista imóveis publicados via filtro de status", () => {
    const published = memoryStore.listProperties({ publishedOnly: true });
    expect(published).toHaveLength(2);
  });

  it("pagina listagem sob demanda", () => {
    const page1 = memoryStore.listPropertiesPage({
      publishedOnly: true,
      page: 1,
      pageSize: 1,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.total).toBe(2);
    expect(page1.totalPages).toBe(2);

    const page2 = memoryStore.listPropertiesPage({
      publishedOnly: true,
      page: 2,
      pageSize: 1,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
  });

  it("expõe facets leves sem carregar descrição", () => {
    const facets = memoryStore.getPublishedFacets();
    expect(facets.types).toContain("Casa");
    expect(facets.cities).toContain("Curitiba");
    expect(facets.refs.length).toBeGreaterThan(0);
  });

  it("busca por slug e id", () => {
    expect(memoryStore.getPropertyBySlug("apto-batel")?.title).toBe("Apartamento Batel");
    expect(memoryStore.getPropertyById("p1")?.ref).toBe("VAL-001");
  });

  it("cria imóvel com slug único", () => {
    const created = memoryStore.createProperty({
      title: "Nova Casa",
      type: "Casa",
      price: 500000,
      status: "Publicado",
      bedrooms: 2,
      suites: 1,
      bathrooms: 1,
      parking: 1,
      area: 100,
      builtArea: 90,
      landArea: 100,
      city: "Curitiba",
      neighborhood: "Centro",
      state: "PR",
    } as PropertyInput);

    expect(created.slug).toBe("nova-casa");
    expect(memoryStore.listProperties()).toHaveLength(4);
  });

  it("atualiza imóvel existente", () => {
    const updated = memoryStore.updateProperty("p1", {
      title: "Casa Atualizada",
      type: "Casa",
      price: 900000,
      status: "Publicado",
      bedrooms: 3,
      suites: 1,
      bathrooms: 2,
      parking: 2,
      area: 180,
      builtArea: 160,
      landArea: 180,
      city: "Curitiba",
      neighborhood: "Centro",
      state: "PR",
    } as PropertyInput);

    expect(updated?.title).toBe("Casa Atualizada");
    expect(updated?.priceLabel).toContain("900");
  });

  it("persiste description rich text e campos extras separados", () => {
    const updated = memoryStore.updateProperty("p1", {
      ...sampleProperties[0],
      description: "<h2>Destaques</h2><p>Casa <strong>reformada</strong></p><ul><li>Piscina</li></ul>",
      customFields: [{ label: "Pé-direito", value: "3m" }],
      roomsCustomFields: [{ label: "Closet", value: "2" }],
      locationCustomFields: [{ label: "Condomínio", value: "Verde" }],
      socialBathrooms: 1,
      addressDisplay: "city",
    } as PropertyInput);

    expect(updated?.description).toContain("<strong>reformada</strong>");
    expect(updated?.description).toContain("<li>Piscina</li>");
    expect(updated?.customFields).toEqual([{ label: "Pé-direito", value: "3m" }]);
    expect(updated?.roomsCustomFields).toEqual([{ label: "Closet", value: "2" }]);
    expect(updated?.locationCustomFields).toEqual([
      { label: "Condomínio", value: "Verde" },
    ]);
    expect(updated?.socialBathrooms).toBe(1);
    expect(updated?.addressDisplay).toBe("city");
  });

  it("converte description legada em HTML ao salvar", () => {
    const updated = memoryStore.updateProperty("p2", {
      ...sampleProperties[1],
      description: ["Sala ampla.", "Varanda gourmet."] as unknown as string,
    } as PropertyInput);

    expect(updated?.description).toBe("<p>Sala ampla.</p><p>Varanda gourmet.</p>");
  });

  it("limpa description vazia (<p></p>)", () => {
    const updated = memoryStore.updateProperty("p2", {
      ...sampleProperties[1],
      description: "<p></p>",
    } as PropertyInput);

    expect(updated?.description).toBe("");
  });

  it("exclui imóvel", () => {
    expect(memoryStore.deleteProperty("p2")).toBe(true);
    expect(memoryStore.getPropertyById("p2")).toBeNull();
  });

  it("listAdminProperties retorna dados para tabela admin", () => {
    const items = memoryStore.listAdminProperties();
    expect(items[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      ref: expect.any(String),
      status: expect.any(String),
    });
  });
});
