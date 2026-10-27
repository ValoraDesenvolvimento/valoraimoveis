import { describe, expect, it } from "vitest";
import {
  isDescriptionEmpty,
  normalizeDescriptionHtml,
  sanitizeDescriptionHtml,
  stripDescriptionHtml,
} from "@/lib/description-html";

describe("description-html", () => {
  it("converte array legado em parágrafos HTML", () => {
    expect(normalizeDescriptionHtml(["Primeiro.", "Segundo."])).toBe(
      "<p>Primeiro.</p><p>Segundo.</p>",
    );
  });

  it("converte JSON string de array legado", () => {
    expect(normalizeDescriptionHtml('["Parágrafo legado."]')).toBe(
      "<p>Parágrafo legado.</p>",
    );
  });

  it("converte texto plano com quebras de parágrafo", () => {
    expect(normalizeDescriptionHtml("Linha A.\n\nLinha B.")).toBe(
      "<p>Linha A.</p><p>Linha B.</p>",
    );
  });

  it("aceita HTML já formatado e preserva estrutura permitida", () => {
    const html =
      "<h2>Destaques</h2><p>Casa <strong>ampla</strong></p><ul><li>Piscina</li></ul>";
    expect(normalizeDescriptionHtml(html)).toContain("<h2>Destaques</h2>");
    expect(normalizeDescriptionHtml(html)).toContain("<strong>ampla</strong>");
    expect(normalizeDescriptionHtml(html)).toContain("<li>Piscina</li>");
  });

  it("normaliza array com um único blob HTML", () => {
    expect(normalizeDescriptionHtml(["<p>Único</p><h3>Extra</h3>"])).toContain(
      "<p>Único</p>",
    );
  });

  it("mantém HTML e remove tags/atributos perigosos", () => {
    const html = sanitizeDescriptionHtml(
      '<p>Ok</p><script>alert(1)</script><strong onclick="x">Bold</strong><a href="javascript:alert(1)">x</a>',
    );
    expect(html).toContain("<p>Ok</p>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).not.toContain("script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a");
  });

  it("detecta descrição vazia e extrai texto plano", () => {
    expect(isDescriptionEmpty("")).toBe(true);
    expect(isDescriptionEmpty("<p></p>")).toBe(true);
    expect(isDescriptionEmpty("<p><br></p>")).toBe(true);
    expect(isDescriptionEmpty("<p>Casa ampla</p>")).toBe(false);
    expect(stripDescriptionHtml("<p>Casa <strong>ampla</strong></p>")).toBe("Casa ampla");
    expect(stripDescriptionHtml("<h2>Título</h2><p>Texto</p>")).toBe("Título Texto");
  });

  it("trata valores inválidos como vazio", () => {
    expect(normalizeDescriptionHtml(null)).toBe("");
    expect(normalizeDescriptionHtml(undefined)).toBe("");
    expect(normalizeDescriptionHtml(42)).toBe("");
    expect(normalizeDescriptionHtml([])).toBe("");
  });

  it("remove script e preserva parágrafo seguro", () => {
    const html = normalizeDescriptionHtml(["<script>x</script><p>Ok</p>"]);
    expect(html).not.toContain("script");
    expect(html).toContain("<p>Ok</p>");
  });

  it("escapa tags em texto plano legado", () => {
    expect(normalizeDescriptionHtml("Valor 10 < 20 metros")).toContain("&lt;");
  });
});
