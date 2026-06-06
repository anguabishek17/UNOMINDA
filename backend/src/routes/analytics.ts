import { Router } from 'express';
import { getDashboardStats, getComplianceCharts } from '../controllers/analytics';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/stats', verifyToken, requireRole(['ADMIN']), getDashboardStats);
router.get('/charts', verifyToken, requireRole(['ADMIN']), getComplianceCharts);

export default router;
