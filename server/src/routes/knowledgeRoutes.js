import { Router } from 'express';
import {
  getVisibleDocument,
  listVisibleDocuments,
  listVisibleResources,
} from '../controllers/knowledgeController.js';
import { requireAuth } from '../middleware/auth.js';

export const knowledgeRouter = Router();

knowledgeRouter.use(requireAuth);
knowledgeRouter.get('/documents', listVisibleDocuments);
knowledgeRouter.get('/documents/:id', getVisibleDocument);
knowledgeRouter.get('/resources', listVisibleResources);
