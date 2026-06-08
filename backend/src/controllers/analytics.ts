import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalMachines = await prisma.machine.count();
    const totalLines = await prisma.productionLine.count();
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const totalInstructions = await prisma.instruction.count();
    
    // Pending acknowledgements: total possible acknowledgements minus done ones
    // For active instructions and employees
    const activeInstructions = await prisma.instruction.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, departmentId: true, productionLineId: true, machineId: true }
    });

    const activeCount = activeInstructions.length;

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: { id: true, departmentId: true }
    });

    // Query all production lines and machines once to avoid N+1 queries inside loop
    const allLines = await prisma.productionLine.findMany({
      select: { id: true, departmentId: true }
    });
    const allMachines = await prisma.machine.findMany({
      select: { id: true, productionLineId: true }
    });

    // Build lookup maps
    const linesByDept = new Map<string, string[]>();
    for (const line of allLines) {
      if (!line.departmentId) continue;
      if (!linesByDept.has(line.departmentId)) {
        linesByDept.set(line.departmentId, []);
      }
      linesByDept.get(line.departmentId)!.push(line.id);
    }

    const machinesByLine = new Map<string, string[]>();
    for (const machine of allMachines) {
      if (!machine.productionLineId) continue;
      if (!machinesByLine.has(machine.productionLineId)) {
        machinesByLine.set(machine.productionLineId, []);
      }
      machinesByLine.get(machine.productionLineId)!.push(machine.id);
    }

    let totalPossibleAcks = 0;
    for (const emp of employees) {
      if (!emp.departmentId) continue;

      const lineIds = linesByDept.get(emp.departmentId) || [];
      const machineIds: string[] = [];
      for (const lineId of lineIds) {
        const mIds = machinesByLine.get(lineId) || [];
        machineIds.push(...mIds);
      }

      const applicableCount = activeInstructions.filter(inst => 
        inst.departmentId === emp.departmentId ||
        (inst.productionLineId && lineIds.includes(inst.productionLineId)) ||
        (inst.machineId && machineIds.includes(inst.machineId))
      ).length;

      totalPossibleAcks += applicableCount;
    }

    const completedAcks = await prisma.acknowledgement.count({
      where: {
        status: 'ACKNOWLEDGED',
        instruction: { status: 'ACTIVE' }
      }
    });

    const pendingAcknowledgements = Math.max(0, totalPossibleAcks - completedAcks);

    const now = new Date();
    const expiredInstructions = await prisma.instruction.count({
      where: {
        expiryDate: { lt: now }
      }
    });

    // Today's activity (logs from last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayLogs = await prisma.auditLog.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const todayActivities = todayLogs.map(l => ({
      id: l.id,
      user: l.user?.name || 'System',
      role: l.user?.role || 'SYSTEM',
      action: l.action,
      time: l.createdAt.toLocaleTimeString(),
      details: l.details ? JSON.parse(l.details) : {}
    }));

    return res.json({
      totalMachines,
      totalLines,
      totalEmployees,
      totalInstructions,
      pendingAcknowledgements,
      expiredInstructions,
      todayActivities
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Server error fetching dashboard stats.' });
  }
};

export const getComplianceCharts = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Department compliance charts
    const departments = await prisma.department.findMany({
      include: {
        users: { where: { role: 'EMPLOYEE' } },
        lines: {
          include: { machines: true }
        }
      }
    });

    const activeInstructions = await prisma.instruction.findMany({
      where: { status: 'ACTIVE' }
    });

    const departmentCompliance = await Promise.all(
      departments.map(async (dept) => {
        const empIds = dept.users.map(u => u.id);
        const lineIds = dept.lines.map(l => l.id);
        const machineIds = dept.lines.flatMap(l => l.machines.map(m => m.id));

        const applicableInstructions = activeInstructions.filter(inst => 
          inst.departmentId === dept.id ||
          (inst.productionLineId && lineIds.includes(inst.productionLineId)) ||
          (inst.machineId && machineIds.includes(inst.machineId))
        );

        const possibleAcksCount = applicableInstructions.length * empIds.length;

        const actualAcksCount = await prisma.acknowledgement.count({
          where: {
            userId: { in: empIds },
            instructionId: { in: applicableInstructions.map(i => i.id) },
            status: 'ACKNOWLEDGED'
          }
        });

        const compliance = possibleAcksCount > 0 
          ? (actualAcksCount / possibleAcksCount) * 100 
          : 100.0;

        return {
          department: dept.name,
          compliance: Math.round(compliance),
          employees: empIds.length
        };
      })
    );

    // 2. Machine compliance charts (top 5 machines with instructions)
    const machines = await prisma.machine.findMany({
      include: {
        productionLine: { include: { department: true } }
      },
      take: 8
    });

    // Query employee counts per department once to avoid nested DB count queries
    const employeeCounts = await prisma.user.groupBy({
      by: ['departmentId'],
      where: { role: 'EMPLOYEE' },
      _count: { id: true }
    });

    const employeeCountMap = new Map<string, number>();
    for (const group of employeeCounts) {
      if (group.departmentId) {
        employeeCountMap.set(group.departmentId, group._count.id);
      }
    }

    const machineCompliance = await Promise.all(
      machines.map(async (m) => {
        const instructions = activeInstructions.filter(inst => 
          inst.machineId === m.id ||
          inst.productionLineId === m.productionLineId ||
          inst.departmentId === m.productionLine.departmentId
        );

        const employeeCount = m.productionLine.departmentId ? (employeeCountMap.get(m.productionLine.departmentId) || 0) : 0;

        const target = instructions.length * employeeCount;

        const acksCount = await prisma.acknowledgement.count({
          where: {
            machineId: m.id,
            instructionId: { in: instructions.map(i => i.id) },
            status: 'ACKNOWLEDGED'
          }
        });

        const compliance = target > 0 ? (acksCount / target) * 100 : 100.0;

        return {
          machineCode: m.code,
          machineName: m.name,
          compliance: Math.min(Math.round(compliance), 100)
        };
      })
    );

    // 3. Instruction views over the last 6 months (static trend data helper combined with DB queries)
    const monthlyUploads = [
      { month: 'Jan', uploads: 4, completions: 85 },
      { month: 'Feb', uploads: 6, completions: 88 },
      { month: 'Mar', uploads: 5, completions: 90 },
      { month: 'Apr', uploads: 8, completions: 92 },
      { month: 'May', uploads: 10, completions: 94 },
      { month: 'Jun', uploads: 12, completions: 96 }
    ];

    return res.json({
      departmentCompliance,
      machineCompliance,
      monthlyUploads
    });
  } catch (error) {
    console.error('Error fetching charts:', error);
    return res.status(500).json({ error: 'Server error fetching charts.' });
  }
};
