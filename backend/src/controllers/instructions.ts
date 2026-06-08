import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { AuthRequest, logAudit } from '../middleware/auth';

export const createInstruction = async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    instructionType,
    priority,
    version,
    effectiveDate,
    expiryDate,
    status,
    machineId,
    productionLineId,
    departmentId
  } = req.body;

  if (!title || !instructionType) {
    return res.status(400).json({ error: 'Title and Instruction Type are required.' });
  }

  try {
    const files = req.files as Express.Multer.File[];
    const parsedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();
    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

    // Create the instruction and attachments inside a transaction
    const instruction = await prisma.$transaction(async (tx) => {
      const inst = await tx.instruction.create({
        data: {
          title,
          description: description || '',
          instructionType,
          priority: priority || 'MEDIUM',
          version: version || '1.0',
          effectiveDate: parsedEffectiveDate,
          expiryDate: parsedExpiryDate,
          status: status || 'DRAFT',
          machineId: machineId || null,
          productionLineId: productionLineId || null,
          departmentId: departmentId || null
        }
      });

      if (files && files.length > 0) {
        await tx.attachment.createMany({
          data: files.map(file => ({
            filename: file.originalname,
            filepath: file.filename, // Store name in uploads
            mimetype: file.mimetype,
            size: file.size,
            instructionId: inst.id
          }))
        });
      }

      return tx.instruction.findUnique({
        where: { id: inst.id },
        include: { attachments: true, machine: true }
      });
    });

    // Write audit log
    await logAudit(
      req.user?.id || null,
      'CREATE_INSTRUCTION',
      { instructionId: instruction?.id, title: instruction?.title, type: instructionType },
      req
    );

    // Notify Employees assigned to this target
    if (instruction && instruction.status === 'ACTIVE') {
      await createNotificationsForInstruction(instruction);
    }

    return res.status(201).json(instruction);
  } catch (error: any) {
    console.error('Error creating instruction:', error);
    return res.status(500).json({ error: 'Server error creating instruction.' });
  }
};

export const getInstructions = async (req: AuthRequest, res: Response) => {
  const { search, type, machineId, lineId, departmentId, status } = req.query;

  try {
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (type) {
      filters.instructionType = type;
    }

    if (machineId) {
      filters.machineId = machineId;
    }

    if (lineId) {
      filters.productionLineId = lineId;
    }

    if (departmentId) {
      filters.departmentId = departmentId;
    }

    if (search) {
      filters.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const instructions = await prisma.instruction.findMany({
      where: filters,
      include: {
        attachments: true,
        machine: true,
        productionLine: true,
        department: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(instructions);
  } catch (error) {
    console.error('Error fetching instructions:', error);
    return res.status(500).json({ error: 'Server error fetching instructions.' });
  }
};

export const updateInstructionStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const updated = await prisma.instruction.update({
      where: { id },
      data: { status },
      include: { attachments: true }
    });

    await logAudit(req.user?.id || null, 'UPDATE_INSTRUCTION_STATUS', { instructionId: id, status }, req);

    if (status === 'ACTIVE') {
      await createNotificationsForInstruction(updated);
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating instruction status:', error);
    return res.status(500).json({ error: 'Server error updating status.' });
  }
};

export const deleteInstruction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Delete files in uploads folder
    const attachments = await prisma.attachment.findMany({ where: { instructionId: id } });
    attachments.forEach(att => {
      const fullPath = path.join(__dirname, '../../uploads', att.filepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await prisma.instruction.delete({ where: { id } });

    await logAudit(req.user?.id || null, 'DELETE_INSTRUCTION', { instructionId: id }, req);

    return res.json({ message: 'Instruction and attachments deleted successfully.' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    return res.status(500).json({ error: 'Server error deleting instruction.' });
  }
};

export const acknowledgeInstruction = async (req: AuthRequest, res: Response) => {
  const { instructionId, machineId, duration, employeeId, exitPassword } = req.body;
  const userId = employeeId || req.user?.id;

  if (!userId || !instructionId) {
    return res.status(400).json({ error: 'employeeId (or user session) and instructionId are required.' });
  }

  let resolvedMachineId = machineId;
  let machineExists = false;

  try {
    if (resolvedMachineId) {
      try {
        const m = await prisma.machine.findUnique({ where: { id: resolvedMachineId } });
        if (m) machineExists = true;
      } catch (e) {
        machineExists = false;
      }
    }

    if (!machineExists) {
      const instruction = await prisma.instruction.findUnique({
        where: { id: instructionId },
        include: {
          machine: true,
          productionLine: { include: { machines: true } },
          department: { include: { lines: { include: { machines: true } } } }
        }
      });

      if (instruction) {
        if (instruction.machineId) {
          resolvedMachineId = instruction.machineId;
        } else if (instruction.productionLine && instruction.productionLine.machines.length > 0) {
          resolvedMachineId = instruction.productionLine.machines[0].id;
        } else if (instruction.department && instruction.department.lines.length > 0) {
          for (const line of instruction.department.lines) {
            if (line.machines.length > 0) {
              resolvedMachineId = line.machines[0].id;
              break;
            }
          }
        }
      }
    }

    if (!resolvedMachineId || resolvedMachineId === 'generic-machine-id') {
      const firstMachine = await prisma.machine.findFirst();
      if (firstMachine) {
        resolvedMachineId = firstMachine.id;
      }
    }

    if (!resolvedMachineId) {
      return res.status(400).json({ error: 'A valid MachineId is required for acknowledgement.' });
    }

    // Retrieve instruction and machine exit passwords for validation
    const instructionRecord = await prisma.instruction.findUnique({
      where: { id: instructionId }
    });
    
    const machineRecord = await prisma.machine.findUnique({
      where: { id: resolvedMachineId }
    });

    if (!instructionRecord || !machineRecord) {
      return res.status(404).json({ error: 'Instruction or machine not found.' });
    }

    const expectedPassword = instructionRecord.exitPassword || machineRecord.exitPassword || "1234";

    if (exitPassword !== expectedPassword) {
      return res.status(400).json({ error: 'Incorrect Exit Password' });
    }

    const ack = await prisma.acknowledgement.upsert({
      where: {
        userId_instructionId_machineId: {
          userId,
          instructionId,
          machineId: resolvedMachineId
        }
      },
      update: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        duration: duration ? parseInt(duration, 10) : 0
      },
      create: {
        userId,
        instructionId,
        machineId: resolvedMachineId,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        duration: duration ? parseInt(duration, 10) : 0
      }
    });

    await logAudit(
      userId, 
      'ACKNOWLEDGE_INSTRUCTION', 
      { instructionId, machineId: resolvedMachineId, duration: ack.duration }, 
      req
    );

    return res.json({ message: 'Instruction acknowledged successfully.', acknowledgement: ack });
  } catch (error) {
    console.error('[ACKNOWLEDGEMENT DATABASE ERROR] details:', {
      userId,
      employeeId,
      instructionId,
      machineId,
      resolvedMachineId,
      error: error instanceof Error ? error.stack || error.message : error
    });
    return res.status(500).json({ error: 'Server error saving acknowledgement.' });
  }
};

export const logViewDuration = async (req: AuthRequest, res: Response) => {
  const { instructionId, machineId, duration } = req.body;
  const userId = req.user?.id;

  if (!userId || !instructionId || !machineId) {
    return res.status(400).json({ error: 'Required fields: instructionId, machineId.' });
  }

  try {
    const ack = await prisma.acknowledgement.upsert({
      where: {
        userId_instructionId_machineId: {
          userId,
          instructionId,
          machineId
        }
      },
      update: {
        duration: { increment: duration ? parseInt(duration, 10) : 0 }
      },
      create: {
        userId,
        instructionId,
        machineId,
        status: 'VIEWED',
        duration: duration ? parseInt(duration, 10) : 0
      }
    });

    return res.json(ack);
  } catch (error) {
    return res.status(500).json({ error: 'Server error logging view duration.' });
  }
};

export const downloadAttachment = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const fullPath = path.join(__dirname, '../../uploads', attachment.filepath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Physical file not found on server storage.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    
    return fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error('File download error:', error);
    return res.status(500).json({ error: 'Server error downloading file.' });
  }
};

// Helper function to create notifications for employees target scopes
async function createNotificationsForInstruction(instruction: any) {
  try {
    let usersToNotify: Array<{ id: string }> = [];

    if (instruction.machineId) {
      // Find employees of the department/plant containing this machine
      const machine = await prisma.machine.findUnique({
        where: { id: instruction.machineId },
        include: {
          productionLine: {
            include: { department: true }
          }
        }
      });
      if (machine) {
        usersToNotify = await prisma.user.findMany({
          where: {
            role: 'EMPLOYEE',
            departmentId: machine.productionLine.departmentId
          },
          select: { id: true }
        });
      }
    } else if (instruction.productionLineId) {
      const line = await prisma.productionLine.findUnique({
        where: { id: instruction.productionLineId }
      });
      if (line) {
        usersToNotify = await prisma.user.findMany({
          where: {
            role: 'EMPLOYEE',
            departmentId: line.departmentId
          },
          select: { id: true }
        });
      }
    } else if (instruction.departmentId) {
      usersToNotify = await prisma.user.findMany({
        where: {
          role: 'EMPLOYEE',
          departmentId: instruction.departmentId
        },
        select: { id: true }
      });
    } else {
      // Broadcast to all employees
      usersToNotify = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: { id: true }
      });
    }

    if (usersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: usersToNotify.map(user => ({
          userId: user.id,
          title: `New Instruction Assigned: ${instruction.title}`,
          message: `SOP for machine/line: ${instruction.title} (${instruction.instructionType}) is now effective. Please scan machine and read.`,
          type: 'NEW_INSTRUCTION'
        }))
      });
    }
  } catch (err) {
    console.error('Failed to auto-send notifications:', err);
  }
}

export const createInstructionWithUpload = async (req: AuthRequest, res: Response) => {
  const {
    title,
    description,
    instructionType,
    priority,
    version,
    effectiveDate,
    expiryDate,
    status,
    machineId,
    productionLineId,
    departmentId
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }

  try {
    const file = req.file as Express.Multer.File;
    let fileUrl = null;
    let fileType = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      
      const mime = file.mimetype;
      if (mime.startsWith('image/')) {
        fileType = 'image';
      } else if (mime === 'application/pdf') {
        fileType = 'pdf';
      } else if (mime.startsWith('video/')) {
        fileType = 'video';
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mime === 'application/msword'
      ) {
        fileType = 'docx';
      } else {
        fileType = 'docx';
      }
    }

    const parsedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();
    const parsedExpiryDate = expiryDate ? new Date(expiryDate) : null;

    const instruction = await prisma.instruction.create({
      data: {
        title,
        description: description || '',
        instructionType: instructionType || 'OPERATING',
        priority: priority || 'MEDIUM',
        version: version || '1.0',
        effectiveDate: parsedEffectiveDate,
        expiryDate: parsedExpiryDate,
        status: status || 'ACTIVE',
        machineId: machineId || null,
        productionLineId: productionLineId || null,
        departmentId: departmentId || null,
        fileUrl,
        fileType,
        uploadedBy: req.user?.id || null
      },
      include: {
        machine: true,
        productionLine: true,
        department: true
      }
    });

    await logAudit(
      req.user?.id || null,
      'CREATE_INSTRUCTION_WITH_UPLOAD',
      { instructionId: instruction.id, title: instruction.title, fileType },
      req
    );

    if (instruction.status === 'ACTIVE') {
      await createNotificationsForInstruction(instruction);
    }

    return res.status(201).json(instruction);
  } catch (error: any) {
    console.error('Error creating instruction with upload:', error);
    return res.status(500).json({ error: 'Server error creating instruction with upload.' });
  }
};

export const getInstructionsByMachine = async (req: AuthRequest, res: Response) => {
  const { machineId } = req.params;

  try {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      include: {
        productionLine: true
      }
    });

    if (!machine) {
      return res.status(404).json({ error: 'Machine not found.' });
    }

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
        machine: true,
        productionLine: true,
        department: true,
        acknowledgements: {
          where: { userId: req.user?.id }
        }
      },
      orderBy: { priority: 'desc' }
    });

    return res.json(instructions.map(inst => {
      const ack = inst.acknowledgements[0];
      return {
        ...inst,
        acknowledged: ack ? ack.status === 'ACKNOWLEDGED' : false,
        acknowledgementStatus: ack ? ack.status : 'PENDING',
        acknowledgedAt: ack ? ack.acknowledgedAt : null,
        duration: ack ? ack.duration : 0
      };
    }));
  } catch (error) {
    console.error('Error fetching machine instructions:', error);
    return res.status(500).json({ error: 'Server error fetching machine instructions.' });
  }
};

export const downloadInstructionSOP = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const instruction = await prisma.instruction.findUnique({ where: { id } });
    if (!instruction || !instruction.fileUrl) {
      return res.status(404).json({ error: 'SOP file not found.' });
    }

    const filename = path.basename(instruction.fileUrl);
    const fullPath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Physical file not found on server.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    return fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    console.error('SOP download error:', error);
    return res.status(500).json({ error: 'Server error downloading SOP.' });
  }
};

export const updateInstructionExitPassword = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { exitPassword } = req.body;

  try {
    const instruction = await prisma.instruction.update({
      where: { id },
      data: { exitPassword: exitPassword || null }
    });

    await logAudit(req.user?.id || null, 'UPDATE_INSTRUCTION_PASSWORD', { instructionId: id }, req);

    return res.json(instruction);
  } catch (error) {
    console.error('Error updating instruction exit password:', error);
    return res.status(500).json({ error: 'Server error updating instruction exit password.' });
  }
};

export const getUserAcknowledgements = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const acks = await prisma.acknowledgement.findMany({
      where: {
        userId,
        status: 'ACKNOWLEDGED'
      },
      include: {
        machine: true,
        instruction: true
      },
      orderBy: {
        acknowledgedAt: 'desc'
      }
    });

    const formatted = acks.map(a => ({
      id: a.id,
      title: a.instruction.title,
      machineCode: a.machine.code,
      date: a.acknowledgedAt ? a.acknowledgedAt.toLocaleString() : 'N/A',
      duration: a.duration,
      priority: a.instruction.priority,
      type: a.instruction.instructionType,
      status: a.status
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching user acknowledgements:', error);
    return res.status(500).json({ error: 'Server error fetching acknowledgements.' });
  }
};
