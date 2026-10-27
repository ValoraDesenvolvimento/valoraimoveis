import { describe, expect, it } from "vitest";
import { resolveCityName, sanitizePortugueseText } from "@/lib/text-encoding";

describe("text-encoding", () => {
  it("repara mojibake UTF-8 lido como Latin-1", () => {
    expect(sanitizePortugueseText("JaraguÃ¡ do Sul")).toBe("Jaraguá do Sul");
  });

  it("corrige cidade com caractere de substituição", () => {
    const cities = ["Joinville", "Jaraguá do Sul", "Blumenau"];
    expect(resolveCityName("Jaragu\uFFFD do Sul", cities)).toBe("Jaraguá do Sul");
  });
});
