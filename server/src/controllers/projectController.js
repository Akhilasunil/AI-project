import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { Project } from '../models/Project.js';
import { resolveAccess } from '../services/accessInput.js';
import { indexProject } from '../services/indexing.js';
import { removeStoredFile, resolveStorageKey } from '../services/storage.js';
import { canAccess } from '../utils/access.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { displayProjectStatus } from '../utils/catalog.js';
import { assertPublicHttpsUrl } from '../utils/urls.js';

const IMAGE_LIMIT = 2 * 1024 * 1024;

function pathSafe(name) {
  return String(name || 'document').replace(/[^\w.\- ()]+/g, '_').slice(0, 180);
}

function pickFile(files, field) {
  const list = files?.[field];
  return Array.isArray(list) ? list[0] : undefined;
}

function presentProject(project, { admin = false } = {}) {
  return {
    id: project.id,
    name: project.name,
    summary: project.summary,
    siteUrl: project.siteUrl,
    ownerName: project.ownerName,
    department: project.department,
    originalName: project.originalName,
    mimeType: project.mimeType,
    size: project.size,
    status: project.status,
    processingStatus: project.processingStatus,
    displayStatus: displayProjectStatus(project),
    processingError: admin ? project.processingError : '',
    chunkCount: project.chunkCount,
    hasImage: Boolean(project.imageKey),
    access: {
      scope: project.access?.scope || 'all',
      teams: project.access?.teams || [],
      emails: admin ? project.access?.emails || [] : [],
    },
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

function readSiteUrl(value) {
  const siteUrl = String(value || '').trim();
  if (!siteUrl) return '';
  assertPublicHttpsUrl(siteUrl, 'Site URL');
  return siteUrl;
}

function readProject(body, existing) {
  const name = String(body.name ?? existing?.name ?? '').trim();
  const ownerName = String(body.ownerName ?? existing?.ownerName ?? '').trim();
  const status = body.status ?? existing?.status ?? 'published';

  if (!name) throw new ApiError(400, 'Enter a project name.');
  if (name.length > 160) throw new ApiError(400, 'Project name must be 160 characters or fewer.');
  if (!ownerName) throw new ApiError(400, 'Enter the project owner.');
  if (ownerName.length > 120) throw new ApiError(400, 'Owner name must be 120 characters or fewer.');
  if (!['draft', 'published'].includes(status)) throw new ApiError(400, 'Choose a valid approval status.');

  return {
    name,
    summary: String(body.summary ?? existing?.summary ?? '').trim().slice(0, 2000),
    siteUrl: readSiteUrl(body.siteUrl ?? existing?.siteUrl ?? ''),
    ownerName,
    department: String(body.department ?? existing?.department ?? '').trim().slice(0, 80),
    status,
  };
}

async function discardUploads(files) {
  const image = pickFile(files, 'image');
  const document = pickFile(files, 'document');
  await Promise.all([
    image ? removeStoredFile(`projects/images/${image.filename}`) : null,
    document ? removeStoredFile(`projects/documents/${document.filename}`) : null,
  ]);
}

async function processProject(project) {
  project.processingStatus = 'processing';
  await project.save();
  try {
    await indexProject(project);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') console.error(error);
    project.processingStatus = 'failed';
    project.processingError = error.publicMessage || 'Could not read this file.';
    project.chunkCount = 0;
    await KnowledgeChunk.deleteMany({ project: project._id });
  }
  await project.save();
}

function visibleTo(user, project) {
  if (!project || !canAccess(user, project)) return false;
  if (user.role === 'admin') return true;
  return project.status === 'published' && project.processingStatus === 'indexed';
}

export const listProjects = asyncHandler(async (req, res) => {
  const admin = req.user.role === 'admin';
  const query = admin ? {} : { status: 'published', processingStatus: 'indexed' };
  const term = String(req.query.q || '').trim().toLowerCase();
  const projects = (await Project.find(query).sort({ updatedAt: -1 }))
    .filter((project) => admin || canAccess(req.user, project))
    .filter((project) => {
      if (!term) return true;
      return `${project.name} ${project.ownerName} ${project.summary} ${project.department}`.toLowerCase().includes(term);
    });

  res.json({ success: true, projects: projects.map((project) => presentProject(project, { admin })) });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!visibleTo(req.user, project)) throw new ApiError(404, 'Project not found.');
  const chunks = await KnowledgeChunk.find({ project: project._id }).sort({ position: 1 });
  const text = chunks.map((chunk) => chunk.text).join('\n\n').slice(0, 20000);
  res.json({
    success: true,
    project: presentProject(project, { admin: req.user.role === 'admin' }),
    text,
  });
});

export const createProject = asyncHandler(async (req, res) => {
  const image = pickFile(req.files, 'image');
  const document = pickFile(req.files, 'document');
  if (!image || image.size > IMAGE_LIMIT) {
    await discardUploads(req.files);
    throw new ApiError(400, image ? 'Project images must be 2 MB or smaller.' : 'Choose a project image.');
  }
  if (!document) {
    await discardUploads(req.files);
    throw new ApiError(400, 'Choose a PDF, DOCX, or TXT documentation file.');
  }

  let fields;
  let access;
  try {
    fields = readProject(req.body);
    access = await resolveAccess(req.body);
  } catch (error) {
    await discardUploads(req.files);
    throw error;
  }

  const project = await Project.create({
    ...fields,
    imageKey: `projects/images/${image.filename}`,
    imageMime: image.mimetype,
    documentKey: `projects/documents/${document.filename}`,
    originalName: pathSafe(document.originalname),
    mimeType: document.mimetype,
    size: document.size,
    access,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    processingStatus: 'uploaded',
  });
  await processProject(project);
  res.status(201).json({ success: true, project: presentProject(project, { admin: true }) });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    await discardUploads(req.files);
    throw new ApiError(404, 'Project not found.');
  }

  const image = pickFile(req.files, 'image');
  const document = pickFile(req.files, 'document');
  if (image && image.size > IMAGE_LIMIT) {
    await discardUploads(req.files);
    throw new ApiError(400, 'Project images must be 2 MB or smaller.');
  }

  let fields;
  try {
    fields = readProject(req.body, project);
  } catch (error) {
    await discardUploads(req.files);
    throw error;
  }

  Object.assign(project, fields);
  if (req.body.accessScope) {
    try {
      project.access = await resolveAccess(req.body);
    } catch (error) {
      await discardUploads(req.files);
      throw error;
    }
  }
  if (image) {
    await removeStoredFile(project.imageKey);
    project.imageKey = `projects/images/${image.filename}`;
    project.imageMime = image.mimetype;
  }
  project.updatedBy = req.user._id;
  if (document) {
    await removeStoredFile(project.documentKey);
    project.documentKey = `projects/documents/${document.filename}`;
    project.originalName = pathSafe(document.originalname);
    project.mimeType = document.mimetype;
    project.size = document.size;
    await processProject(project);
  } else {
    await project.save();
  }

  res.json({ success: true, project: presentProject(project, { admin: true }) });
});

export const reprocessProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found.');
  await processProject(project);
  res.json({ success: true, project: presentProject(project, { admin: true }) });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found.');
  await KnowledgeChunk.deleteMany({ project: project._id });
  await removeStoredFile(project.imageKey);
  await removeStoredFile(project.documentKey);
  await project.deleteOne();
  res.json({ success: true });
});

export const downloadProjectImage = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project?.imageKey || !visibleTo(req.user, project)) throw new ApiError(404, 'Project image not found.');
  res.setHeader('Content-Type', project.imageMime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-cache');
  res.sendFile(resolveStorageKey(project.imageKey));
});

export const downloadProjectDocument = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!visibleTo(req.user, project)) throw new ApiError(404, 'Project not found.');
  const inline = project.mimeType === 'application/pdf' || project.mimeType === 'text/plain';
  res.setHeader('Content-Type', project.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${pathSafe(project.originalName)}"`);
  res.sendFile(resolveStorageKey(project.documentKey));
});
