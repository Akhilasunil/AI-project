import { Router } from 'express';
import { knowledgeCounts, listGaps, summary } from '../controllers/adminInsightController.js';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(ROLES.ADMIN));

adminRouter.get('/summary', summary);
adminRouter.get('/knowledge-counts', knowledgeCounts);
adminRouter.get('/gaps', listGaps);
adminRouter.get('/users', listUsers);
adminRouter.post('/users', createUser);
adminRouter.patch('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);

adminRouter.get('/session', (req, res) => {
  res.json({
    success: true,
    role: req.user.role,
  });
});

adminRouter.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});
