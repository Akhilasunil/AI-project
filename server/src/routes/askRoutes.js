import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ask } from '../controllers/askController.js';
import { requireAuth } from '../middleware/auth.js';

export const askRouter = Router();

const askLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many questions. Try again in a few minutes.',
      });
    },
  });

askRouter.use(requireAuth);
askRouter.post('/', askLimiter, ask);
