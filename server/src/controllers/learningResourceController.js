import { LearningResource } from '../models/LearningResource.js';
import { resolveAccess } from '../services/accessInput.js';
import { removeStoredFile, resolveStorageKey } from '../services/storage.js';
import { canAccess } from '../utils/access.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from '../utils/catalog.js';
import { assertPublicHttpsUrl } from '../utils/urls.js';

function presentResource(resource, { admin = false } = {}) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    category: resource.category,
    thumbnailUrl: resource.thumbnailUrl || '',
    hasThumbnail: Boolean(resource.thumbnailKey || resource.thumbnailUrl),
    resourceUrl: resource.resourceUrl,
    targetAudience: resource.targetAudience,
    trainer: resource.trainer,
    duration: resource.duration,
    status: resource.status,
    access: {
      scope: resource.access?.scope || 'all',
      teams: resource.access?.teams || [],
      emails: admin ? resource.access?.emails || [] : [],
    },
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

function readResource(body, existing) {
  const title = String(body.title ?? existing?.title ?? '').trim();
  const resourceType = String(body.resourceType ?? existing?.resourceType ?? '').trim();
  const category = String(body.category ?? existing?.category ?? '').trim();
  const status = body.status ?? existing?.status ?? 'published';
  const resourceUrl = assertPublicHttpsUrl(body.resourceUrl ?? existing?.resourceUrl, 'Resource URL');
  const hasThumbnailUrl = Object.prototype.hasOwnProperty.call(body, 'thumbnailUrl');
  const thumbnailUrlInput = hasThumbnailUrl ? String(body.thumbnailUrl || '').trim() : undefined;

  if (!title) throw new ApiError(400, 'Enter a resource title.');
  if (title.length > 160) throw new ApiError(400, 'Title must be 160 characters or fewer.');
  if (!RESOURCE_TYPES.includes(resourceType)) throw new ApiError(400, 'Choose a resource type.');
  if (!RESOURCE_CATEGORIES.includes(category)) throw new ApiError(400, 'Choose a category.');
  if (!['draft', 'published'].includes(status)) throw new ApiError(400, 'Choose a valid approval status.');

  return {
    title,
    description: String(body.description ?? existing?.description ?? '').trim().slice(0, 2000),
    resourceType,
    category,
    status,
    resourceUrl,
    thumbnailUrl: thumbnailUrlInput ? assertPublicHttpsUrl(thumbnailUrlInput, 'Thumbnail URL') : thumbnailUrlInput,
    targetAudience: String(body.targetAudience ?? existing?.targetAudience ?? '').trim().slice(0, 120),
    trainer: String(body.trainer ?? existing?.trainer ?? '').trim().slice(0, 120),
    duration: String(body.duration ?? existing?.duration ?? '').trim().slice(0, 40),
  };
}

export const listLearningResources = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.resourceType) query.resourceType = req.query.resourceType;
  if (req.query.category) query.category = req.query.category;
  if (req.query.status) query.status = req.query.status;
  const term = String(req.query.q || '').trim();
  if (term) query.title = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const resources = await LearningResource.find(query).sort({ updatedAt: -1 });
  res.json({ success: true, resources: resources.map((resource) => presentResource(resource, { admin: true })) });
});

export const createLearningResource = asyncHandler(async (req, res) => {
  let fields;
  let access;
  try {
    fields = readResource(req.body);
    access = await resolveAccess(req.body);
  } catch (error) {
    if (req.file) await removeStoredFile(`thumbnails/${req.file.filename}`);
    throw error;
  }
  if (req.file) {
    fields.thumbnailKey = `thumbnails/${req.file.filename}`;
    fields.thumbnailUrl = '';
  } else if (!fields.thumbnailUrl) {
    fields.thumbnailUrl = '';
  }

  const resource = await LearningResource.create({
    ...fields,
    thumbnailKey: fields.thumbnailKey || '',
    access,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json({ success: true, resource: presentResource(resource, { admin: true }) });
});

export const updateLearningResource = asyncHandler(async (req, res) => {
  const resource = await LearningResource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Learning resource not found.');
  let fields;
  try {
    fields = readResource(req.body, resource);
  } catch (error) {
    if (req.file) await removeStoredFile(`thumbnails/${req.file.filename}`);
    throw error;
  }
  Object.assign(resource, {
    title: fields.title,
    description: fields.description,
    resourceType: fields.resourceType,
    category: fields.category,
    status: fields.status,
    resourceUrl: fields.resourceUrl,
    targetAudience: fields.targetAudience,
    trainer: fields.trainer,
    duration: fields.duration,
  });
  if (req.file) {
    await removeStoredFile(resource.thumbnailKey);
    resource.thumbnailKey = `thumbnails/${req.file.filename}`;
    resource.thumbnailUrl = '';
  } else if (fields.thumbnailUrl) {
    await removeStoredFile(resource.thumbnailKey);
    resource.thumbnailKey = '';
    resource.thumbnailUrl = fields.thumbnailUrl;
  } else if (fields.thumbnailUrl === '') {
    resource.thumbnailUrl = '';
  }
  if (req.body.accessScope) resource.access = await resolveAccess(req.body);
  resource.updatedBy = req.user._id;
  await resource.save();
  res.json({ success: true, resource: presentResource(resource, { admin: true }) });
});

export const deleteLearningResource = asyncHandler(async (req, res) => {
  const resource = await LearningResource.findById(req.params.id);
  if (!resource) throw new ApiError(404, 'Learning resource not found.');
  await removeStoredFile(resource.thumbnailKey);
  await resource.deleteOne();
  res.json({ success: true });
});

export const downloadThumbnail = asyncHandler(async (req, res) => {
  const resource = await LearningResource.findById(req.params.id);
  if (!resource || !resource.thumbnailKey || !canAccess(req.user, resource)) {
    throw new ApiError(404, 'Thumbnail not found.');
  }
  if (req.user.role !== 'admin' && resource.status !== 'published') {
    throw new ApiError(404, 'Thumbnail not found.');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(resolveStorageKey(resource.thumbnailKey));
});

export { presentResource };
