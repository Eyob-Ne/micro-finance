import express from 'express';
import {
  recordRepayment,
  applyPenalties,
  getOverdueLoans,
} from '../controllers/repaymentController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// All repayment routes require authentication
router.use(verifyToken);

// Overdue list and penalty batch runner
router.get('/overdue', getOverdueLoans);
router.post('/apply-penalties', allowRoles('admin', 'manager'), applyPenalties);

// Record repayment (Cashier, Manager, Admin)
router.post('/', allowRoles('admin', 'manager', 'cashier'), recordRepayment);

export default router;
