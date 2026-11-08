import express from 'express';
import {
  createLoanProduct,
  getLoanProducts,
  applyForLoan,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoans,
  getLoanById,
  updateLoanProduct,
  deleteLoanProduct

} from '../controllers/loanController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// All loan routes require a valid authenticated session
router.use(verifyToken);

// Loan Products
router.post('/products', allowRoles('admin'), createLoanProduct);
router.get('/products', getLoanProducts);
router.put('/products/:id', allowRoles('admin'), updateLoanProduct);
router.delete('/products/:id', allowRoles('admin'), deleteLoanProduct);
// Loan Lifecycle
router.post('/apply', allowRoles('admin', 'manager', 'loan_officer'), applyForLoan);
router.put('/:id/approve', allowRoles('admin', 'manager'), approveLoan);
router.put('/:id/reject', allowRoles('admin', 'manager'), rejectLoan);
router.put('/:id/disburse', allowRoles('admin', 'cashier'), disburseLoan);

// Queries
router.get('/', getLoans);
router.get('/:id', getLoanById);

export default router;
