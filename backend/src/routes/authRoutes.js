import express from 'express';
import { login, getProfile, changePassword } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public route
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, changePassword);

export default router;
