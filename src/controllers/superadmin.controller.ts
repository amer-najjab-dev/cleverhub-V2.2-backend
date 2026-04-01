// src/controllers/superadmin.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';
import { addDays, differenceInDays, isBefore, isAfter } from 'date-fns';

// Función auxiliar para logging de acciones de administrador
const logAdminAction = async (adminId: number, action: any, targetType: string, targetId: number, details: any) => {
  try {
    await prisma.adminLog.create({
      data: {
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      }
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

export class SuperAdminController {
  
  // ==========================================
  // GESTIÓN DE SUSCRIPCIONES
  // ==========================================
  
  // Obtener todas las suscripciones con filtros
  async getSubscriptions(req: Request, res: Response) {
    try {
      const { status, plan, search } = req.query;
      
      const where: any = {};
      if (status) where.status = status;
      if (plan) where.plan = plan;
      if (search) {
        where.pharmacy = {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { license: { contains: search as string, mode: 'insensitive' } }
          ]
        };
      }
      
      const subscriptions = await prisma.subscription.findMany({
        where,
        include: {
          pharmacy: {
            select: { id: true, name: true, license: true, email: true, phone: true }
          },
          payments: {
            take: 1,
            orderBy: { created_at: 'desc' }
          }
        },
        orderBy: { end_date: 'asc' }
      });
      
      res.json({ success: true, data: subscriptions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Obtener suscripción de una farmacia específica
  async getPharmacySubscription(req: Request, res: Response) {
    try {
      const { pharmacyId } = req.params;
      
      const subscription = await prisma.subscription.findUnique({
        where: { pharmacy_id: parseInt(pharmacyId) },
        include: {
          pharmacy: true,
          payments: { orderBy: { created_at: 'desc' } }
        }
      });
      
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
      }
      
      res.json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Crear o actualizar suscripción (inicial)
  async createSubscription(req: Request, res: Response) {
    try {
      const { pharmacy_id, plan, trial_days = 30 } = req.body;
      
      // Verificar que la farmacia existe
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacy_id }
      });
      
      if (!pharmacy) {
        return res.status(404).json({ success: false, message: 'Farmacia no encontrada' });
      }
      
      const startDate = new Date();
      const endDate = addDays(startDate, trial_days);
      
      const subscription = await prisma.subscription.upsert({
        where: { pharmacy_id },
        update: {
          plan,
          start_date: startDate,
          end_date: endDate,
          status: 'TRIAL',
          trial_end_date: endDate
        },
        create: {
          pharmacy_id,
          plan,
          start_date: startDate,
          end_date: endDate,
          status: 'TRIAL',
          trial_end_date: endDate
        }
      });
      
      // Registrar en log
      await logAdminAction(
        (req as any).user?.id,
        'UPDATE_SUBSCRIPTION',
        'subscription',
        subscription.id,
        { action: 'create', plan, trial_days }
      );
      
      res.status(201).json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Renovar licencia (basado en pago)
  async renewLicense(req: Request, res: Response) {
    try {
      const { pharmacyId, months = 12, amount, paymentMethod, transactionId } = req.body;
      
      const subscription = await prisma.subscription.findUnique({
        where: { pharmacy_id: pharmacyId }
      });
      
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
      }
      
      // Calcular nueva fecha de expiración
      const currentEndDate = subscription.end_date;
      const newEndDate = isBefore(currentEndDate, new Date())
        ? addDays(new Date(), months * 30)
        : addDays(currentEndDate, months * 30);
      
      // Actualizar suscripción
      const updated = await prisma.subscription.update({
        where: { pharmacy_id: pharmacyId },
        data: {
          end_date: newEndDate,
          next_billing_date: addDays(newEndDate, months * 30),
          status: 'ACTIVE',
          updated_at: new Date()
        }
      });
      
      // Registrar pago
      const payment = await prisma.paymentLog.create({
        data: {
          subscription_id: subscription.id,
          amount,
          payment_method: paymentMethod,
          status: 'COMPLETED',
          transaction_id: transactionId,
          paid_at: new Date()
        }
      });
      
      // Registrar en log
      await logAdminAction(
        (req as any).user?.id,
        'RENEW_LICENSE',
        'subscription',
        subscription.id,
        { months, amount, new_end_date: newEndDate }
      );
      
      res.json({ success: true, data: { subscription: updated, payment } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Extender cortesía (7 días manual)
  async extendCourtesy(req: Request, res: Response) {
    try {
      const { pharmacyId, days = 7, reason } = req.body;
      
      const subscription = await prisma.subscription.findUnique({
        where: { pharmacy_id: pharmacyId }
      });
      
      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
      }
      
      const newEndDate = addDays(subscription.end_date, days);
      
      const updated = await prisma.subscription.update({
        where: { pharmacy_id: pharmacyId },
        data: {
          end_date: newEndDate,
          status: subscription.status === 'SUSPENDED' ? 'GRACE_PERIOD' : subscription.status,
          updated_at: new Date()
        }
      });
      
      // Registrar en log
      await logAdminAction(
        (req as any).user?.id,
        'EXTEND_COURTESY',
        'subscription',
        subscription.id,
        { days, reason, new_end_date: newEndDate }
      );
      
      // Crear notificación para la farmacia
      await prisma.systemNotification.create({
        data: {
          target: 'SPECIFIC_PHARMACY',
          pharmacy_id: pharmacyId,
          title: 'Extensión de cortesía',
          message: `Se ha extendido tu licencia por ${days} días como cortesía. Nueva fecha de expiración: 
${newEndDate.toLocaleDateString()}`,
          action_url: '/dashboard/subscription',
          created_by: (req as any).user?.id
        }
      });
      
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // Check expirations (para cron job)
  async checkExpirations() {
    const today = new Date();
    const days30 = addDays(today, 30);
    const days7 = addDays(today, 7);
    
    // Suscripciones que expiran en 30 días
    const expiring30 = await prisma.subscription.findMany({
      where: {
        end_date: { lte: days30, gt: days7 },
        status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
      },
      include: { pharmacy: true }
    });
    
    // Suscripciones que expiran en 7 días
    const expiring7 = await prisma.subscription.findMany({
      where: {
        end_date: { lte: days7, gt: today },
        status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
      },
      include: { pharmacy: true }
    });
    
    // Suscripciones expiradas
    const expired = await prisma.subscription.findMany({
      where: {
        end_date: { lt: today },
        status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
      },
      include: { pharmacy: true }
    });
    
    // Enviar recordatorios por email (30 días)
    for (const sub of expiring30) {
      // TODO: Implementar envío de email
      if (sub.pharmacy) {
        console.log(`📧 Recordatorio: ${sub.pharmacy.email} - Licencia expira en 30 días`);
      }
    }
    
    // Crear notificaciones críticas (7 días)
    for (const sub of expiring7) {
      await prisma.systemNotification.create({
        data: {
          target: 'SPECIFIC_PHARMACY',
          pharmacy_id: sub.pharmacy_id,
          title: '⚠️ Tu licencia expira pronto',
          message: `Tu licencia expirará el ${sub.end_date.toLocaleDateString()}. Renueva ahora para evitar 
interrupciones.`,
          action_url: '/dashboard/subscription/renew',
          created_by: 1 // SUPER_ADMIN ID
        }
      });
    }
    
    // Suspender expiradas
    for (const sub of expired) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'SUSPENDED' }
      });
      
      // Notificar suspensión
      await prisma.systemNotification.create({
        data: {
          target: 'SPECIFIC_PHARMACY',
          pharmacy_id: sub.pharmacy_id,
          title: '❌ Licencia suspendida',
          message: 'Tu licencia ha expirado. Contacta al administrador para reactivar tu cuenta.',
          action_url: '/dashboard/subscription/renew',
          created_by: 1
        }
      });
    }
    
    return { expiring30: expiring30.length, expiring7: expiring7.length, expired: expired.length };
  }
  
  // ==========================================
  // CENTRO DE COMUNICACIÓN
  // ==========================================
  
  // Broadcast masivo
  async sendBroadcast(req: Request, res: Response) {
    try {
      const { target, title, message, action_url, filters } = req.body;
      const adminId = (req as any).user?.id;
      
      let pharmacies: any[] = [];
      
      // Filtrar farmacias según target
      switch (target) {
        case 'ALL':
          pharmacies = await prisma.pharmacy.findMany({
            where: { is_active: true }
          });
          break;
        case 'ACTIVE':
          pharmacies = await prisma.pharmacy.findMany({
            where: {
              is_active: true,
              subscription: { status: 'ACTIVE' }
            },
            include: { subscription: true }
          });
          break;
        case 'GRACE_PERIOD':
          pharmacies = await prisma.pharmacy.findMany({
            where: {
              subscription: { status: 'GRACE_PERIOD' }
            },
            include: { subscription: true }
          });
          break;
        case 'SUSPENDED':
          pharmacies = await prisma.pharmacy.findMany({
            where: {
              subscription: { status: 'SUSPENDED' }
            },
            include: { subscription: true }
          });
          break;
        case 'SPECIFIC_PHARMACY':
          if (filters?.pharmacy_ids) {
            pharmacies = await prisma.pharmacy.findMany({
              where: { id: { in: filters.pharmacy_ids } }
            });
          }
          break;
      }
      
      // Crear notificación para cada farmacia o una global
      if (target === 'ALL') {
        // Notificación global
        await prisma.systemNotification.create({
          data: {
            target: 'ALL',
            title,
            message,
            action_url,
            created_by: adminId
          }
        });
      } else {
        // Notificaciones individuales
        for (const pharmacy of pharmacies) {
          await prisma.systemNotification.create({
            data: {
              target: 'SPECIFIC_PHARMACY',
              pharmacy_id: pharmacy.id,
              title,
              message,
              action_url,
              created_by: adminId
            }
          });
        }
      }
      
      // Enviar emails si se solicita
      if (filters?.sendEmail) {
        for (const pharmacy of pharmacies) {
          // TODO: Implementar envío de email
          console.log(`📧 Email a ${pharmacy.email}: ${title}`);
        }
      }
      
      // Registrar en log
      await logAdminAction(
        adminId,
        'SEND_BROADCAST',
        'notification',
        0,
        { target, title, recipients: pharmacies.length }
      );
      
      res.json({ 
        success: true, 
        message: `Broadcast enviado a ${pharmacies.length} farmacias`,
        data: { recipients: pharmacies.length }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // ==========================================
  // HEALTH CHECK (SEMÁFORO)
  // ==========================================
  
  async getHealthStatus(req: Request, res: Response) {
    try {
      const today = new Date();
      const weekAgo = addDays(today, -7);
      const days10 = addDays(today, 10);
      
      const allPharmacies = await prisma.pharmacy.findMany({
        include: {
          subscription: true,
          _count: {
            select: { sales: true }
          }
        }
      });
      
      const status = {
        green: [] as any[],   // Activa + ventas recientes
        yellow: [] as any[],  // Vence < 10 días o sin ventas en 1 semana
        red: [] as any[]      // Suspendida o sin actividad total
      };
      
      for (const pharmacy of allPharmacies) {
        const subscription = pharmacy.subscription;
        const hasRecentSales = pharmacy._count.sales > 0;
        const expiringSoon = subscription?.end_date && isBefore(subscription.end_date, days10);
        const isSuspended = subscription?.status === 'SUSPENDED';
        
        if (isSuspended || (!hasRecentSales && pharmacy._count.sales === 0)) {
          status.red.push({
            id: pharmacy.id,
            name: pharmacy.name,
            license: pharmacy.license,
            status: isSuspended ? 'SUSPENDED' : 'INACTIVE',
            last_sale: null,
            subscription_end: subscription?.end_date
          });
        } else if (expiringSoon || !hasRecentSales) {
          status.yellow.push({
            id: pharmacy.id,
            name: pharmacy.name,
            license: pharmacy.license,
            status: expiringSoon ? 'EXPIRING_SOON' : 'NO_RECENT_SALES',
            subscription_end: subscription?.end_date,
            total_sales: pharmacy._count.sales
          });
        } else {
          status.green.push({
            id: pharmacy.id,
            name: pharmacy.name,
            license: pharmacy.license,
            status: 'ACTIVE',
            subscription_end: subscription?.end_date,
            total_sales: pharmacy._count.sales
          });
        }
      }
      
      res.json({
        success: true,
        data: {
          summary: {
            total: allPharmacies.length,
            green: status.green.length,
            yellow: status.yellow.length,
            red: status.red.length
          },
          status
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // ==========================================
  // IMPERSONATE (Shadow Login)
  // ==========================================
  
  async impersonate(req: Request, res: Response) {
    try {
      const { pharmacyId } = req.params;
      const adminId = (req as any).user?.id;
      
      // Verificar que la farmacia existe
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: parseInt(pharmacyId) }
      });
      
      if (!pharmacy) {
        return res.status(404).json({ success: false, message: 'Farmacia no encontrada' });
      }
      
      // Obtener un usuario ADMIN de la farmacia para tomar sus permisos
      const targetUser = await prisma.users.findFirst({
        where: {
          pharmacy_id: parseInt(pharmacyId),
          role: 'ADMIN'
        }
      });
      
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'No se encontró un administrador en esta farmacia' });
      }
      
      // Generar JWT temporal con 1 hora de validez
      const jwt = require('jsonwebtoken');
      const impersonateToken = jwt.sign(
        {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
          pharmacyId: targetUser.pharmacy_id,
          impersonated_by: adminId,
          impersonated_at: new Date().toISOString()
        },
        process.env.JWT_SECRET || 'cleverhub-secret-key-2026',
        { expiresIn: '1h' }
      );
      
      // Registrar en log de auditoría
      await logAdminAction(
        adminId,
        'IMPERSONATE',
        'pharmacy',
        parseInt(pharmacyId),
        { target_user: targetUser.email, pharmacy_name: pharmacy.name }
      );
      
      res.json({
        success: true,
        data: {
          token: impersonateToken,
          pharmacy: {
            id: pharmacy.id,
            name: pharmacy.name,
            license: pharmacy.license
          },
          expires_in: '1 hour',
          message: `Sesión iniciada como ${targetUser.email} en ${pharmacy.name}`
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const superAdminController = new SuperAdminController();