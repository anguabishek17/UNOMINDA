import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'unominda_super_secret_jwt_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'unominda_super_secret_refresh_key_2026';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { plant: true, department: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' } // Access token valid for 1 day for convenience during testing
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Write audit log asynchronously
    logAudit(user.id, 'USER_LOGIN', { email: user.email, name: user.name }, req as any).catch(err => {
      console.error('Failed to log audit in login:', err);
    });

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plant: user.plant ? { id: user.plant.id, name: user.plant.name } : null,
        department: user.department ? { id: user.department.id, name: user.department.name } : null
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
};

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, name, role, plantId, departmentId } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Email, password, name, and role are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        plantId: plantId || null,
        departmentId: departmentId || null
      }
    });

    // Write audit log
    await logAudit(req.user?.id || null, 'CREATE_USER', { email, name, role }, req);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { plant: true, department: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plant: user.plant ? { id: user.plant.id, name: user.plant.name } : null,
        department: user.department ? { id: user.department.id, name: user.department.name } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { plant: true, department: true },
      orderBy: { createdAt: 'desc' }
    });

    // Strip password field
    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      plantName: u.plant?.name || 'All Plants',
      departmentName: u.department?.name || 'All Departments',
      createdAt: u.createdAt
    }));

    return res.json(sanitized);
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching users list' });
  }
};

export const getPlantsAndDepartments = async (req: Request, res: Response) => {
  try {
    const plants = await prisma.plant.findMany({
      include: {
        departments: {
          include: {
            lines: {
              include: {
                machines: true
              }
            }
          }
        }
      }
    });

    return res.json(plants);
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching plants metadata' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({ token });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
};
