import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Writable } from 'stream';

interface ComplianceData {
  employeeName: string;
  email: string;
  role: string;
  departmentName: string;
  assignedCount: number;
  acknowledgedCount: number;
  complianceRate: number;
}

interface MachineData {
  machineCode: string;
  machineName: string;
  lineName: string;
  deptName: string;
  activeInstructions: number;
  totalViews: number;
  totalAcknowledgements: number;
  complianceRate: number;
}

interface AuditLogData {
  user: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
  date: string;
}

export const reportService = {
  /**
   * Generate PDF Report for Employee Compliance
   */
  async generateEmployeeCompliancePDF(
    stream: Writable,
    data: ComplianceData[],
    filters: { departmentName?: string; plantName?: string }
  ): Promise<void> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(stream);

    // Header
    doc.fillColor('#0f172a').rect(0, 0, 595.28, 90).fill();
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('UNO MINDA GROUP', 40, 25);
    doc.fontSize(12).font('Helvetica').text('Industrial Machine Instruction Management System', 40, 50);
    
    // Title
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Employee Compliance Report', 40, 110);
    
    // Filters metadata
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 130);
    doc.text(`Plant: ${filters.plantName || 'All'} | Department: ${filters.departmentName || 'All'}`, 40, 145);
    
    // Draw horizontal line
    doc.moveTo(40, 160).lineTo(555, 160).strokeColor('#cbd5e1').lineWidth(1).stroke();

    // Table Header
    let y = 180;
    doc.fillColor('#1e293b').rect(40, y, 515, 25).fill();
    
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('Employee', 45, y + 8, { width: 120 });
    doc.text('Department', 170, y + 8, { width: 100 });
    doc.text('Role', 280, y + 8, { width: 80 });
    doc.text('Assigned', 370, y + 8, { width: 50, align: 'center' });
    doc.text('Done', 430, y + 8, { width: 50, align: 'center' });
    doc.text('Compliance', 490, y + 8, { width: 60, align: 'right' });

    y += 25;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');

    // Table Body
    data.forEach((row, i) => {
      // Alternating background
      if (i % 2 === 1) {
        doc.fillColor('#f8fafc').rect(40, y, 515, 20).fill();
      }

      // Check if page needs break
      if (y > 750) {
        doc.addPage();
        y = 40;
        
        // Re-draw table header
        doc.fillColor('#1e293b').rect(40, y, 515, 25).fill();
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
        doc.text('Employee', 45, y + 8, { width: 120 });
        doc.text('Department', 170, y + 8, { width: 100 });
        doc.text('Role', 280, y + 8, { width: 80 });
        doc.text('Assigned', 370, y + 8, { width: 50, align: 'center' });
        doc.text('Done', 430, y + 8, { width: 50, align: 'center' });
        doc.text('Compliance', 490, y + 8, { width: 60, align: 'right' });
        y += 25;
        doc.font('Helvetica').fontSize(9).fillColor('#334155');
      }

      doc.fillColor('#334155');
      doc.text(row.employeeName, 45, y + 6, { width: 120 });
      doc.text(row.departmentName, 170, y + 6, { width: 100 });
      doc.text(row.role, 280, y + 6, { width: 80 });
      doc.text(row.assignedCount.toString(), 370, y + 6, { width: 50, align: 'center' });
      doc.text(row.acknowledgedCount.toString(), 430, y + 6, { width: 50, align: 'center' });
      
      // Compliance color code
      const complianceStr = `${row.complianceRate.toFixed(1)}%`;
      if (row.complianceRate >= 90) {
        doc.fillColor('#15803d'); // Green
      } else if (row.complianceRate >= 50) {
        doc.fillColor('#b45309'); // Amber
      } else {
        doc.fillColor('#b91c1c'); // Red
      }
      doc.text(complianceStr, 490, y + 6, { width: 60, align: 'right' });

      y += 20;
    });

    // Summary calculations
    y += 20;
    const avgCompliance = data.length > 0 
      ? data.reduce((acc, row) => acc + row.complianceRate, 0) / data.length 
      : 0;

    doc.fillColor('#f1f5f9').rect(40, y, 515, 40).fill();
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10);
    doc.text('Summary Metrics:', 50, y + 10);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Total Employees Evaluated: ${data.length}`, 50, y + 23);
    doc.text(`Average Plant Compliance Rate: ${avgCompliance.toFixed(1)}%`, 280, y + 23);

    doc.end();
  },

  /**
   * Generate PDF Report for Machine Instructions Status
   */
  async generateMachineReportPDF(
    stream: Writable,
    data: MachineData[]
  ): Promise<void> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(stream);

    // Header
    doc.fillColor('#0f172a').rect(0, 0, 595.28, 90).fill();
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('UNO MINDA GROUP', 40, 25);
    doc.fontSize(12).font('Helvetica').text('Industrial Machine Instruction Management System', 40, 50);
    
    // Title
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Machine Compliance & SOP Report', 40, 110);
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 130);
    
    doc.moveTo(40, 150).lineTo(555, 150).strokeColor('#cbd5e1').stroke();

    // Table Header
    let y = 170;
    doc.fillColor('#1e293b').rect(40, y, 515, 25).fill();
    
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('Code', 45, y + 8, { width: 70 });
    doc.text('Machine Name', 120, y + 8, { width: 120 });
    doc.text('Prod Line / Dept', 250, y + 8, { width: 130 });
    doc.text('SOPs', 390, y + 8, { width: 45, align: 'center' });
    doc.text('Views', 440, y + 8, { width: 45, align: 'center' });
    doc.text('Compliance', 495, y + 8, { width: 55, align: 'right' });

    y += 25;
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155');

    data.forEach((row, i) => {
      if (i % 2 === 1) {
        doc.fillColor('#f8fafc').rect(40, y, 515, 20).fill();
      }

      if (y > 750) {
        doc.addPage();
        y = 40;
        
        doc.fillColor('#1e293b').rect(40, y, 515, 25).fill();
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
        doc.text('Code', 45, y + 8, { width: 70 });
        doc.text('Machine Name', 120, y + 8, { width: 120 });
        doc.text('Prod Line / Dept', 250, y + 8, { width: 130 });
        doc.text('SOPs', 390, y + 8, { width: 45, align: 'center' });
        doc.text('Views', 440, y + 8, { width: 45, align: 'center' });
        doc.text('Compliance', 495, y + 8, { width: 55, align: 'right' });
        y += 25;
      }

      doc.fillColor('#334155');
      doc.text(row.machineCode, 45, y + 6, { width: 70 });
      doc.text(row.machineName, 120, y + 6, { width: 120 });
      doc.text(`${row.lineName} / ${row.deptName}`, 250, y + 6, { width: 130 });
      doc.text(row.activeInstructions.toString(), 390, y + 6, { width: 45, align: 'center' });
      doc.text(row.totalViews.toString(), 440, y + 6, { width: 45, align: 'center' });
      
      const compStr = `${row.complianceRate.toFixed(1)}%`;
      if (row.complianceRate >= 90) doc.fillColor('#15803d');
      else if (row.complianceRate >= 50) doc.fillColor('#b45309');
      else doc.fillColor('#b91c1c');

      doc.text(compStr, 495, y + 6, { width: 55, align: 'right' });
      y += 20;
    });

    doc.end();
  },

  /**
   * Export Excel spreadsheet of Audit Logs
   */
  async exportAuditLogsExcel(data: AuditLogData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('System Audit Logs');

    worksheet.columns = [
      { header: 'Date/Time', key: 'date', width: 25 },
      { header: 'User Email', key: 'user', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Details Description', key: 'details', width: 50 },
      { header: 'IP Address', key: 'ipAddress', width: 20 },
    ];

    // Format headers
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0F172A' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    headerRow.height = 30;

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Formatting cell alignment and gridlines
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      if (rowNumber % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8FAFC' },
          };
        });
      }
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return buffer;
  },

  /**
   * Export Excel spreadsheet of Employee Compliance
   */
  async exportComplianceExcel(data: ComplianceData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Compliance Metrics');

    worksheet.columns = [
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Department', key: 'departmentName', width: 25 },
      { header: 'Assigned SOPs', key: 'assignedCount', width: 15 },
      { header: 'Acknowledged SOPs', key: 'acknowledgedCount', width: 18 },
      { header: 'Compliance Rate (%)', key: 'complianceRate', width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E3A8A' }, // Blue-900 style
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 25;

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.height = 20;
      row.getCell(7).numFmt = '0.0"%"'; // Format compliance rate percentage
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return buffer;
  }
};
