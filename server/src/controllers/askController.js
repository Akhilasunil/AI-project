import { KnowledgeGap } from '../models/KnowledgeGap.js';
import { QuestionLog } from '../models/QuestionLog.js';
import { answerQuestion } from '../services/ai/answerQuestion.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { NOT_FOUND_ANSWER } from '../utils/catalog.js';
import { normalizeQuestion } from '../utils/text.js';
import { presentResource } from './learningResourceController.js';

export const ask = asyncHandler(async (req, res) => {
  const question = String(req.body.question || '').trim();
  if (!question) throw new ApiError(400, 'Enter a question.');
  if (question.length > 1000) throw new ApiError(400, 'Question must be 1000 characters or fewer.');

  let result;
  try {
    result = await answerQuestion(req.user, question);
  } catch (error) {
    await QuestionLog.create({
      user: req.user._id,
      question,
      answerStatus: 'error',
      sufficientEvidence: false,
      topic: '',
      sources: [],
    });
    throw error;
  }

  const topic = result.passages[0]?.category || result.resources[0]?.category || '';
  await QuestionLog.create({
    user: req.user._id,
    question,
    answerStatus: result.sufficientEvidence ? 'answered' : 'unanswered',
    sufficientEvidence: result.sufficientEvidence,
    topic,
    sources: [
      ...result.passages.map((passage) => ({
        sourceId: passage.documentId,
        sourceType: 'document',
        title: passage.title,
      })),
      ...result.resources.map((resource) => ({
        sourceId: resource.id,
        sourceType: 'learning-resource',
        title: resource.title,
      })),
    ],
  });

  const normalized = normalizeQuestion(question);
  if (!result.sufficientEvidence && normalized) {
    await KnowledgeGap.findOneAndUpdate(
      { normalizedQuestion: normalized },
      {
        $set: { question, lastAskedAt: new Date(), status: 'open', suggestedAction: 'Add knowledge' },
        $inc: { askCount: 1 },
        $setOnInsert: { normalizedQuestion: normalized },
      },
      { upsert: true },
    );
  } else if (normalized) {
    await KnowledgeGap.updateOne({ normalizedQuestion: normalized, status: 'open' }, { status: 'resolved' });
  }

  res.json({
    success: true,
    mode: result.mode,
    answer: result.answer || NOT_FOUND_ANSWER,
    sufficientEvidence: result.sufficientEvidence,
    sources: result.passages.map((passage) => ({
      id: passage.documentId,
      type: 'document',
      title: passage.title,
      excerpt: passage.excerpt,
      path: passage.path,
    })),
    resources: result.resources.map((resource) => presentResource(resource)),
    relatedQuestions: result.relatedQuestions,
  });
});
