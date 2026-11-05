import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { uploadRoot } from '../services/storage.js';
import { ApiError } from '../utils/ApiError.js';

const DOCUMENT_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['text/plain', '.txt'],
]);

const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

function extensionOf(filename) {
  return path.extname(filename || '').toLowerCase();
}

function storage(folder, types) {
  return multer.diskStorage({
    destination: (req, file, callback) => {
      try {
        const dir = path.join(uploadRoot(), folder);
        fs.mkdirSync(dir, { recursive: true });
        callback(null, dir);
      } catch (error) {
        callback(error);
      }
    },
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${types.get(file.mimetype)}`);
    },
  });
}

function acceptsFile(file, types) {
  const extension = extensionOf(file.originalname);
  if (file.mimetype === 'image/jpeg') return extension === '.jpg' || extension === '.jpeg';
  return types.get(file.mimetype) === extension;
}

function inferMime(file, types) {
  if (file.mimetype && file.mimetype !== 'application/octet-stream') return;
  const extension = extensionOf(file.originalname);
  if (extension === '.jpg' || extension === '.jpeg') {
    if (types.has('image/jpeg')) file.mimetype = 'image/jpeg';
    return;
  }
  for (const [mime, ext] of types) {
    if (ext === extension) {
      file.mimetype = mime;
      return;
    }
  }
}

function fileFilter(types, message) {
  return (req, file, callback) => {
    inferMime(file, types);
    if (!acceptsFile(file, types)) {
      callback(new ApiError(400, message));
      return;
    }
    callback(null, true);
  };
}

const documentUpload = multer({
  storage: storage('documents', DOCUMENT_TYPES),
  fileFilter: fileFilter(DOCUMENT_TYPES, 'Only PDF, DOCX, and TXT files can be uploaded.'),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

const thumbnailUpload = multer({
  storage: storage('thumbnails', IMAGE_TYPES),
  fileFilter: fileFilter(IMAGE_TYPES, 'Thumbnail images must be PNG, JPG, WEBP, or GIF.'),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

const projectStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    try {
      const folder = file.fieldname === 'image' ? 'projects/images' : 'projects/documents';
      const dir = path.join(uploadRoot(), folder);
      fs.mkdirSync(dir, { recursive: true });
      callback(null, dir);
    } catch (error) {
      callback(error);
    }
  },
  filename: (req, file, callback) => {
    const types = file.fieldname === 'image' ? IMAGE_TYPES : DOCUMENT_TYPES;
    callback(null, `${crypto.randomUUID()}${types.get(file.mimetype)}`);
  },
});

function projectFileFilter(req, file, callback) {
  if (file.fieldname === 'image') {
    inferMime(file, IMAGE_TYPES);
    if (!acceptsFile(file, IMAGE_TYPES)) {
      callback(new ApiError(400, 'Project images must be PNG, JPG, WEBP, or GIF.'));
      return;
    }
    callback(null, true);
    return;
  }

  if (file.fieldname === 'document') {
    inferMime(file, DOCUMENT_TYPES);
    if (!acceptsFile(file, DOCUMENT_TYPES)) {
      callback(new ApiError(400, 'Project documentation must be a PDF, DOCX, or TXT file.'));
      return;
    }
    callback(null, true);
    return;
  }

  callback(new ApiError(400, 'Unexpected file.'));
}

const projectUpload = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
});

export const uploadDocuments = documentUpload.array('files', 10);
export const uploadThumbnail = thumbnailUpload.single('thumbnail');
export const uploadProjectFiles = projectUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);
