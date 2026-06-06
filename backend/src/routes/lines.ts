import { Router } from 'express';
import { createLine, updateLine, deleteLine, getLines } from '../controllers/lines';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', verifyToken, requireRole(['ADMIN']), createLine);
router.put('/:id', verifyToken, requireRole(['ADMIN']), updateLine);
router.delete('/:id', verifyToken, requireRole(['ADMIN']), deleteLine);
router.get('/', verifyToken, getLines);

export default router;
