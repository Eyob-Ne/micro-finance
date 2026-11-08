import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// Enforce authentication and admin-only role restriction across all user management routes
router.use(verifyToken, allowRoles('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
