import express from 'express';
import {
  openAccount,
  deposit,
  withdraw,
  getAccountByClient,
  getTransactionHistory,
} from '../controllers/savingsController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// Require authenticated session and staff role
router.use(verifyToken, allowRoles('admin', 'manager', 'loan_officer', 'cashier'));

router.post('/open', openAccount);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/client/:clientId', getAccountByClient);
router.get('/transactions/:accountId', getTransactionHistory);

export default router;
