import { prisma } from '../../server';
import * as bcrypt from 'bcrypt';

export const employeeService = {
  getAll: async (pharmacyId: number) => {
    return await prisma.employees.findMany({
      where: { pharmacy_id: pharmacyId },
      include: {
        users: {
          select: { id: true, full_name: true, email: true }
        }
      }
    });
  },

  create: async (pharmacyId: number, data: {
    full_name: string;
    email: string;
    phone?: string;
    address?: string;
    cni?: string;
    birth_date?: string;
    marital_status?: string;
    children_count?: number;
    password?: string;
  }) => {
    const hashedPassword = await bcrypt.hash(data.password || 'empleado123', 10);

    const user = await prisma.users.create({
      data: {
        email: data.email,
        password: hashedPassword,
        full_name: data.full_name,
        role: 'EMPLOYEE',
        pharmacy_id: pharmacyId,
        is_active: true
      } as any
    });

    const employee = await prisma.employees.create({
      data: {
        user_id: user.id,
        pharmacy_id: pharmacyId,
        phone: data.phone,
        address: data.address,
        cni: data.cni,
        birth_date: data.birth_date ? new Date(data.birth_date) : null,
        marital_status: data.marital_status,
        children_count: data.children_count || 0,
        vacation_days: 22,
        vacation_days_used: 0,
        updated_at: new Date()
      },
      include: { users: true }
    });

    return employee;
  },

  delete: async (id: number, pharmacyId: number) => {
    const employee = await prisma.employees.findFirst({
      where: { id, pharmacy_id: pharmacyId }
    });

    if (!employee) throw new Error('Empleado no encontrado');

    await prisma.shift_assignments.deleteMany({ where: { employee_id: id } });
    await prisma.employees.delete({ where: { id } });
    await prisma.users.delete({ where: { id: employee.user_id } });

    return { success: true };
  }
};
