import { CompanyDocument } from '../models/CompanyDocument.js';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { resolveAccess } from '../services/accessInput.js';
import { indexDocument } from '../services/indexing.js';
import { removeStoredFile, resolveStorageKey } from '../services/storage.js';
import { canAccess } from '../utils/access.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { DOCUMENT_CATEGORIES, LEARNING_DOCUMENT_CATEGORIES, displayDocumentStatus } from '../utils/catalog.js';
import { assertPublicHttpsUrl } from '../utils/urls.js';

function cleanName(name) {
  return pathSafe(name).replace(/\.[^.]+$/, '').slice(0, 160) || 'Untitled document';
}

function pathSafe(name) {
  return String(name || 'document').replace(/[^\w.\- ()]+/g, '_').slice(0, 180);
}

function presentDocument(document, { admin = false } = {}) {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    category: document.category,
    department: document.department,
    sourceUrl: document.sourceUrl || '',
    originalName: document.originalName,
    mimeType: document.mimeType,
    size: document.size,
    processingStatus: document.processingStatus,
    approvalStatus: document.approvalStatus,
    displayStatus: displayDocumentStatus(document),
    processingError: admin ? document.processingError : '',
    chunkCount: document.chunkCount,
    library: document.get('library') || 'company',
    access: {
      scope: document.access?.scope || 'all',
      teams: document.access?.teams || [],
      emails: admin ? document.access?.emails || [] : [],
    },
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function libraryQuery(library) {
  if (library === 'learning') return { library: 'learning' };
  if (library === 'company') return { $or: [{ library: 'company' }, { library: { $exists: false } }] };
  return {};
}

function readMetadata(body, { titleRequired = true } = {}) {
  const title = String(body.title || '').trim();
  const category = String(body.category || '').trim();
  const approvalStatus = body.approvalStatus || 'published';
  const library = body.library === 'learning' ? 'learning' : 'company';
  const categories = library === 'learning' ? LEARNING_DOCUMENT_CATEGORIES : DOCUMENT_CATEGORIES;
  if (titleRequired && !title) throw new ApiError(400, 'Enter a document title.');
  if (title.length > 160) throw new ApiError(400, 'Title must be 160 characters or fewer.');
  if (!categories.includes(category)) throw new ApiError(400, 'Choose a document category.');
  if (!['draft', 'pending_review', 'published'].includes(approvalStatus)) {
    throw new ApiError(400, 'Choose a valid approval status.');
  }
  return {
    title,
    description: String(body.description || '').trim().slice(0, 2000),
    category,
    department: String(body.department || '').trim().slice(0, 80),
    approvalStatus,
    library,
  };
}

async function indexLinkedDocument(document) {
  const text = [document.title, document.description].filter(Boolean).join('\n').trim();
  await KnowledgeChunk.deleteMany({ document: document._id });
  if (text) {
    await KnowledgeChunk.create({ document: document._id, text, position: 0 });
    document.chunkCount = 1;
  } else {
    document.chunkCount = 0;
  }
  document.processingError = '';
  document.processingStatus = 'indexed';
  await document.save();
}

async function processDocument(document) {
  if (document.sourceUrl) {
    await indexLinkedDocument(document);
    return;
  }
  document.processingStatus = 'processing';
  await document.save();
  try {
    await indexDocument(document);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') console.error(error);
    document.processingStatus = 'failed';
    document.processingError = error.publicMessage || 'Could not read this file.';
    document.chunkCount = 0;
    await KnowledgeChunk.deleteMany({ document: document._id });
  }
  await document.save();
}

export const listDocuments = asyncHandler(async (req, res) => {
  const query = libraryQuery(String(req.query.library || '').trim());
  const term = String(req.query.q || '').trim();
  if (term) query.title = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const documents = await CompanyDocument.find(query).sort({ updatedAt: -1 });
  res.json({ success: true, documents: documents.map((document) => presentDocument(document, { admin: true })) });
});

export const createDocuments = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const sourceUrlInput = String(req.body.sourceUrl || '').trim();
  if (sourceUrlInput && !files.length) {
    if (req.body.library !== 'learning') throw new ApiError(400, 'Document links are only for learning documents.');
    const shared = readMetadata(req.body);
    const access = await resolveAccess(req.body);
    const sourceUrl = assertPublicHttpsUrl(sourceUrlInput, 'Document link');
    const document = await CompanyDocument.create({
      ...shared,
      sourceUrl,
      originalName: 'Document link',
      mimeType: 'text/uri-list',
      size: 0,
      storageKey: '',
      uploadedBy: req.user._id,
      access,
      processingStatus: 'uploaded',
    });
    await processDocument(document);
    res.status(201).json({ success: true, documents: [presentDocument(document, { admin: true })] });
    return;
  }
  if (!files.length) throw new ApiError(400, 'Choose a PDF, DOCX, or TXT file.');

  let shared;
  let access;
  try {
    const titleRequired = files.length === 1 && Boolean(req.body.title);
    shared = readMetadata(req.body, { titleRequired });
    access = await resolveAccess(req.body);
  } catch (error) {
    await Promise.all(files.map((file) => removeStoredFile(`documents/${file.filename}`)));
    throw error;
  }
  const documents = [];

  for (const file of files) {
    const title = files.length === 1 ? (shared.title || cleanName(file.originalname)) : cleanName(file.originalname);
    const document = await CompanyDocument.create({
      ...shared,
      title,
      originalName: pathSafe(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
      storageKey: `documents/${file.filename}`,
      uploadedBy: req.user._id,
      access,
      processingStatus: 'uploaded',
    });
    await processDocument(document);
    documents.push(presentDocument(document, { admin: true }));
  }

  res.status(201).json({ success: true, documents });
});

export const updateDocument = asyncHandler(async (req, res) => {
  const document = await CompanyDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found.');
  const metadata = readMetadata({ ...document.toObject(), ...req.body, title: req.body.title ?? document.title, category: req.body.category ?? document.category, approvalStatus: req.body.approvalStatus ?? document.approvalStatus });
  document.title = metadata.title || document.title;
  document.description = metadata.description;
  document.category = metadata.category;
  document.department = metadata.department;
  document.approvalStatus = metadata.approvalStatus;
  document.set('library', metadata.library);
  if (req.body.accessScope) document.access = await resolveAccess(req.body);
  if (document.sourceUrl) {
    if (req.body.sourceUrl != null) {
      document.sourceUrl = assertPublicHttpsUrl(req.body.sourceUrl, 'Document link');
    }
    await indexLinkedDocument(document);
  } else {
    await document.save();
  }
  res.json({ success: true, document: presentDocument(document, { admin: true }) });
});

export const reprocessDocument = asyncHandler(async (req, res) => {
  const document = await CompanyDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found.');
  await processDocument(document);
  res.json({ success: true, document: presentDocument(document, { admin: true }) });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await CompanyDocument.findById(req.params.id);
  if (!document) throw new ApiError(404, 'Document not found.');
  await KnowledgeChunk.deleteMany({ document: document._id });
  await removeStoredFile(document.storageKey);
  await document.deleteOne();
  res.json({ success: true });
});

export const downloadDocument = asyncHandler(async (req, res) => {
  const document = await CompanyDocument.findById(req.params.id);
  if (!document || !canAccess(req.user, document)) throw new ApiError(404, 'Document not found.');
  if (req.user.role !== 'admin' && document.approvalStatus !== 'published') {
    throw new ApiError(404, 'Document not found.');
  }
  if (document.sourceUrl && !document.storageKey) {
    throw new ApiError(404, 'This document opens from its original link.');
  }
  const inline = document.mimeType === 'application/pdf' || document.mimeType === 'text/plain';
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${pathSafe(document.originalName)}"`);
  res.sendFile(resolveStorageKey(document.storageKey));
});

export { presentDocument };
