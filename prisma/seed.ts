import { PrismaClient, Role, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database data...');
  // Delete in reverse order of dependency
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.attendanceRegularization.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.payroll.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.holiday.deleteMany({});

  console.log('Seeding initial data...');

  // Create default departments
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources' },
  });
  const engDept = await prisma.department.create({
    data: { name: 'Engineering' },
  });

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const employeePasswordHash = await bcrypt.hash('EmployeePassword123!', 12);

  // 1. Create Admin
  const adminEmployee = await prisma.employee.create({
    data: {
      employee_code: 'ADM001',
      full_name: 'Jane Smith',
      designation: 'HR Director',
      phone: '+15550100',
      address: '456 HR Blvd',
      status: EmployeeStatus.active,
      joining_date: new Date('2025-01-01'),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@workmesh.com',
      password_hash: adminPasswordHash,
      role: Role.admin,
      email_verified: true,
      employee_id: adminEmployee.id,
    },
  });

  // Link employee to user
  await prisma.employee.update({
    where: { id: adminEmployee.id },
    data: { user_id: adminUser.id, department_id: hrDept.id },
  });

  // Create default leave balances for Admin
  await prisma.leaveBalance.createMany({
    data: [
      { employee_id: adminEmployee.id, leave_type: "Casual", total: 10, remaining: 10 },
      { employee_id: adminEmployee.id, leave_type: "Sick", total: 12, remaining: 12 },
      { employee_id: adminEmployee.id, leave_type: "Earned", total: 15, remaining: 15 },
    ],
  });

  // Set manager of HR department
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { manager_id: adminEmployee.id },
  });

  // 2. Create Registered Employee (EMP001)
  const employee1 = await prisma.employee.create({
    data: {
      employee_code: 'EMP001',
      full_name: 'John Doe',
      designation: 'Software Engineer',
      phone: '+15550199',
      address: '123 Main St',
      status: EmployeeStatus.active,
      joining_date: new Date('2025-06-01'),
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@workmesh.com',
      password_hash: employeePasswordHash,
      role: Role.employee,
      email_verified: true,
      employee_id: employee1.id,
    },
  });

  await prisma.employee.update({
    where: { id: employee1.id },
    data: { user_id: employeeUser.id, department_id: engDept.id },
  });

  // Create default leave balances for Employee 1
  await prisma.leaveBalance.createMany({
    data: [
      { employee_id: employee1.id, leave_type: "Casual", total: 10, remaining: 10 },
      { employee_id: employee1.id, leave_type: "Sick", total: 12, remaining: 12 },
      { employee_id: employee1.id, leave_type: "Earned", total: 15, remaining: 15 },
    ],
  });

  // 3. Create Unclaimed Employee Codes (for Signup flow testing)
  await prisma.employee.create({
    data: {
      employee_code: 'EMP002',
      status: EmployeeStatus.active,
    },
  });

  await prisma.employee.create({
    data: {
      employee_code: 'EMP003',
      status: EmployeeStatus.active,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Admin account created: admin@workmesh.com / AdminPassword123!');
  console.log('Employee account created: employee@workmesh.com / EmployeePassword123!');
  console.log('Unclaimed employee codes for signup: EMP002, EMP003');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
