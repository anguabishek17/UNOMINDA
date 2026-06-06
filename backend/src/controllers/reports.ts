import { Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { reportService } from '../services/report';
import { PassThrough } from 'stream';

export const getEmployeeComplianceReport = async (req: AuthRequest, res: Response) => {
  const { departmentId, format } = req.query;

  try {
    // 1. Fetch employees
    const employees = await prisma.user.findMany({
      where: {
        role: 'EMPLOYEE',
        departmentId: departmentId ? (departmentId as string) : undefined
      },
      include: {
        department: {
          include: { plant: true }
        }
      }
    });

    const reportData = await Promise.all(
      employees.map(async (emp) => {
        if (!emp.departmentId) {
          return {
            employeeName: emp.name,
            email: emp.email,
            role: emp.role,
            departmentName: 'Unassigned',
            assignedCount: 0,
            acknowledgedCount: 0,
            complianceRate: 100
          };
        }

        // Get lines in department
        const lines = await prisma.productionLine.findMany({
          where: { departmentId: emp.departmentId },
          select: { id: true }
        });
        const lineIds = lines.map(l => l.id);

        // Get machines in those lines
        const machines = await prisma.machine.findMany({
          where: { productionLineId: { in: lineIds } },
          select: { id: true }
        });
        const machineIds = machines.map(m => m.id);

        // Count instructions targeting:
        // - This department
        // - Lines in this department
        // - Machines in these lines
        const activeInstructions = await prisma.instruction.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { departmentId: emp.departmentId },
              { productionLineId: { in: lineIds } },
              { machineId: { in: machineIds } }
            ]
          },
          select: { id: true }
        });

        const assignedCount = activeInstructions.length;
        const assignedIds = activeInstructions.map(i => i.id);

        // Count acknowledgements for this user
        const acknowledgedCount = await prisma.acknowledgement.count({
          where: {
            userId: emp.id,
            instructionId: { in: assignedIds },
            status: 'ACKNOWLEDGED'
          }
        });

        const complianceRate = assignedCount > 0 
          ? (acknowledgedCount / assignedCount) * 100 
          : 100.0;

        return {
          employeeName: emp.name,
          email: emp.email,
          role: emp.role,
          departmentName: emp.department?.name || 'Unknown',
          assignedCount,
          acknowledgedCount,
          complianceRate
        };
      })
    );

    let filterDeptName = 'All';
    if (departmentId) {
      const d = await prisma.department.findUnique({ where: { id: departmentId as string } });
      if (d) filterDeptName = d.name;
    }

    if (format === 'excel') {
      const buffer = await reportService.exportComplianceExcel(reportData);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Employee_Compliance_Report.xlsx"');
      return res.send(buffer);
    } else {
      // PDF format
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Employee_Compliance_Report.pdf"');
      const passThroughStream = new PassThrough();
      passThroughStream.pipe(res);

      await reportService.generateEmployeeCompliancePDF(passThroughStream, reportData, {
        departmentName: filterDeptName,
        plantName: employees[0]?.department?.plant?.name || 'All'
      });
      return;
    }
  } catch (error) {
    console.error('Error generating compliance report:', error);
    return res.status(500).json({ error: 'Server error generating compliance report.' });
  }
};

export const getMachineInstructionReport = async (req: AuthRequest, res: Response) => {
  const { lineId, format } = req.query;

  try {
    const machines = await prisma.machine.findMany({
      where: {
        productionLineId: lineId ? (lineId as string) : undefined
      },
      include: {
        productionLine: {
          include: {
            department: true
          }
        }
      }
    });

    const reportData = await Promise.all(
      machines.map(async (m) => {
        // Active instructions applying to this machine
        const instructions = await prisma.instruction.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { machineId: m.id },
              { productionLineId: m.productionLineId },
              { departmentId: m.productionLine.departmentId }
            ]
          },
          select: { id: true }
        });

        const activeInstructions = instructions.length;
        const instIds = instructions.map(inst => inst.id);

        // View and Acknowledgement counts
        const acks = await prisma.acknowledgement.findMany({
          where: {
            machineId: m.id,
            instructionId: { in: instIds }
          }
        });

        const totalViews = acks.filter(a => a.status === 'VIEWED' || a.status === 'ACKNOWLEDGED').length;
        const totalAcknowledgements = acks.filter(a => a.status === 'ACKNOWLEDGED').length;

        // Total employees in department
        const employeeCount = await prisma.user.count({
          where: {
            role: 'EMPLOYEE',
            departmentId: m.productionLine.departmentId
          }
        });

        // Target total acts: each active instruction should be acknowledged by every employee in the department
        const targetAcksCount = activeInstructions * employeeCount;
        const complianceRate = targetAcksCount > 0 
          ? (totalAcknowledgements / targetAcksCount) * 100
          : 100.0;

        return {
          machineCode: m.code,
          machineName: m.name,
          lineName: m.productionLine.name,
          deptName: m.productionLine.department.name,
          activeInstructions,
          totalViews,
          totalAcknowledgements,
          complianceRate: Math.min(complianceRate, 100.0) // cap at 100
        };
      })
    );

    if (format === 'excel') {
      // Excel not strictly specified, default is PDF. But we can build a combined Excel later if desired.
      // For now we run the PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Machine_Instruction_Report.pdf"');
      const passThroughStream = new PassThrough();
      passThroughStream.pipe(res);
      await reportService.generateMachineReportPDF(passThroughStream, reportData);
      return;
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Machine_Instruction_Report.pdf"');
      const passThroughStream = new PassThrough();
      passThroughStream.pipe(res);
      await reportService.generateMachineReportPDF(passThroughStream, reportData);
      return;
    }
  } catch (error) {
    console.error('Error generating machine report:', error);
    return res.status(500).json({ error: 'Server error generating machine report.' });
  }
};

export const getAuditReport = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Grab latest 200 logs
    });

    const reportData = logs.map(l => ({
      date: l.createdAt.toLocaleString(),
      user: l.user?.email || 'System/Guest',
      role: l.user?.role || 'SYSTEM',
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress || 'Unknown'
    }));

    const buffer = await reportService.exportAuditLogsExcel(reportData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Audit_Trail_Report.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating audit log Excel:', error);
    return res.status(500).json({ error: 'Server error generating audit report.' });
  }
};

export const getComplianceLedger = async (req: AuthRequest, res: Response) => {
  const { departmentId } = req.query;

  try {
    const acks = await prisma.acknowledgement.findMany({
      where: {
        status: 'ACKNOWLEDGED',
        user: {
          role: 'EMPLOYEE',
          departmentId: departmentId ? (departmentId as string) : undefined
        }
      },
      include: {
        user: { 
          select: { 
            name: true, 
            email: true, 
            department: true 
          } 
        },
        machine: true,
        instruction: true
      },
      orderBy: {
        acknowledgedAt: 'desc'
      }
    });

    const data = acks.map(a => ({
      name: a.user.name,
      email: a.user.email,
      dept: a.user.department?.name || 'Unassigned',
      machineCode: a.machine.code,
      instructionTitle: a.instruction.title,
      acknowledgedAt: a.acknowledgedAt ? a.acknowledgedAt.toLocaleString() : 'N/A',
      duration: a.duration,
      status: a.status
    }));

    return res.json(data);
  } catch (error) {
    console.error('Error fetching compliance ledger:', error);
    return res.status(500).json({ error: 'Server error fetching compliance ledger.' });
  }
};
