import { ApiError } from '../../utils/ApiError.js';
import { aiMode } from './embeddings.js';
import { composeMockAnswer } from './mockAnswer.js';
import { composeOpenAiAnswer } from './openaiAnswer.js';
import { retrieveKnowledge } from '../retrieval.js';

// Group by document, in reading order, so the model sees each file as it was written.
function orderForModel({ passages, contextPassages }) {
  const byDocument = new Map();
  [...passages, ...contextPassages].forEach((passage) => {
    if (!byDocument.has(passage.documentId)) byDocument.set(passage.documentId, []);
    byDocument.get(passage.documentId).push(passage);
  });
  return [...byDocument.values()].flatMap((group) => group.sort((left, right) => left.position - right.position));
}

// One source card per document, using its best-scoring passage.
function onePassagePerDocument(passages) {
  const best = new Map();
  passages.forEach((passage) => {
    const current = best.get(passage.documentId);
    if (!current || passage.score > current.score) best.set(passage.documentId, passage);
  });
  return [...best.values()];
}

export async function answerQuestion(user, question) {
  const retrieved = await retrieveKnowledge(user, question);
  const mode = aiMode();

  try {
    const composed = mode === 'openai'
      ? await composeOpenAiAnswer({ question, passages: orderForModel(retrieved), resources: retrieved.resources })
      : composeMockAnswer({ question, passages: retrieved.passages, resources: retrieved.resources });

    return {
      mode,
      answer: composed.answer,
      sufficientEvidence: composed.sufficientEvidence,
      passages: onePassagePerDocument(retrieved.passages),
      resources: retrieved.resources,
      relatedQuestions: composed.sufficientEvidence ? retrieved.relatedQuestions : [],
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('AI answer failed:', error);
    throw new ApiError(503, 'The AI service is unavailable. Try again.');
  }
}
