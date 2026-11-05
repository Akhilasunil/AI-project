import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const authRouter = Router();

const loginRules = [
  body('email')
    .trim()
    .bail()
    .notEmpty()
    .withMessage('Enter your work email.')
    .isEmail()
    .withMessage('Enter a valid work email.')
    .isLength({ max: 254 })
    .withMessage('Enter a valid work email.'),
  body('password')
    .isString()
    .withMessage('Enter your password.')
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage('Enter your password.'),
];

authRouter.post('/login', loginRules, validate, login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
