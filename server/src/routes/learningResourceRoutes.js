import { Router } from 'express';
import {
  createLearningResource,
  deleteLearningResource,
  downloadThumbnail,
  listLearningResources,
  updateLearningResource,
} from '../controllers/learningResourceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadThumbnail } from '../middleware/upload.js';
import { ROLES } from '../utils/roles.js';

export const learningResourceRouter = Router();

learningResourceRouter.use(requireAuth);
learningResourceRouter.get('/:id/thumbnail', downloadThumbnail);
learningResourceRouter.use(requireRole(ROLES.ADMIN));
learningResourceRouter.get('/', listLearningResources);
learningResourceRouter.post('/', uploadThumbnail, createLearningResource);
learningResourceRouter.patch('/:id', uploadThumbnail, updateLearningResource);
learningResourceRouter.delete('/:id', deleteLearningResource);
