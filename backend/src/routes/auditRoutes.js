import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { verifyToken, allowRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, allowRoles('admin'));

router.get('/', getAuditLogs);

export default router;
