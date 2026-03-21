import { Request, Response } from 'express';
import { prisma } from '../server';

// Definir tipos para los parámetros de reduce
type GlucoseValue = number;
type SystolicValue = number;
type DiastolicValue = number;
type WeightValue = number;
type HeartRateValue = number;

export class ClientController {
  
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (search) {
        where.OR = [
          { first_name: { contains: search as string, mode: 'insensitive' } },
          { last_name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [clients, total] = await Promise.all([
        prisma.clients.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { created_at: 'desc' },
          include: {
            sales: {
              orderBy: { created_at: 'desc' },
              take: 1,
              select: {
                created_at: true
              }
            },
            client_debts: {  // ← CORREGIDO: plural
              where: {
                pending_amount: { gt: 0 }
              },
              select: {
                pending_amount: true
              }
            }
          }
        }),
        prisma.clients.count({ where }),
      ]);

      // Tipado correcto para el reduce
      const clientsWithDetails = clients.map((client: any) => ({
        ...client,
        last_purchase_date: client.sales?.[0]?.created_at || null,
        total_debt: client.client_debts?.reduce(
          (sum: number, debt: any) => sum + Number(debt.pending_amount), 
          0
        ) || 0,
        sales: undefined,
        client_debts: undefined
      }));

      res.json({
        success: true,
        data: clientsWithDetails,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('Error getting clients:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const client = await prisma.clients.findUnique({
        where: { id: Number(id) },
        include: {
          sales: {
            take: 10,
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      res.json({
        success: true,
        data: client,
      });
    } catch (error: any) {
      console.error('Error getting client:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { firstName, lastName, phone, email, dni, ...rest } = req.body;
      
      // Mapear camelCase a snake_case
      const clientData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        dni,
        ...rest
      };

      const client = await prisma.clients.create({
        data: clientData,
      });

      res.json({
        success: true,
        data: client,
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, email, dni, ...rest } = req.body;
      
      // Mapear camelCase a snake_case
      const clientData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        dni,
        ...rest
      };
      
      const client = await prisma.clients.update({
        where: { id: Number(id) },
        data: clientData,
      });

      res.json({
        success: true,
        data: client,
      });
    } catch (error: any) {
      console.error('Error updating client:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await prisma.clients.delete({
        where: { id: Number(id) },
      });

      res.json({
        success: true,
        message: 'Client supprimé',
      });
    } catch (error: any) {
      console.error('Error deleting client:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getLoyaltyPoints(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const client = await prisma.clients.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          loyalty_points: true,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé',
        });
      }

      res.json({
        success: true,
        data: {
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          points: client.loyalty_points || 0,
        },
      });
    } catch (error: any) {
      console.error('Error getting loyalty points:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getDebts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const debts = await prisma.client_debt.findMany({
        where: { client_id: Number(id) },
        orderBy: { created_at: 'desc' },
      });

      res.json({
        success: true,
        data: debts,
      });
    } catch (error: any) {
      console.error('Error getting client debts:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getClientPurchases(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      
      const purchases = await prisma.sales.findMany({
        where: { client_id: clientId },
        include: {
          sale_items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({
        success: true,
        data: purchases
      });
    } catch (error: any) {
      console.error('Error getting client purchases:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ========== HEALTH RECORDS ==========

  async getHealthRecords(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      
      const records = await prisma.health_records.findMany({
        where: { client_id: clientId },
        orderBy: { record_date: 'desc' }
      });

      res.json({
        success: true,
        data: records
      });
    } catch (error: any) {
      console.error('Error getting health records:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createHealthRecord(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      const {
        glucoseLevel,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        weight,
        heartRate,
        recordDate,
        notes
      } = req.body;

      // Calcular estados
      let glucoseStatus: string | undefined;
      if (glucoseLevel) {
        if (glucoseLevel < 0.7) glucoseStatus = 'baja';
        else if (glucoseLevel > 1.1) glucoseStatus = 'alta';
        else glucoseStatus = 'normal';
      }

      let bloodPressureStatus: string | undefined;
      if (bloodPressureSystolic && bloodPressureDiastolic) {
        if (bloodPressureSystolic < 9 && bloodPressureDiastolic < 6) bloodPressureStatus = 'baja';
        else if (bloodPressureSystolic > 14 || bloodPressureDiastolic > 9) bloodPressureStatus = 'alta';
        else if (bloodPressureSystolic <= 12 && bloodPressureDiastolic <= 8) bloodPressureStatus = 'ideal';
        else bloodPressureStatus = 'normal';
      }

      let heartRateStatus: string | undefined;
      if (heartRate) {
        if (heartRate < 60) heartRateStatus = 'baja';
        else if (heartRate > 100) heartRateStatus = 'alta';
        else heartRateStatus = 'normal';
      }

      const record = await prisma.health_records.create({
        data: {
          client_id: clientId,
          glucose_level: glucoseLevel,
          blood_pressure_systolic: bloodPressureSystolic,
          blood_pressure_diastolic: bloodPressureDiastolic,
          weight,
          heart_rate: heartRate,
          record_date: recordDate ? new Date(recordDate) : new Date(),
          notes,
          glucose_status: glucoseStatus,
          blood_pressure_status: bloodPressureStatus,
          heart_rate_status: heartRateStatus
        }
      });

      res.json({
        success: true,
        data: record
      });
    } catch (error: any) {
      console.error('Error creating health record:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getHealthStats(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      
      const records = await prisma.health_records.findMany({
        where: { client_id: clientId },
        orderBy: { record_date: 'desc' }
      });

      if (records.length === 0) {
        return res.json({
          success: true,
          data: {
            totalRecords: 0,
            lastRecord: null,
            glucose: { average: null, lastValue: null, trend: 'stable' },
            bloodPressure: { systolicAverage: null, diastolicAverage: null, lastValues: null },
            weight: { average: null, lastValue: null, trend: 'stable' },
            heartRate: { average: null, lastValue: null, trend: 'stable' }
          }
        });
      }

      // Calcular estadísticas con tipos explícitos
      const glucoseValues: GlucoseValue[] = records
        .filter((r: any) => r.glucose_level)
        .map((r: any) => Number(r.glucose_level));
      
      const systolicValues: SystolicValue[] = records
        .filter((r: any) => r.blood_pressure_systolic)
        .map((r: any) => r.blood_pressure_systolic);
      
      const diastolicValues: DiastolicValue[] = records
        .filter((r: any) => r.blood_pressure_diastolic)
        .map((r: any) => r.blood_pressure_diastolic);
      
      const weightValues: WeightValue[] = records
        .filter((r: any) => r.weight)
        .map((r: any) => Number(r.weight));
      
      const heartRateValues: HeartRateValue[] = records
        .filter((r: any) => r.heart_rate)
        .map((r: any) => r.heart_rate);

      // Función para calcular promedio con tipado explícito
      const calculateAverage = (values: number[]): number | null => {
        if (values.length === 0) return null;
        return values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
      };

      // Función para calcular tendencia con tipado explícito
      const calculateTrend = (values: number[]): 'up' | 'down' | 'stable' => {
        if (values.length < 2) return 'stable';
        if (values[0] > values[1]) return 'up';
        if (values[0] < values[1]) return 'down';
        return 'stable';
      };

      const stats = {
        totalRecords: records.length,
        lastRecord: records[0],
        glucose: {
          average: calculateAverage(glucoseValues),
          lastValue: glucoseValues[0] || null,
          trend: calculateTrend(glucoseValues)
        },
        bloodPressure: {
          systolicAverage: calculateAverage(systolicValues),
          diastolicAverage: calculateAverage(diastolicValues),
          lastValues: records[0] ? {
            systolic: records[0].blood_pressure_systolic,
            diastolic: records[0].blood_pressure_diastolic
          } : null
        },
        weight: {
          average: calculateAverage(weightValues),
          lastValue: weightValues[0] || null,
          trend: calculateTrend(weightValues)
        },
        heartRate: {
          average: calculateAverage(heartRateValues),
          lastValue: heartRateValues[0] || null,
          trend: calculateTrend(heartRateValues)
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting health stats:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  async registerDebtPayment(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      const { amount, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      // Obtener deuda activa
      const activeDebt = await prisma.client_debt.findFirst({
        where: {
          client_id: clientId,
          pending_amount: { gt: 0 }
        },
        orderBy: { created_at: 'desc' }
      });

      if (!activeDebt) {
        return res.status(404).json({ error: 'No hay deuda pendiente' });
      }

      const currentPaid = Number(activeDebt.paid_amount);
      const currentTotal = Number(activeDebt.total_debt);
      const newPaidAmount = currentPaid + amount;

      // Actualizar SOLO paid_amount, pending_amount se calculará automáticamente
      const updatedDebt = await prisma.client_debt.update({
        where: { id: activeDebt.id },
        data: {
          paid_amount: newPaidAmount,
          status: newPaidAmount >= currentTotal ? 'paid' : 'partial',
          updated_at: new Date(),
          last_payment_date: new Date(),
          notes: notes ? `${activeDebt.notes || ''}\n${notes}`.trim() : activeDebt.notes
        }
      });

      res.json({
        success: true,
        message: 'Pago registrado correctamente',
        data: updatedDebt
      });
    } catch (error: any) {
      console.error('Error registering payment:', error);
      res.status(500).json({ error: error.message || 'Error al registrar el pago' });
    }
  }

  async get_pending_amount(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      
      const activeDebt = await prisma.client_debt.findFirst({
        where: {
          client_id: clientId,
          pending_amount: { gt: 0 }
        },
        orderBy: { created_at: 'desc' }
      });

      const pendingAmount = activeDebt ? Number(activeDebt.pending_amount) : 0;

      res.json({
        success: true,
        data: {
          clientId,
          pendingAmount
        }
      });
    } catch (error: any) {
      console.error('Error getting pending amount:', error);
      res.status(500).json({ error: error.message || 'Error al obtener el monto pendiente' });
    }
  }

  async getPendingAmount(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      
      const activeDebt = await prisma.client_debt.findFirst({
        where: {
          client_id: clientId,
          pending_amount: { gt: 0 }
        },
        orderBy: { created_at: 'desc' }
      });

      const pendingAmount = activeDebt ? Number(activeDebt.pending_amount) : 0;

      res.json({
        success: true,
        data: {
          clientId,
          pendingAmount
        }
      });
    } catch (error: any) {
      console.error('Error getting pending amount:', error);
      res.status(500).json({ error: error.message || 'Error al obtener el monto pendiente' });
    }
  }
}

export const clientController = new ClientController();