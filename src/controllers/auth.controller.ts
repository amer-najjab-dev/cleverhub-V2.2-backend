import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

export class AuthController {
  // Registro de usuario
  async register(req: Request, res: Response) {
    try {
      const { email, password, fullName, role = 'employee' } = req.body;

      // Validaciones básicas
      if (!email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son obligatorios'
        });
      }

      const userRepo = AppDataSource.getRepository(User);

      // Verificar si el usuario ya existe
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = userRepo.create({
        email,
        password: hashedPassword,
        fullName,
        role
      });

      await userRepo.save(user);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
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

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      
      // Buscar usuario por email
      const user = await userRepo.findOne({ where: { email } });
      
      // Verificar si el usuario existe
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Guardar datos en la sesión
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
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

  // Logout
  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    });
  }

  // Obtener usuario actual
  async me(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ 
        where: { id: req.session.userId }
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
          fullName: user.fullName,
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
