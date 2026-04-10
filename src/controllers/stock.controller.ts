// src/controllers/stock.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
  pharmacyFilter?: {
    pharmacy_id?: number;
  };
}

export const stockController = {
  // Obtener todos los productos con stock
  async getAll(req: AuthRequest, res: Response) {
    try {
      const pharmacyFilter = req.pharmacyFilter || {};
      const { search, category, zone, lab, page = 1, limit = 10 } = req.query;
      
      // Construir filtro para productos
      const productFilter: any = {};
      if (search) {
        productFilter.name = { contains: search as string, mode: 'insensitive' };
      }
      if (category) {
        productFilter.category = category as string;
      }
      if (zone) {
        productFilter.zone = zone as string;
      }
      if (lab) {
        productFilter.laboratory = lab as string;
      }
      
      const products = await prisma.inventory_lots.findMany({
        where: pharmacyFilter,
        include: {
          product: {
            where: productFilter,
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              pricePPV: true,
              pricePPH: true,
              dosageForm: true,
              laboratory: true,
              zone: true,
              barcode: true
            }
          }
        },
        orderBy: {
          expiry_date: 'asc'
        }
      });
      
      // Filtrar lotes que tienen producto (después de aplicar filtro)
      const filteredProducts = products.filter(p => p.product !== null);
      
      // Agrupar por producto
      const groupedProducts = filteredProducts.reduce((acc: any, lot) => {
        const productId = lot.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product: lot.product,
            total_quantity: 0,
            lots: []
          };
        }
        acc[productId].total_quantity += lot.quantity;
        acc[productId].lots.push({
          id: lot.id,
          batch_number: lot.batch_number,
          expiry_date: lot.expiry_date,
          quantity: lot.quantity
        });
        return acc;
      }, {});
      
      // Convertir a array y paginar
      let resultArray = Object.values(groupedProducts);
      const total = resultArray.length;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginatedResults = resultArray.slice(start, end);
      
      res.json({
        success: true,
        data: paginatedResults,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Error getting stock:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener productos con stock bajo
  async getLowStock(req: AuthRequest, res: Response) {
    try {
      const pharmacyFilter = req.pharmacyFilter || {};
      const threshold = Number(req.query.threshold) || 10;
      
      const lowStockLots = await prisma.inventory_lots.findMany({
        where: {
          ...pharmacyFilter,
          quantity: { lt: threshold },
          expiry_date: { gt: new Date() }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true
            }
          }
        },
        orderBy: {
          quantity: 'asc'
        }
      });
      
      // Agrupar por producto
      const groupedLowStock = lowStockLots.reduce((acc: any, lot) => {
        const productId = lot.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product: lot.product,
            total_quantity: 0,
            lots: []
          };
        }
        acc[productId].total_quantity += lot.quantity;
        acc[productId].lots.push({
          id: lot.id,
          batch_number: lot.batch_number,
          expiry_date: lot.expiry_date,
          quantity: lot.quantity
        });
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: Object.values(groupedLowStock)
      });
    } catch (error: any) {
      console.error('Error getting low stock:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener productos próximos a vencer
  async getExpiringProducts(req: AuthRequest, res: Response) {
    try {
      const pharmacyFilter = req.pharmacyFilter || {};
      const days = Number(req.query.days) || 30;
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + days);
      
      const expiringLots = await prisma.inventory_lots.findMany({
        where: {
          ...pharmacyFilter,
          expiry_date: {
            lte: expiryThreshold,
            gt: new Date()
          },
          quantity: { gt: 0 }
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true
            }
          }
        },
        orderBy: {
          expiry_date: 'asc'
        }
      });
      
      // Agrupar por producto
      const groupedExpiring = expiringLots.reduce((acc: any, lot) => {
        const productId = lot.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product: lot.product,
            total_quantity: 0,
            lots: []
          };
        }
        acc[productId].total_quantity += lot.quantity;
        acc[productId].lots.push({
          id: lot.id,
          batch_number: lot.batch_number,
          expiry_date: lot.expiry_date,
          quantity: lot.quantity,
          days_until_expiry: Math.ceil((lot.expiry_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        });
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: Object.values(groupedExpiring)
      });
    } catch (error: any) {
      console.error('Error getting expiring products:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener movimientos de stock
  async getMovements(req: AuthRequest, res: Response) {
    try {
      const pharmacyFilter = req.pharmacyFilter || {};
      const { limit = 100, offset = 0, productId, type } = req.query;
      
      const where: any = {
        ...pharmacyFilter
      };
      
      if (productId) {
        where.product_id = parseInt(productId as string);
      }
      
      if (type) {
        where.type = type;
      }
      
      const movements = await prisma.stock_movements.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          },
          lot: {
            select: {
              batch_number: true,
              expiry_date: true
            }
          },
          user: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: Number(limit),
        skip: Number(offset)
      });
      
      const total = await prisma.stock_movements.count({ where });
      
      res.json({
        success: true,
        data: movements,
        meta: {
          total,
          limit: Number(limit),
          offset: Number(offset)
        }
      });
    } catch (error: any) {
      console.error('Error getting movements:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Crear movimiento de stock
  async createMovement(req: AuthRequest, res: Response) {
    try {
      const { product_id, lot_id, type, quantity, notes } = req.body;
      const pharmacyFilter = req.pharmacyFilter || {};
      const userId = req.user?.id;
      
      if (!product_id || !type || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: product_id, type, quantity'
        });
      }
      
      // Verificar que el producto existe
      const product = await prisma.products.findUnique({
        where: { id: product_id }
      });
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      // Si es una salida, verificar stock disponible
      if (type === 'OUT' || type === 'sale') {
        const availableStock = await prisma.inventory_lots.aggregate({
          where: {
            product_id,
            ...pharmacyFilter,
            expiry_date: { gt: new Date() }
          },
          _sum: { quantity: true }
        });
        
        if ((availableStock._sum.quantity || 0) < quantity) {
          return res.status(400).json({
            success: false,
            message: 'Stock insuficiente'
          });
        }
      }
      
      // Obtener stock actual después del movimiento
      const currentStock = await prisma.inventory_lots.aggregate({
        where: {
          product_id,
          ...pharmacyFilter
        },
        _sum: { quantity: true }
      });
      
      const stockAfter = (currentStock._sum.quantity || 0) + (type === 'IN' || type === 'purchase' ? quantity : -quantity);
      
      // Crear movimiento
      const movement = await prisma.stock_movements.create({
        data: {
          product_id,
          pharmacy_id: pharmacyFilter.pharmacy_id!,
          lot_id: lot_id || null,
          type,
          quantity: Math.abs(quantity),
          stock_after: stockAfter,
          notes: notes || null,
          user_id: userId || null
        }
      });
      
      // Si es entrada, actualizar o crear lote
      if (type === 'IN' || type === 'purchase') {
        if (lot_id) {
          await prisma.inventory_lots.update({
            where: { id: lot_id },
            data: {
              quantity: {
                increment: quantity
              }
            }
          });
        } else {
          // Crear nuevo lote
          await prisma.inventory_lots.create({
            data: {
              product_id,
              pharmacy_id: pharmacyFilter.pharmacy_id!,
              batch_number: `BATCH-${Date.now()}`,
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              quantity
            }
          });
        }
      }
      
      res.status(201).json({
        success: true,
        data: movement
      });
    } catch (error: any) {
      console.error('Error creating movement:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Ajustar stock manualmente
  async adjustStock(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, reason } = req.body;
      const pharmacyFilter = req.pharmacyFilter || {};
      const userId = req.user?.id;
      
      const lot = await prisma.inventory_lots.findFirst({
        where: {
          id: parseInt(id),
          ...pharmacyFilter
        }
      });
      
      if (!lot) {
        return res.status(404).json({
          success: false,
          message: 'Lote no encontrado'
        });
      }
      
      const oldQuantity = lot.quantity;
      const newQuantity = quantity;
      const difference = newQuantity - oldQuantity;
      
      // Actualizar lote
      const updatedLot = await prisma.inventory_lots.update({
        where: { id: parseInt(id) },
        data: { quantity: newQuantity }
      });
      
      // Registrar movimiento
      await prisma.stock_movements.create({
        data: {
          product_id: lot.product_id,
          pharmacy_id: pharmacyFilter.pharmacy_id!,
          lot_id: lot.id,
          type: 'adjustment',
          quantity: Math.abs(difference),
          stock_after: newQuantity,
          notes: `Ajuste manual: ${reason || 'Sin motivo'}. Antes: ${oldQuantity}, Después: ${newQuantity}`,
          user_id: userId || null
        }
      });
      
      res.json({
        success: true,
        data: updatedLot,
        message: `Stock ajustado de ${oldQuantity} a ${newQuantity}`
      });
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Obtener stock por producto
  async getByProduct(req: AuthRequest, res: Response) {
    try {
      const { productId } = req.params;
      const pharmacyFilter = req.pharmacyFilter || {};
      
      const lots = await prisma.inventory_lots.findMany({
        where: {
          product_id: parseInt(productId),
          ...pharmacyFilter
        },
        orderBy: {
          expiry_date: 'asc'
        }
      });
      
      const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
      
      res.json({
        success: true,
        data: {
          product_id: parseInt(productId),
          total_quantity: totalQuantity,
          lots
        }
      });
    } catch (error: any) {
      console.error('Error getting product stock:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};