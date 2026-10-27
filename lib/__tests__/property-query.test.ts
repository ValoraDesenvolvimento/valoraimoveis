import { describe, expect, it } from "vitest";
import {
  buildCatalogHref,
  buildPublishedListSql,
  normalizePage,
  paginateArray,
} from "@/lib/property-query";

describe("property-query", () => {
  it("normaliza página inválida para 1", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-2")).toBe(1);
    expect(normalizePage("3.9")).toBe(3);
  });

  it("pagina arrays com total e páginas", () => {
    const result = paginateArray([1, 2, 3, 4, 5], 2, 2);
    expect(result.items).toEqual([3, 4]);
    expect(result.total).toBe(5);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it("monta href do catálogo com página", () => {
    expect(buildCatalogHref({ tipo: "Casa" }, 1)).toBe("/imoveis?tipo=Casa");
    expect(buildCatalogHref({ tipo: "Casa" }, 2)).toBe("/imoveis?tipo=Casa&pagina=2");
  });

  it("monta SQL filtrado por tipo e preço", () => {
    const sql = buildPublishedListSql({
      filters: { tipo: "Apartamento", preco: "1000000-5000000" },
      sort: "menor-preco",
    });
    expect(sql.whereSql).toContain("status = 'Publicado'");
    expect(sql.whereSql).toContain("LOWER(type)");
    expect(sql.whereSql).toContain("price >=");
    expect(sql.whereSql).toContain("price <=");
    expect(sql.orderSql).toContain("price ASC");
    expect(sql.params).toContain("Apartamento");
    expect(sql.params).toContain(1000000);
    expect(sql.params).toContain(5000000);
  });
});
