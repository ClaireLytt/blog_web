// CJK is read per character (~300 chars/min); Latin per word (~200 words/min).
// Mixed-content posts (e.g. Chinese prose with English code) get both counted.
const CJK = /[一-鿿㐀-䶿぀-ヿ가-힯]/g;

export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const cjkChars = body.match(CJK)?.length ?? 0;
  const latinWords = body
    .replace(CJK, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(cjkChars / 300 + latinWords / 200));
}
