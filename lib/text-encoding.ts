/** Normaliza texto PT-BR e tenta reparar mojibake comum (UTF-8 lido como Latin-1). */
export function sanitizePortugueseText(value: string): string {
  if (!value) return value;

  let text = value.normalize("NFC").trim();

  if (/Ã.|Â.|Ã/.test(text)) {
    try {
      const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
      const repaired = new TextDecoder("utf-8").decode(bytes);
      if (repaired && !repaired.includes("\uFFFD")) {
        text = repaired.normalize("NFC").trim();
      }
    } catch {
      // mantém o texto original
    }
  }

  return text;
}

function compactLetters(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\uFFFD/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 0; i < a.length; i += 1) {
    let prev = i;
    row[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const current = row[j + 1];
      const cost = a[i] === b[j] ? 0 : 1;
      row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, prev + cost);
      prev = current;
    }
  }
  return row[b.length];
}

/**
 * Resolve o nome da cidade contra a lista oficial (IBGE), corrigindo
 * valores corrompidos como "Jaragu� do Sul".
 */
export function resolveCityName(city: string, cities: string[]): string {
  const cleaned = sanitizePortugueseText(city);
  if (!cleaned) return cleaned;
  if (cities.includes(cleaned)) return cleaned;

  const target = compactLetters(cleaned);
  if (!target) return cleaned;

  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of cities) {
    const compact = compactLetters(candidate);
    if (!compact) continue;
    if (compact === target) return candidate;

    const score = levenshtein(compact, target);
    const maxAllowed = Math.max(1, Math.floor(target.length / 8));
    if (score <= maxAllowed && score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best ?? cleaned;
}
