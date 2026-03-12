import { Request, Response } from 'express';
import { prisma } from '../server';

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
        }),
        prisma.clients.count({ where }),
      ]);

      res.json({
        success: true,
        data: clients,
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
      const client = await prisma.clients.create({
        data: req.body,
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
      
      const client = await prisma.clients.update({
        where: { id: Number(id) },
        data: req.body,
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
}

export const clientController = new ClientController();
