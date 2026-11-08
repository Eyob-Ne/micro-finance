import express from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  reactivateClient,
} from '../controllers/clientController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Define multer fields for KYC document uploads
const kycUpload = upload.fields([
  { name: 'kyc_id', maxCount: 1 },
  { name: 'kyc_photo', maxCount: 1 },
]);

// Protect all client routes and restrict access to admin, manager, and loan_officer roles
router.use(verifyToken, allowRoles('admin', 'manager', 'loan_officer','cashier'));

router.post('/', kycUpload, createClient);
router.get('/', getClients);
router.get('/:id', getClientById);
router.put('/:id', kycUpload, updateClient);
router.put('/:id/reactivate', reactivateClient);
router.delete('/:id', deleteClient);

export default router;
