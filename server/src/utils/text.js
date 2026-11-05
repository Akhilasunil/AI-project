const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'your', 'our', 'was', 'were', 'with', 'this', 'that',
  'from', 'have', 'has', 'had', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'can', 'could',
  'about', 'into', 'does', 'did', 'any', 'there', 'their', 'they', 'them', 'should', 'would', 'will',
  'just', 'than', 'then', 'also', 'please', 'tell', 'show', 'need', 'want',
]);

const QUERY_ALIASES = {
  diwali: ['deepavali'],
  deepavali: ['diwali'],
};

export function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export function expandQueryTerms(terms) {
  const expanded = [...terms];
  terms.forEach((term) => {
    (QUERY_ALIASES[term] || []).forEach((alias) => {
      if (!expanded.includes(alias)) expanded.push(alias);
    });
  });
  return expanded;
}

export function scoreText(queryTerms, text) {
  if (!queryTerms.length || !text) return 0;
  const haystack = text.toLowerCase();
  return queryTerms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}

export function minimumMatches(queryTerms) {
  const configured = Number(process.env.RETRIEVAL_MIN_SCORE);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return queryTerms.length <= 1 ? 1 : 2;
}

export function chunkText(text, size = 1200, overlap = 150) {
  const clean = String(text || '').replace(/\r/g, '').trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + size);
    if (end < clean.length) {
      const breakAt = clean.lastIndexOf('\n', end);
      if (breakAt > start + size / 2) end = breakAt;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

export function selectSentences(text, queryTerms) {
  const sentences = String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const matched = sentences.filter((sentence) => scoreText(queryTerms, sentence) > 0);
  const chosen = (matched.length ? matched : sentences).slice(0, 4);
  return chosen.join(' ').slice(0, 900);
}

export function normalizeQuestion(question) {
  return String(question || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}
