// No case-folding — Indic scripts have no case, so lowercasing is meaningless
// (and harmless) for them; this only strips punctuation/extra whitespace that
// speech-to-text transcripts commonly vary on even when pronunciation is right.
export function normalizeForCompare(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, "")
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost);
    }
  }
  return dist[rows - 1][cols - 1];
}

// 1 = identical, 0 = completely different. Speech-to-text transcripts rarely
// match an expected sentence character-for-character even when pronunciation
// is correct, so callers should accept anything above ~0.8 rather than
// requiring an exact match.
export function similarity(a, b) {
  const normA = normalizeForCompare(a);
  const normB = normalizeForCompare(b);
  if (normA === normB) return 1;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(normA, normB) / maxLen;
}
