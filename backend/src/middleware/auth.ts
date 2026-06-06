import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'EMPLOYEE';
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'unominda_super_secret_jwt_key_2026';

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (roles: Array<'ADMIN' | 'EMPLOYEE'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires one of roles: ${roles.join(', ')}` });
    }

    next();
  };
};

export const logAudit = async (
  userId: string | null,
  action: string,
  details: object,
  req: AuthRequest
) => {
  try {
    const { prisma } = require('../config/db');
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
