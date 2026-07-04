import prisma from '../../../config/db';

export class PayrollService {
  public static async getEmployeePayroll(employeeId: string) {
    return prisma.payroll.findMany({
      where: { employee_id: employeeId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });
  }

  public static async createPayroll(data: { employeeId: string, month: number, year: number, basicSalary: number, deductions: number }) {
    const netSalary = data.basicSalary - data.deductions;

    return prisma.payroll.upsert({
      where: {
        employee_id_month_year: {
          employee_id: data.employeeId,
          month: data.month,
          year: data.year
        }
      },
      update: {
        basic_salary: data.basicSalary,
        deductions: data.deductions,
        net_salary: netSalary
      },
      create: {
        employee_id: data.employeeId,
        month: data.month,
        year: data.year,
        basic_salary: data.basicSalary,
        deductions: data.deductions,
        net_salary: netSalary
      }
    });
  }
}
