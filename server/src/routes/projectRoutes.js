import { Router } from 'express';
import {
  createProject,
  deleteProject,
  downloadProjectDocument,
  downloadProjectImage,
  getProject,
  listProjects,
  reprocessProject,
  updateProject,
} from '../controllers/projectController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadProjectFiles } from '../middleware/upload.js';
import { ROLES } from '../utils/roles.js';

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get('/', listProjects);
projectRouter.get('/:id/image', downloadProjectImage);
projectRouter.get('/:id/file', downloadProjectDocument);
projectRouter.get('/:id', getProject);
projectRouter.use(requireRole(ROLES.ADMIN));
projectRouter.post('/', uploadProjectFiles, createProject);
projectRouter.patch('/:id', uploadProjectFiles, updateProject);
projectRouter.post('/:id/reprocess', reprocessProject);
projectRouter.delete('/:id', deleteProject);
