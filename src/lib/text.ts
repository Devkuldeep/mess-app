// Small text helpers shared by UI components.

/** First user-visible character (grapheme), so Hindi conjuncts like "क्ष" stay whole. */
function firstGrapheme(word: string): string {
  if (!word) return "";
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const it = new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word)[Symbol.iterator]().next();
    return it.done ? "" : it.value.segment;
  }
  return Array.from(word)[0] ?? "";
}

/**
 * First full letter of the first two words: "Aman Verma" → "AV",
 * "रवि कुमार" → "रकु" (a letter keeps its vowel sign), "क्षमा शर्मा" → "क्षश".
 */
export function initials(name: string, max = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, max)
    .map((w) => firstGrapheme(w).toLocaleUpperCase())
    .join("");
}
