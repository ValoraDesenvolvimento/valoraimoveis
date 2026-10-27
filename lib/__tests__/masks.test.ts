import { describe, expect, it } from "vitest";
import {
  formatAreaMask,
  formatCurrencyMask,
  formatIntegerMask,
  formatPhoneMask,
  parseAreaMask,
  parseCurrencyMask,
} from "@/lib/masks";

describe("masks", () => {
  it("formata moeda brasileira", () => {
    expect(formatCurrencyMask("1234567").replace(/\s/g, " ")).toBe("R$ 1.234.567");
    expect(parseCurrencyMask("R$ 1.234.567")).toBe(1234567);
  });

  it("formata telefone celular e fixo", () => {
    expect(formatPhoneMask("21972484647")).toBe("(21) 97248-4647");
    expect(formatPhoneMask("2133334444")).toBe("(21) 3333-4444");
  });

  it("formata área e inteiros", () => {
    expect(formatAreaMask("125050")).toBe("125.050");
    expect(formatAreaMask("1250,5")).toBe("1.250,5");
    expect(parseAreaMask("1.250,50")).toBe(1250.5);
    expect(formatIntegerMask("12a3")).toBe("123");
  });
});
