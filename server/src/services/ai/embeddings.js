export function aiMode() {
  const provider = String(process.env.AI_PROVIDER || 'mock').toLowerCase();
  if (provider === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  return 'mock';
}

export async function embedTexts(texts) {
  if (aiMode() !== 'openai' || !texts.length) return [];

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let response;
  try {
    response = await client.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      input: texts,
    });
  } catch (error) {
    // Retrieval is keyword-based, so indexing continues without embeddings.
    console.warn('Embeddings unavailable, indexing without them:', error.message);
    return [];
  }
  return response.data
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
}
