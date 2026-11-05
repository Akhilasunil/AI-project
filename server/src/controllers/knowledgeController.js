import { CompanyDocument } from '../models/CompanyDocument.js';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { LearningResource } from '../models/LearningResource.js';
import { canAccess } from '../utils/access.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { presentDocument } from './documentController.js';
import { presentResource } from './learningResourceController.js';

function matchesQuery(values, term) {
  if (!term) return true;
  return values.join(' ').toLowerCase().includes(term.toLowerCase());
}

function matchesLibrary(document, library) {
  const value = document.get('library') || 'company';
  if (library === 'learning') return value === 'learning';
  if (library === 'company') return value === 'company';
  return true;
}

export const listVisibleDocuments = asyncHandler(async (req, res) => {
  const term = String(req.query.q || '').trim();
  const library = String(req.query.library || '').trim();
  const documents = (await CompanyDocument.find({
    processingStatus: 'indexed',
    approvalStatus: 'published',
  }).sort({ updatedAt: -1 }))
    .filter((document) => matchesLibrary(document, library))
    .filter((document) => canAccess(req.user, document))
    .filter((document) => matchesQuery([document.title, document.description, document.category], term));

  res.json({ success: true, documents: documents.map((document) => presentDocument(document)) });
});

export const getVisibleDocument = asyncHandler(async (req, res) => {
  const document = await CompanyDocument.findById(req.params.id);
  if (!document || document.approvalStatus !== 'published' || document.processingStatus !== 'indexed' || !canAccess(req.user, document)) {
    throw new ApiError(404, 'Document not found.');
  }
  const chunks = await KnowledgeChunk.find({ document: document._id }).sort({ position: 1 });
  const text = chunks.map((chunk) => chunk.text).join('\n\n').slice(0, 20000);
  res.json({
    success: true,
    document: presentDocument(document),
    text,
  });
});

export const listVisibleResources = asyncHandler(async (req, res) => {
  const term = String(req.query.q || '').trim();
  const resources = (await LearningResource.find({ status: 'published' }).sort({ updatedAt: -1 }))
    .filter((resource) => canAccess(req.user, resource))
    .filter((resource) => !req.query.resourceType || resource.resourceType === req.query.resourceType)
    .filter((resource) => !req.query.category || resource.category === req.query.category)
    .filter((resource) => matchesQuery([resource.title, resource.description, resource.category, resource.resourceType], term));

  res.json({ success: true, resources: resources.map((resource) => presentResource(resource)) });
});
