// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { prisma } from '../server';

// Extender el tipo Request para incluir el usuario autenticado
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
}

export class UserController {
  
  // ==========================================
  // MÉTODOS PARA EMPLEADOS (ADMIN y EMPLOYEE)
  // ==========================================
  
  async getAll(req: Request, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      const userRole = req.user?.role;
      
      let where: any = {};
      
      // Si es ADMIN, solo ve usuarios de su farmacia
      if (userRole === 'ADMIN' && pharmacyId) {
        where.pharmacy_id = pharmacyId;
      }
      // Si es EMPLOYEE, solo ve su propio perfil
      else if (userRole === 'EMPLOYEE' && req.user?.id) {
        where.id = req.user.id;
      }
      // SUPER_ADMIN ve todos los usuarios
      
      const users = await prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          pharmacy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pharmacyId = req.user?.pharmacyId;
      const userRole = req.user?.role;
      
      const where: any = { id: parseInt(id) };
      
      // Si es ADMIN, solo puede ver usuarios de su farmacia
      if (userRole === 'ADMIN' && pharmacyId) {
        where.pharmacy_id = pharmacyId;
      }
      // Si es EMPLOYEE, solo puede ver su propio perfil
      else if (userRole === 'EMPLOYEE') {
        if (parseInt(id) !== req.user?.id) {
          return res.status(403).json({ 
            success: false, 
            message: 'No tienes permiso para ver este usuario' 
          });
        }
      }
      
      const user = await prisma.users.findUnique({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          pharmacy: {
            select: {
              id: true,
              name: true,
              license: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error getting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { email, password, full_name, role = 'employee' } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      const userRole = req.user?.role;
      
      // Validar permisos
      if (userRole === 'EMPLOYEE') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para crear usuarios'
        });
      }
      
      // Si es ADMIN, solo puede crear usuarios en su farmacia con rol employee
      if (userRole === 'ADMIN' && role !== 'employee') {
        return res.status(403).json({
          success: false,
          message: 'Los administradores solo pueden crear empleados'
        });
      }

      const existingUser = await prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password || 'empleado123', 10);

      const user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          full_name: full_name,
          role,
          is_active: true,
          // Asignar farmacia según el rol
          pharmacy_id: role === 'SUPER_ADMIN' ? null : (pharmacyId || null)
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          pharmacy_id: true
        }
      });

      // Si el rol es employee, crear automáticamente el registro en employees
      if (role === 'employee') {
        await prisma.employees.create({
          data: {
          user_id: user.id,
          pharmacy_id: Number(pharmacyId), // pharmacy_id es requerido, debe tener valor
          vacation_days: 22, // 
          vacation_days_used: 0,
          updated_at: new Date()
        }
        });
      }

      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, full_name, role, is_active } = req.body;
      const pharmacyId = req.user?.pharmacyId;
      const userRole = req.user?.role;
      
      // Validar permisos
      if (userRole === 'EMPLOYEE' && parseInt(id) !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para modificar este usuario'
        });
      }
      
      // Si es ADMIN, solo puede modificar usuarios de su farmacia
      if (userRole === 'ADMIN' && pharmacyId) {
        const userToUpdate = await prisma.users.findUnique({
          where: { id: parseInt(id) },
          select: { pharmacy_id: true }
        });
        
        if (userToUpdate?.pharmacy_id !== pharmacyId) {
          return res.status(403).json({
            success: false,
            message: 'No puedes modificar usuarios de otra farmacia'
          });
        }
      }

      const user = await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          email,
          full_name: full_name,
          role,
          is_active: is_active
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          pharmacy_id: true
        }
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pharmacyId = req.user?.pharmacyId;
      const userRole = req.user?.role;
      
      // Validar permisos
      if (userRole !== 'SUPER_ADMIN') {
        // Si es ADMIN, solo puede eliminar usuarios de su farmacia
        if (userRole === 'ADMIN' && pharmacyId) {
          const userToDelete = await prisma.users.findUnique({
            where: { id: parseInt(id) },
            select: { pharmacy_id: true, role: true }
          });
          
          if (!userToDelete || userToDelete.pharmacy_id !== pharmacyId) {
            return res.status(403).json({
              success: false,
              message: 'No puedes eliminar usuarios de otra farmacia'
            });
          }
          
          if (userToDelete.role === 'SUPER_ADMIN') {
            return res.status(403).json({
              success: false,
              message: 'No puedes eliminar un SUPER_ADMIN'
            });
          }
        } else {
          return res.status(403).json({
            success: false,
            message: 'No tienes permiso para eliminar usuarios'
          });
        }
      }
      
      // Verificar que no sea el último SUPER_ADMIN
      if (userRole === 'SUPER_ADMIN') {
        const superAdminCount = await prisma.users.count({
          where: { role: 'SUPER_ADMIN' }
        });
        
        if (superAdminCount <= 1) {
          const userToDelete = await prisma.users.findUnique({
            where: { id: parseInt(id) },
            select: { role: true }
          });
          
          if (userToDelete?.role === 'SUPER_ADMIN') {
            return res.status(400).json({
              success: false,
              message: 'No puedes eliminar el último SUPER_ADMIN'
            });
          }
        }
      }
      
      await prisma.users.delete({ where: { id: parseInt(id) } });
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { full_name, email } = req.body;

      const user = await prisma.users.update({
        where: { id: userId },
        data: { full_name, email },
        select: { 
          id: true, 
          email: true, 
          full_name: true, 
          role: true,
          pharmacy_id: true,
          pharmacy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { currentPassword, newPassword } = req.body;
      
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { password: true }
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, user.password || '');
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.users.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      
      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==========================================
  // MÉTODOS PARA SUPER_ADMIN
  // ==========================================
  
  // Obtener todos los usuarios con detalles de farmacia
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.users.findMany({
        include: {
          pharmacy: {
            select: { id: true, name: true, license: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
      
      // Ocultar contraseñas
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json({ success: true, data: safeUsers });
    } catch (error: any) {
      console.error('Error getting all users:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Obtener usuario por ID con detalles completos
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const user = await prisma.users.findUnique({
        where: { id: parseInt(id) },
        include: {
          pharmacy: {
            select: { id: true, name: true, license: true, address: true, phone: true }
          },
          sales: {
            take: 10,
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              sale_number: true,
              total: true,
              created_at: true
            }
          },
          employees: {
            include: {
              shift_assignments: {
                take: 5,
                orderBy: { date: 'desc' }
              }
            }
          }
        }
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      const { password, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (error: any) {
      console.error('Error getting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Crear usuario con farmacia asignada
  async createUser(req: Request, res: Response) {
    try {
      const { email, full_name, role, pharmacy_id, password } = req.body;
      
      // Validar que no exista
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'El email ya está registrado' 
        });
      }
      
      const hashedPassword = await bcrypt.hash(password || 'usuario123', 10);
      
      const user = await prisma.users.create({
        data: {
          email,
          full_name,
          role,
          pharmacy_id: role === 'SUPER_ADMIN' ? null : pharmacy_id,
          password: hashedPassword,
          is_active: true
        }
      });
      
      const { password: _, ...safeUser } = user;
      res.status(201).json({ success: true, data: safeUser });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Actualizar usuario (versión SUPER_ADMIN)
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, full_name, role, pharmacy_id, is_active } = req.body;
      
      // Verificar que el usuario existe
      const existingUser = await prisma.users.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      // No permitir cambiar el rol de un SUPER_ADMIN si es el único
      if (existingUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
        const superAdminCount = await prisma.users.count({
          where: { role: 'SUPER_ADMIN' }
        });
        
        if (superAdminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'No puedes cambiar el rol del último SUPER_ADMIN'
          });
        }
      }
      
      const user = await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          email,
          full_name,
          role,
          pharmacy_id: role === 'SUPER_ADMIN' ? null : pharmacy_id,
          is_active
        }
      });
      
      const { password, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Eliminar usuario (versión SUPER_ADMIN)
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Verificar que no sea el último SUPER_ADMIN
      const userToDelete = await prisma.users.findUnique({
        where: { id: parseInt(id) },
        select: { role: true }
      });
      
      if (!userToDelete) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      if (userToDelete.role === 'SUPER_ADMIN') {
        const superAdminCount = await prisma.users.count({
          where: { role: 'SUPER_ADMIN' }
        });
        
        if (superAdminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'No puedes eliminar el último SUPER_ADMIN'
          });
        }
      }
      
      // Verificar si tiene relaciones que impidan eliminar
      const salesCount = await prisma.sales.count({
        where: { user_id: parseInt(id) }
      });
      
      if (salesCount > 0) {
        // En lugar de eliminar, desactivar
        await prisma.users.update({
          where: { id: parseInt(id) },
          data: { is_active: false }
        });
        
        return res.json({ 
          success: true, 
          message: 'Usuario desactivado porque tiene ventas asociadas' 
        });
      }
      
      await prisma.users.delete({
        where: { id: parseInt(id) }
      });
      
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Obtener estadísticas de usuarios por farmacia
  async getUserStats(req: Request, res: Response) {
    try {
      const stats = await prisma.users.groupBy({
        by: ['role', 'pharmacy_id'],
        _count: {
          id: true
        },
        where: {
          is_active: true
        }
      });
      
      // Obtener nombres de farmacias
      const pharmacies = await prisma.pharmacy.findMany({
        select: { id: true, name: true }
      });
      
      const pharmacyMap = new Map(pharmacies.map(p => [p.id, p.name]));
      
      const enrichedStats = stats.map(stat => ({
        role: stat.role,
        pharmacy_id: stat.pharmacy_id,
        pharmacy_name: stat.pharmacy_id ? pharmacyMap.get(stat.pharmacy_id) : 'Global',
        count: stat._count.id
      }));
      
      res.json({ success: true, data: enrichedStats });
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const userController = new UserController();