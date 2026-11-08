import express from 'express';
import {
  getDashboardStats,
  getLoanPortfolioReport,
  getRepaymentScheduleReport,
  getCollectionReport,
  getLoanOfficerPerformance,
} from '../controllers/reportController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// Require authenticated session and staff role
router.use(verifyToken, allowRoles('admin', 'manager', 'loan_officer', 'cashier'));

router.get('/dashboard', getDashboardStats);
router.get('/portfolio', getLoanPortfolioReport);
router.get('/schedule', getRepaymentScheduleReport);
router.get('/collections', getCollectionReport);
router.get('/officer-performance', getLoanOfficerPerformance);

export default router;
