import { Router } from 'express';
import { getEmployeeComplianceReport, getMachineInstructionReport, getAuditReport, getComplianceLedger } from '../controllers/reports';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/compliance', verifyToken, requireRole(['ADMIN']), getEmployeeComplianceReport);
router.get('/machines', verifyToken, requireRole(['ADMIN']), getMachineInstructionReport);
router.get('/audit', verifyToken, requireRole(['ADMIN']), getAuditReport);
router.get('/completions', verifyToken, requireRole(['ADMIN']), getComplianceLedger);

export default router;
