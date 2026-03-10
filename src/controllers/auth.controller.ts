// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../server';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, fullName, role = 'employee' } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son obligatorios'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await prisma.users.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario - USANDO LOS NOMBRES DE COLUMNA DEL SCHEMA (snake_case)
      const user = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          full_name: fullName,  // ¡CORREGIDO! full_name en lugar de fullName
          role,
          is_active: true        // ¡CORREGIDO! is_active en lugar de isActive
        },
        select: {
          id: true,
          email: true,
          full_name: true,      // ¡CORREGIDO!
          role: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,  // Mapear a camelCase para la respuesta
          role: user.role
        }
      });

    } catch (error: any) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      const user = await prisma.users.findUnique({
        where: { email }
      });
      
      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Guardar en sesión
      req.session.userId = user.id;
      req.session.userRole = user.role || undefined;
      req.session.userEmail = user.email;

      // Guardar sesión explícitamente
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,  // Mapear a camelCase
          role: user.role
        }
      });

    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión'
        });
      }
      
      res.clearCookie('cleverhub.sid');
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    });
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const user = await prisma.users.findUnique({
        where: { id: req.session.userId },
        select: {
          id: true,
          email: true,
          full_name: true,  // ¡CORREGIDO!
          role: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,  // Mapear a camelCase
          role: user.role
        }
      });

    } catch (error: any) {
      console.error('Error en me:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const authController = new AuthController();