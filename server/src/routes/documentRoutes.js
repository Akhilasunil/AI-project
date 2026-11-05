import { Router } from 'express';
import {
  createDocuments,
  deleteDocument,
  downloadDocument,
  listDocuments,
  reprocessDocument,
  updateDocument,
} from '../controllers/documentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadDocuments } from '../middleware/upload.js';
import { ROLES } from '../utils/roles.js';

export const documentRouter = Router();

documentRouter.use(requireAuth);
documentRouter.get('/:id/file', downloadDocument);
documentRouter.use(requireRole(ROLES.ADMIN));
documentRouter.get('/', listDocuments);
documentRouter.post('/', uploadDocuments, createDocuments);
documentRouter.patch('/:id', updateDocument);
documentRouter.post('/:id/reprocess', reprocessDocument);
documentRouter.delete('/:id', deleteDocument);
