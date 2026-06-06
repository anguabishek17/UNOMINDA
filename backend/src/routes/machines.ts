import { Router } from 'express';
import { createMachine, updateMachine, deleteMachine, getMachines, getMachineByCode, updateMachineExitPassword } from '../controllers/machines';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', verifyToken, requireRole(['ADMIN']), createMachine);
router.put('/:id', verifyToken, requireRole(['ADMIN']), updateMachine);
router.put('/:id/exit-password', verifyToken, requireRole(['ADMIN']), updateMachineExitPassword);
router.delete('/:id', verifyToken, requireRole(['ADMIN']), deleteMachine);
router.get('/', verifyToken, getMachines);
router.get('/scan/:code', verifyToken, getMachineByCode);

export default router;
