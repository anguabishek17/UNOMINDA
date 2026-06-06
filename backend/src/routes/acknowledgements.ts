import { Router } from 'express';
import { acknowledgeInstruction, getUserAcknowledgements } from '../controllers/instructions';
import { verifyToken } from '../middleware/auth';

const router = Router();

// GET /api/acknowledgements
router.get('/', verifyToken, getUserAcknowledgements);

// POST /api/acknowledgements
router.post('/', verifyToken, acknowledgeInstruction);

export default router;
