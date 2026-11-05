import { CompanyDocument } from '../models/CompanyDocument.js';
import { KnowledgeGap } from '../models/KnowledgeGap.js';
import { LearningResource } from '../models/LearningResource.js';
import { Project } from '../models/Project.js';
import { QuestionLog } from '../models/QuestionLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const summary = asyncHandler(async (req, res) => {
  const [asked, answered, unanswered, openGaps, recentGaps, topics, documents, resources] = await Promise.all([
    QuestionLog.countDocuments(),
    QuestionLog.countDocuments({ answerStatus: 'answered' }),
    QuestionLog.countDocuments({ answerStatus: 'unanswered' }),
    KnowledgeGap.countDocuments({ status: 'open' }),
    KnowledgeGap.find({ status: 'open' }).sort({ lastAskedAt: -1 }).limit(5),
    QuestionLog.aggregate([
      { $match: { topic: { $ne: '' } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    CompanyDocument.find().sort({ updatedAt: -1 }).limit(5),
    LearningResource.find().sort({ updatedAt: -1 }).limit(5),
  ]);

  const recentUpdates = [
    ...documents.map((document) => ({
      id: document.id,
      title: document.title,
      kind: 'Document',
      updatedAt: document.updatedAt,
    })),
    ...resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      kind: 'Learning resource',
      updatedAt: resource.updatedAt,
    })),
  ]
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
    .slice(0, 5);

  res.json({
    success: true,
    summary: {
      asked,
      answered,
      unanswered,
      gaps: openGaps,
      topics: topics.map((topic) => ({ topic: topic._id, count: topic.count })),
      recentGaps: recentGaps.map((gap) => ({
        id: gap.id,
        question: gap.question,
        askCount: gap.askCount,
        lastAskedAt: gap.lastAskedAt,
        status: gap.status,
        suggestedAction: gap.suggestedAction,
      })),
      recentUpdates,
    },
  });
});

export const listGaps = asyncHandler(async (req, res) => {
  const gaps = await KnowledgeGap.find().sort({ askCount: -1, lastAskedAt: -1 }).limit(100);
  res.json({
    success: true,
    gaps: gaps.map((gap) => ({
      id: gap.id,
      question: gap.question,
      askCount: gap.askCount,
      lastAskedAt: gap.lastAskedAt,
      status: gap.status,
      suggestedAction: gap.suggestedAction,
    })),
  });
});

export const knowledgeCounts = asyncHandler(async (req, res) => {
  const [documents, publishedDocuments, resources, publishedResources, projects, publishedProjects] = await Promise.all([
    CompanyDocument.countDocuments(),
    CompanyDocument.countDocuments({ approvalStatus: 'published' }),
    LearningResource.countDocuments(),
    LearningResource.countDocuments({ status: 'published' }),
    Project.countDocuments(),
    Project.countDocuments({ status: 'published' }),
  ]);

  res.json({
    success: true,
    counts: {
      documents: { total: documents, published: publishedDocuments },
      resources: { total: resources, published: publishedResources },
      projects: { total: projects, published: publishedProjects },
    },
  });
});
