import { Router } from 'express';
import { suggestSafetyWarnings, generateSafetyChecklist, summarizeSOP, convertToBulletPoints } from '../controllers/ai';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/suggest-warnings', verifyToken, requireRole(['ADMIN']), suggestSafetyWarnings);
router.post('/generate-checklist', verifyToken, requireRole(['ADMIN']), generateSafetyChecklist);
router.post('/summarize-sop', verifyToken, requireRole(['ADMIN']), summarizeSOP);
router.post('/bullet-points', verifyToken, requireRole(['ADMIN']), convertToBulletPoints);

export default router;
