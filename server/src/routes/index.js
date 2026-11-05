import { Router } from 'express';
import { adminRouter } from './adminRoutes.js';
import { askRouter } from './askRoutes.js';
import { authRouter } from './authRoutes.js';
import { documentRouter } from './documentRoutes.js';
import { knowledgeRouter } from './knowledgeRoutes.js';
import { learningResourceRouter } from './learningResourceRoutes.js';
import { projectRouter } from './projectRoutes.js';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({ success: true, service: 'company-ai', status: 'ok' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/learning-resources', learningResourceRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/knowledge', knowledgeRouter);
apiRouter.use('/ask', askRouter);
apiRouter.use('/admin', adminRouter);
