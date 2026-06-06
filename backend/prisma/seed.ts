import { PrismaClient, Role, MachineStatus, InstructionType, Priority, InstructionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

const generateQRCodeBase64 = async (machineCode: string): Promise<string> => {
  const scanUrl = `/employee/scan/${machineCode}`;
  return await QRCode.toDataURL(scanUrl, {
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    width: 300,
    margin: 2
  });
};

async function main() {
  console.log('Starting DB Seeding...');

  // 1. Clean existing records (Optional, keep order for foreign key constraints)
  await prisma.auditLog.deleteMany({});
  await prisma.acknowledgement.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.instruction.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.productionLine.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.plant.deleteMany({});

  console.log('Cleared database records.');

  // 2. Create Plants
  const plant1 = await prisma.plant.create({
    data: {
      name: 'Uno Minda Gurugram Plant 1',
      code: 'PLANT-GGN-01',
      location: 'Sector 36, Gurugram, Haryana'
    }
  });

  const plant2 = await prisma.plant.create({
    data: {
      name: 'Uno Minda Pune Plant 2',
      code: 'PLANT-PNE-02',
      location: 'Chakan Industrial Area, Pune, Maharashtra'
    }
  });

  console.log('Created Plants.');

  // 3. Create Departments for GGN Plant 1
  const deptMachineShop = await prisma.department.create({
    data: {
      name: 'Machine Shop (CNC)',
      plantId: plant1.id
    }
  });

  const deptPressShop = await prisma.department.create({
    data: {
      name: 'Press Shop (Stamping)',
      plantId: plant1.id
    }
  });

  const deptQuality = await prisma.department.create({
    data: {
      name: 'Quality Assurance',
      plantId: plant1.id
    }
  });

  console.log('Created Departments.');

  // 4. Create Production Lines
  const lineCNC = await prisma.productionLine.create({
    data: {
      name: 'CNC Milling Line A',
      departmentId: deptMachineShop.id,
      description: 'High precision multi-axis milling line for auto-components.'
    }
  });

  const lineStamping = await prisma.productionLine.create({
    data: {
      name: 'Heavy Press Line B',
      departmentId: deptPressShop.id,
      description: 'Stamping and drawing panels for passenger vehicles.'
    }
  });

  console.log('Created Production Lines.');

  // 5. Create Machines
  const cnc01Qr = await generateQRCodeBase64('CNC-01');
  const machineCNC01 = await prisma.machine.create({
    data: {
      name: 'Hyundai Wia F400 CNC Milling',
      code: 'CNC-01',
      productionLineId: lineCNC.id,
      location: 'Bay 3, South Row',
      status: MachineStatus.ACTIVE,
      qrCode: cnc01Qr,
      exitPassword: '1234'
    }
  });

  const cnc02Qr = await generateQRCodeBase64('CNC-02');
  const machineCNC02 = await prisma.machine.create({
    data: {
      name: 'Mazak QuickTurn CNC Lathe',
      code: 'CNC-02',
      productionLineId: lineCNC.id,
      location: 'Bay 3, North Row',
      status: MachineStatus.ACTIVE,
      qrCode: cnc02Qr,
      exitPassword: '1234'
    }
  });

  const press01Qr = await generateQRCodeBase64('PRESS-01');
  const machinePress01 = await prisma.machine.create({
    data: {
      name: 'AIDA 400T Hydraulic Press',
      code: 'PRESS-01',
      productionLineId: lineStamping.id,
      location: 'Bay 1, East Side',
      status: MachineStatus.ACTIVE,
      qrCode: press01Qr,
      exitPassword: '1234'
    }
  });

  const press02Qr = await generateQRCodeBase64('PRESS-02');
  const machinePress02 = await prisma.machine.create({
    data: {
      name: 'Komatsu 200T Mechanical Press',
      code: 'PRESS-02',
      productionLineId: lineStamping.id,
      location: 'Bay 1, West Side',
      status: MachineStatus.MAINTENANCE,
      qrCode: press02Qr,
      exitPassword: '1234'
    }
  });

  console.log('Created Machines with QR codes.');

  // 6. Create Users
  const salt = bcrypt.genSaltSync(10);
  
  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@unominda.com',
      password: bcrypt.hashSync('admin123', salt),
      name: 'Karan Sharma',
      role: Role.ADMIN
    }
  });

  // Plant Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@unominda.com',
      password: bcrypt.hashSync('admin123', salt),
      name: 'Rajesh Kumar',
      role: Role.ADMIN,
      plantId: plant1.id
    }
  });

  // Supervisor (Machine Shop)
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@unominda.com',
      password: bcrypt.hashSync('supervisor123', salt),
      name: 'Vijay Yadav',
      role: Role.ADMIN,
      plantId: plant1.id,
      departmentId: deptMachineShop.id
    }
  });

  // Employee 1 (CNC Operator - Machine Shop)
  const employeeCNC = await prisma.user.create({
    data: {
      email: 'employee@unominda.com',
      password: bcrypt.hashSync('employee123', salt),
      name: 'Ramesh Patel',
      role: Role.EMPLOYEE,
      plantId: plant1.id,
      departmentId: deptMachineShop.id
    }
  });

  // Employee 2 (Press Operator - Press Shop)
  const employeePress = await prisma.user.create({
    data: {
      email: 'operator2@unominda.com',
      password: bcrypt.hashSync('operator123', salt),
      name: 'Sanjay Dutt',
      role: Role.EMPLOYEE,
      plantId: plant1.id,
      departmentId: deptPressShop.id
    }
  });

  console.log('Created Users.');

  // 7. Create Instructions & SOPs
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // Machine CNC-01 SOP
  const inst1 = await prisma.instruction.create({
    data: {
      title: 'CNC Hyundai Wia - Morning Startup SOP',
      description: 'Comprehensive guide to initializing the CNC vertical machining center. Check lubrication oil levels, air pressure (min 6 bar), clean the sliding door guide rail, load G-code coordinate program via USB, perform standard reference axis homing (G28 X0 Y0 Z0), and test spindle rotation at low speed.',
      instructionType: InstructionType.OPERATING,
      priority: Priority.HIGH,
      version: '1.0',
      effectiveDate: oneMonthAgo,
      expiryDate: oneYearLater,
      status: InstructionStatus.ACTIVE,
      machineId: machineCNC01.id,
      exitPassword: '1234'
    }
  });

  // Machine PRESS-01 SOP
  const inst2 = await prisma.instruction.create({
    data: {
      title: '400T Hydraulic Press - Safety Light Curtain Check',
      description: 'Crucial daily inspection procedure for AIDA 400T Press. Turn on controller, engage the stroke mechanism, pass hand/test block through the infra-red safety curtains. Confirm cycle immediately aborts within 80ms. Never operate if indicator fails to turn red upon curtain break.',
      instructionType: InstructionType.SAFETY,
      priority: Priority.CRITICAL,
      version: '1.2',
      effectiveDate: oneMonthAgo,
      expiryDate: oneYearLater,
      status: InstructionStatus.ACTIVE,
      machineId: machinePress01.id,
      exitPassword: '1234'
    }
  });

  // Department-level generic SOP
  const inst3 = await prisma.instruction.create({
    data: {
      title: 'General Shop Floor Fire and Emergency Protocol',
      description: 'Emergency safety instruction for all machine shop operators. In case of localized fire/electrical spark: immediately hit the main circuit breaker red lever. Grab nearest Class ABC fire extinguisher, pull pin, aim at base, squeeze, and sweep. Report to Assembly area gate 2.',
      instructionType: InstructionType.EMERGENCY,
      priority: Priority.CRITICAL,
      version: '2.0',
      effectiveDate: oneMonthAgo,
      status: InstructionStatus.ACTIVE,
      departmentId: deptMachineShop.id,
      exitPassword: '1234'
    }
  });

  console.log('Created Instructions.');

  // 8. Create Acknowledgements (simulate some completions)
  // Ramesh Patel (employeeCNC) viewed and acknowledged the Emergency protocol
  await prisma.acknowledgement.create({
    data: {
      userId: employeeCNC.id,
      machineId: machineCNC01.id,
      instructionId: inst3.id,
      viewedAt: oneMonthAgo,
      acknowledgedAt: new Date(),
      duration: 125, // 2 mins 5 seconds
      status: 'ACKNOWLEDGED'
    }
  });

  // Ramesh Patel viewed the CNC Startup SOP but has not yet acknowledged it (status: VIEWED)
  await prisma.acknowledgement.create({
    data: {
      userId: employeeCNC.id,
      machineId: machineCNC01.id,
      instructionId: inst1.id,
      viewedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      status: 'VIEWED',
      duration: 45
    }
  });

  console.log('Seeded Acknowledgements.');
  console.log('DB Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
