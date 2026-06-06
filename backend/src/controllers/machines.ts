import { Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

// Helper to generate QR Code Base64
const generateQRCodeBase64 = async (machineCode: string): Promise<string> => {
  // Point to the frontend's scanning verification page
  const scanUrl = `/employee/scan/${machineCode}`;
  return await QRCode.toDataURL(scanUrl, {
    color: {
      dark: '#0f172a',  // Slate 900
      light: '#ffffff', // White
    },
    width: 300,
    margin: 2
  });
};

export const createMachine = async (req: AuthRequest, res: Response) => {
  const { name, code, productionLineId, location, status } = req.body;

  if (!name || !code || !productionLineId || !location) {
    return res.status(400).json({ error: 'Name, code, productionLineId, and location are required.' });
  }

  try {
    const existing = await prisma.machine.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Machine with this code already exists.' });
    }

    const qrCode = await generateQRCodeBase64(code);

    const machine = await prisma.machine.create({
      data: {
        name,
        code,
        productionLineId,
        location,
        status: status || 'ACTIVE',
        qrCode
      },
      include: {
        productionLine: {
          include: {
            department: {
              include: { plant: true }
            }
          }
        }
      }
    });

    await logAudit(req.user?.id || null, 'CREATE_MACHINE', { machineId: machine.id, code, name }, req);

    return res.status(201).json(machine);
  } catch (error: any) {
    console.error('Error creating machine:', error);
    return res.status(500).json({ error: 'Server error creating machine.' });
  }
};

export const updateMachine = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, code, productionLineId, location, status } = req.body;

  try {
    const current = await prisma.machine.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Machine not found.' });
    }

    let qrCode = current.qrCode;
    if (code && code !== current.code) {
      const existing = await prisma.machine.findUnique({ where: { code } });
      if (existing) {
        return res.status(400).json({ error: 'Machine code already in use.' });
      }
      qrCode = await generateQRCodeBase64(code);
    }

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        name: name || undefined,
        code: code || undefined,
        productionLineId: productionLineId || undefined,
        location: location || undefined,
        status: status || undefined,
        qrCode
      },
      include: {
        productionLine: {
          include: {
            department: {
              include: { plant: true }
            }
          }
        }
      }
    });

    await logAudit(req.user?.id || null, 'UPDATE_MACHINE', { machineId: machine.id, name, status }, req);

    return res.json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    return res.status(500).json({ error: 'Server error updating machine.' });
  }
};

export const deleteMachine = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const machine = await prisma.machine.findUnique({ where: { id } });
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found.' });
    }

    await prisma.machine.delete({ where: { id } });

    await logAudit(req.user?.id || null, 'DELETE_MACHINE', { machineId: id, code: machine.code }, req);

    return res.json({ message: 'Machine deleted successfully.' });
  } catch (error) {
    console.error('Error deleting machine:', error);
    return res.status(500).json({ error: 'Server error deleting machine.' });
  }
};

export const getMachines = async (req: AuthRequest, res: Response) => {
  const { search, lineId, departmentId, status } = req.query;

  try {
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (lineId) {
      filters.productionLineId = lineId;
    }

    if (departmentId) {
      filters.productionLine = {
        departmentId: departmentId as string
      };
    }

    if (search) {
      filters.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const machines = await prisma.machine.findMany({
      where: filters,
      include: {
        productionLine: {
          include: {
            department: {
              include: { plant: true }
            }
          }
        },
        instructions: {
          where: { status: 'ACTIVE' }
        }
      },
      orderBy: { code: 'asc' }
    });

    return res.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    return res.status(500).json({ error: 'Server error fetching machines.' });
  }
};

export const getMachineByCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;

  try {
    const machine = await prisma.machine.findUnique({
      where: { code },
      include: {
        productionLine: {
          include: {
            department: {
              include: { plant: true }
            }
          }
        }
      }
    });

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found.' });
    }

    // Fetch instructions that apply to:
    // 1. This specific machine
    // 2. This machine's production line
    // 3. This machine's department
    const instructions = await prisma.instruction.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { machineId: machine.id },
          { productionLineId: machine.productionLineId },
          { departmentId: machine.productionLine.departmentId }
        ]
      },
      include: {
        attachments: true,
        acknowledgements: {
          where: { userId: req.user?.id }
        }
      },
      orderBy: { priority: 'desc' }
    });

    // Write audit log for QR Scan
    await logAudit(
      req.user?.id || null, 
      'SCAN_QR_CODE', 
      { machineId: machine.id, machineCode: machine.code }, 
      req
    );

    return res.json({
      machine,
      instructions: instructions.map(inst => {
        // Map acknowledgement status for the current user
        const ack = inst.acknowledgements[0];
        return {
          id: inst.id,
          title: inst.title,
          description: inst.description,
          instructionType: inst.instructionType,
          priority: inst.priority,
          version: inst.version,
          effectiveDate: inst.effectiveDate,
          expiryDate: inst.expiryDate,
          attachments: inst.attachments.map(att => ({
            id: att.id,
            filename: att.filename,
            size: att.size,
            mimetype: att.mimetype,
            // local path serving endpoint
            downloadUrl: `/api/instructions/download/${att.id}`
          })),
          acknowledged: ack ? ack.status === 'ACKNOWLEDGED' : false,
          acknowledgementStatus: ack ? ack.status : 'PENDING',
          acknowledgedAt: ack ? ack.acknowledgedAt : null,
          duration: ack ? ack.duration : 0
        };
      })
    });
  } catch (error) {
    console.error('Error fetching scanned machine details:', error);
    return res.status(500).json({ error: 'Server error fetching machine details.' });
  }
};

export const updateMachineExitPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { exitPassword } = req.body;

  try {
    const machine = await prisma.machine.update({
      where: { id },
      data: { exitPassword: exitPassword || null }
    });

    await logAudit(req.user?.id || null, 'UPDATE_MACHINE_PASSWORD', { machineId: id }, req);

    return res.json(machine);
  } catch (error) {
    console.error('Error updating machine exit password:', error);
    return res.status(500).json({ error: 'Server error updating machine exit password.' });
  }
};
