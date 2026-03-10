// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { prisma } from '../server';

export class UserController {
  
  async getAll(req: Request, res: Response) {
    try {
      const users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true
          // last_login ELIMINADO - no existe en el modelo
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.users.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
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
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { email, password, fullName, role = 'employee' } = req.body;

      const existingUser = await prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          full_name: fullName,
          role,
          is_active: true
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true
        }
      });

      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, fullName, role, isActive } = req.body;

      const user = await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          email,
          full_name: fullName,
          role,
          is_active: isActive
        },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true
        }
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.users.delete({ where: { id: parseInt(id) } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { fullName, email } = req.body;

      const user = await prisma.users.update({
        where: { id: userId },
        data: { full_name: fullName, email },
        select: { id: true, email: true, full_name: true, role: true }
      });

      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const userController = new UserController();