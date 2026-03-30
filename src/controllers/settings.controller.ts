import { Response } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/rbac';
import bcrypt from 'bcrypt';

export const settingsController = {
  // Obtener perfil del usuario
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user?.id },
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
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Actualizar perfil
  updateProfile: async (req: AuthRequest, res: Response) => {
    try {
      const { full_name, email } = req.body;
      
      const user = await prisma.users.update({
        where: { id: req.user?.id },
        data: { full_name, email },
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
  },
  
  // Cambiar contraseña
  changePassword: async (req: AuthRequest, res: Response) => {
    try {
      const { current_password, new_password } = req.body;
      
      const user = await prisma.users.findUnique({
        where: { id: req.user?.id }
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      
      const isValid = await bcrypt.compare(current_password, user.password || 
'');
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
      
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      await prisma.users.update({
        where: { id: req.user?.id },
        data: { password: hashedPassword }
      });
      
      res.json({ success: true, message: 'Contraseña actualizada correctamente' 
});
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener configuración de farmacia
  getPharmacySettings: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }
      
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacyId }
      });
      
      res.json({ success: true, data: pharmacy });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Actualizar configuración de farmacia
  updatePharmacySettings: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      const { name, address, phone, email } = req.body;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }
      
      const pharmacy = await prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: { name, address, phone, email }
      });
      
      res.json({ success: true, data: pharmacy });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener configuración de lealtad
  getLoyaltySettings: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }
      
      const config = await prisma.loyalty_config.findFirst({
        where: { pharmacy_id: pharmacyId }
      });
      
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Actualizar configuración de lealtad
  updateLoyaltySettings: async (req: AuthRequest, res: Response) => {
    try {
      const pharmacyId = req.user?.pharmacyId;
      const { points_per_unit, currency_unit, min_purchase_for_points, 
points_expiry_days, welcome_points, birthday_multiplier, 
first_purchase_multiplier } = req.body;
      
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }
      
      const existing = await prisma.loyalty_config.findFirst({
        where: { pharmacy_id: pharmacyId }
      });
      
      let config;
      if (existing) {
        config = await prisma.loyalty_config.update({
          where: { id: existing.id },
          data: {
            points_per_unit,
            currency_unit,
            min_purchase_for_points,
            points_expiry_days,
            welcome_points,
            birthday_multiplier,
            first_purchase_multiplier
          }
        });
      } else {
        config = await prisma.loyalty_config.create({
          data: {
            pharmacy_id: pharmacyId,
            points_per_unit,
            currency_unit,
            min_purchase_for_points,
            points_expiry_days,
            welcome_points,
            birthday_multiplier,
            first_purchase_multiplier,
            is_active: true
          }
        });
      }
      
      res.json({ success: true, data: config });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

