import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export const createLine = async (req: AuthRequest, res: Response) => {
  const { name, departmentId, description } = req.body;

  if (!name || !departmentId) {
    return res.status(400).json({ error: 'Name and departmentId are required.' });
  }

  try {
    const line = await prisma.productionLine.create({
      data: {
        name,
        departmentId,
        description: description || null
      },
      include: {
        department: {
          include: { plant: true }
        }
      }
    });

    await logAudit(req.user?.id || null, 'CREATE_LINE', { lineId: line.id, name }, req);

    return res.status(201).json(line);
  } catch (error) {
    console.error('Error creating line:', error);
    return res.status(500).json({ error: 'Server error creating production line.' });
  }
};

export const updateLine = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, departmentId, description } = req.body;

  try {
    const current = await prisma.productionLine.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Production line not found.' });
    }

    const line = await prisma.productionLine.update({
      where: { id },
      data: {
        name: name || undefined,
        departmentId: departmentId || undefined,
        description: description !== undefined ? description : undefined
      },
      include: {
        department: {
          include: { plant: true }
        }
      }
    });

    await logAudit(req.user?.id || null, 'UPDATE_LINE', { lineId: line.id, name }, req);

    return res.json(line);
  } catch (error) {
    console.error('Error updating line:', error);
    return res.status(500).json({ error: 'Server error updating production line.' });
  }
};

export const deleteLine = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const current = await prisma.productionLine.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Production line not found.' });
    }

    await prisma.productionLine.delete({ where: { id } });

    await logAudit(req.user?.id || null, 'DELETE_LINE', { lineId: id, name: current.name }, req);

    return res.json({ message: 'Production line deleted successfully.' });
  } catch (error) {
    console.error('Error deleting line:', error);
    return res.status(500).json({ error: 'Server error deleting production line.' });
  }
};

export const getLines = async (req: AuthRequest, res: Response) => {
  const { departmentId } = req.query;

  try {
    const filters: any = {};
    if (departmentId) {
      filters.departmentId = departmentId as string;
    }

    const lines = await prisma.productionLine.findMany({
      where: filters,
      include: {
        department: {
          include: { plant: true }
        },
        machines: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json(lines);
  } catch (error) {
    console.error('Error fetching lines:', error);
    return res.status(500).json({ error: 'Server error fetching production lines.' });
  }
};
