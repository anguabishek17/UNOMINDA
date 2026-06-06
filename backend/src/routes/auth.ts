import { Router } from 'express';
import { login, register, getMe, getUsers, getPlantsAndDepartments, refreshToken } from '../controllers/auth';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', verifyToken, requireRole(['ADMIN']), register);
router.post('/refresh', refreshToken);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, requireRole(['ADMIN']), getUsers);
router.get('/metadata', getPlantsAndDepartments);

export default router;
