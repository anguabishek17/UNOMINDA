import { Router } from 'express';
import { 
  createInstruction, 
  getInstructions, 
  updateInstructionStatus, 
  deleteInstruction, 
  acknowledgeInstruction, 
  logViewDuration,
  downloadAttachment,
  createInstructionWithUpload,
  getInstructionsByMachine,
  downloadInstructionSOP,
  updateInstructionExitPassword
} from '../controllers/instructions';
import { verifyToken, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Admin / Supervisor actions
router.post('/', verifyToken, requireRole(['ADMIN']), upload.array('files'), createInstruction);
router.post('/upload', verifyToken, requireRole(['ADMIN']), upload.single('file'), createInstructionWithUpload);
router.get('/', verifyToken, getInstructions);
router.get('/:machineId', verifyToken, getInstructionsByMachine);
router.put('/:id/status', verifyToken, requireRole(['ADMIN']), updateInstructionStatus);
router.put('/:id/exit-password', verifyToken, requireRole(['ADMIN']), updateInstructionExitPassword);
router.delete('/:id', verifyToken, requireRole(['ADMIN']), deleteInstruction);

// Employee actions
router.post('/acknowledge', verifyToken, acknowledgeInstruction);
router.post('/duration', verifyToken, logViewDuration);

// File serve (accessible by authenticated users)
router.get('/download/:id', verifyToken, downloadAttachment);
router.get('/download-sop/:id', verifyToken, downloadInstructionSOP);

export default router;
