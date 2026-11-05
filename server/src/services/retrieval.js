import { CompanyDocument } from '../models/CompanyDocument.js';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { LearningResource } from '../models/LearningResource.js';
import { Project } from '../models/Project.js';
import { canAccess } from '../utils/access.js';
import { expandQueryTerms, minimumMatches, scoreText, tokenize } from '../utils/text.js';

const VIDEO_INTENT = /\b(video|videos|watch|tutorial|recording)\b/i;

function bestExcerpt(chunkText, queryTerms) {
  const clean = chunkText.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  const at = queryTerms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (at == null) return clean.slice(0, 500);
  const wordStart = at === 0 ? 0 : clean.lastIndexOf(' ', at) + 1;
  return clean.slice(wordStart, wordStart + 500).trim();
}

export async function retrieveKnowledge(user, question) {
  const originalTerms = tokenize(question);
  const queryTerms = expandQueryTerms(originalTerms);
  const needed = minimumMatches(originalTerms);
  const videoIntent = VIDEO_INTENT.test(question);

  const documents = await CompanyDocument.find({
    processingStatus: 'indexed',
    approvalStatus: 'published',
  });
  const allowedDocuments = documents.filter((document) => canAccess(user, document));
  const documentById = new Map(allowedDocuments.map((document) => [document.id, document]));
  const chunks = allowedDocuments.length
    ? await KnowledgeChunk.find({ document: { $in: allowedDocuments.map((document) => document._id) } })
    : [];

  const scoredChunks = chunks
    .map((chunk) => {
      if (!chunk.document) return null;
      const document = documentById.get(chunk.document.toString());
      if (!document) return null;
      const score = scoreText(queryTerms, `${document.title} ${document.category} ${chunk.text}`)
        + scoreText(queryTerms, document.title);
      return {
        score,
        position: chunk.position,
        passage: {
          documentId: document.id,
          title: document.title,
          category: document.category,
          excerpt: bestExcerpt(chunk.text, queryTerms),
          text: chunk.text,
          position: chunk.position,
          score,
          path: `/knowledge/documents/${document.id}`,
        },
      };
    })
    .filter(Boolean);
  const passages = scoredChunks.filter((item) => item.score >= needed).map((item) => item.passage);

  // A table or list can span chunks where only some mention the query words, so
  // give the model the remaining chunks of the best documents as extra context.
  const bestDocumentIds = [...new Set(
    [...passages].sort((left, right) => right.score - left.score).map((passage) => passage.documentId),
  )].slice(0, 2);
  const contextPassages = scoredChunks
    .filter((item) => item.score < needed && bestDocumentIds.includes(item.passage.documentId))
    .sort((left, right) => left.position - right.position)
    .slice(0, 6)
    .map((item) => ({ ...item.passage, contextOnly: true }));

  const projects = (await Project.find({
    processingStatus: 'indexed',
    status: 'published',
  })).filter((project) => canAccess(user, project));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectChunks = projects.length
    ? await KnowledgeChunk.find({ project: { $in: projects.map((project) => project._id) } })
    : [];
  const projectPassages = projectChunks
    .map((chunk) => {
      if (!chunk.project) return null;
      const project = projectById.get(chunk.project.toString());
      if (!project) return null;
      const score = scoreText(queryTerms, `${project.name} ${project.ownerName} ${project.department} ${chunk.text}`)
        + scoreText(queryTerms, project.name);
      if (score < needed) return null;
      return {
        documentId: project.id,
        title: project.name,
        category: project.department || 'Project',
        excerpt: bestExcerpt(chunk.text, queryTerms),
        text: chunk.text,
        score,
        path: `/projects/${project.id}`,
      };
    })
    .filter(Boolean);

  const limitedPassages = [...passages, ...projectPassages]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  const resources = (await LearningResource.find({ status: 'published' }))
    .filter((resource) => canAccess(user, resource))
    .map((resource) => {
      let score = scoreText(queryTerms, `${resource.title} ${resource.description} ${resource.category} ${resource.resourceType}`);
      if (videoIntent && resource.resourceType === 'Video') score += 2;
      return { resource, score };
    })
    .filter((item) => item.score >= (videoIntent ? 1 : needed))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.resource);

  const usedIds = new Set(limitedPassages.map((passage) => passage.documentId));
  const relatedQuestions = allowedDocuments
    .filter((document) => !usedIds.has(document.id))
    .filter((document) => scoreText(queryTerms, `${document.title} ${document.category}`) > 0)
    .slice(0, 3)
    .map((document) => `What does ${document.title} cover?`);

  return { passages: limitedPassages, contextPassages, resources, relatedQuestions, queryTerms };
}
