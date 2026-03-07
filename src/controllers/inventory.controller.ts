import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { InventoryLot } from '../entities/InventoryLot';
import { StockMovement } from '../entities/StockMovement';
import { LessThan, MoreThan, Between } from 'typeorm';

export class InventoryController {
  /**
   * Obtener todos los productos con información de stock
   * GET /api/inventory
   */
  async getInventory(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const category = (req.query.category as string) || '';
      const zone = (req.query.zone as string) || '';
      const lab = (req.query.lab as string) || '';
      
      const skip = (page - 1) * limit;
      
      const productRepo = AppDataSource.getRepository(Product);
      
      // Construir query con filtros
      let queryBuilder = productRepo.createQueryBuilder('product')
        .where('product.active = :active', { active: true });
      
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.barcode) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
          { search: `%${search}%` }
        );
      }
      
      if (category) {
        queryBuilder = queryBuilder.andWhere('product.category = :category', { category });
      }
      
      if (zone) {
        queryBuilder = queryBuilder.andWhere('product.zone = :zone', { zone });
      }
      
      if (lab) {
        queryBuilder = queryBuilder.andWhere('product.laboratory = :lab', { lab });
      }
      
      // Obtener total de registros para la paginación
      const total = await queryBuilder.getCount();
      
      // Obtener productos paginados
      const products = await queryBuilder
        .orderBy('product.name', 'ASC')
        .skip(skip)
        .take(limit)
        .getMany();

      // Calcular stock disponible (asumiendo reservados = 0 por ahora)
      const inventory = products.map(product => ({
        id: product.id,
        name: product.name,
        dosage: product.dosageForm,
        stock: product.stock,
        reserved: 0,
        available: product.stock,
        ordered: 0,
        pricePPH: Number(product.pricePPH),
        pricePPV: Number(product.pricePPV),
        zone: product.zone || 'Sin zona',
        expiryDate: product.expirationDate || new Date().toISOString(),
        barcode1: product.barcode || '',
        barcode2: product.sku || '',
        laboratory: product.laboratory || '',
        category: product.category || ''
      }));

      res.json({
        success: true,
        data: inventory,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error: any) {
      console.error('Error en getInventory:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener un producto específico por ID
   * GET /api/inventory/products/:id
   */
  async getProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const productRepo = AppDataSource.getRepository(Product);
      
      const product = await productRepo.findOne({
        where: { id }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const inventoryItem = {
        id: product.id,
        name: product.name,
        dosage: product.dosageForm,
        stock: product.stock,
        reserved: 0,
        available: product.stock,
        ordered: 0,
        pricePPH: Number(product.pricePPH),
        pricePPV: Number(product.pricePPV),
        zone: product.zone || 'Sin zona',
        expiryDate: product.expirationDate || new Date().toISOString(),
        barcode1: product.barcode || '',
        barcode2: product.sku || '',
        laboratory: product.laboratory || '',
        category: product.category || ''
      };

      res.json({
        success: true,
        data: inventoryItem
      });

    } catch (error: any) {
      console.error('Error en getProduct:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener alertas de caducidad
   * GET /api/inventory/expiry-alerts?days=90
   */
  async getExpiryAlerts(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 90;
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const lotRepo = AppDataSource.getRepository(InventoryLot);
      
      const lots = await lotRepo.find({
        where: {
          expiryDate: Between(today, futureDate)
        },
        relations: ['product']
      });

      const alerts = lots.map(lot => {
        const daysRemaining = Math.ceil(
          (lot.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let status: 'critical' | 'warning' | 'normal' | 'expired';
        if (daysRemaining < 0) status = 'expired';
        else if (daysRemaining < 90) status = 'critical';
        else if (daysRemaining < 180) status = 'warning';
        else status = 'normal';

        return {
          id: lot.id,
          productId: lot.product.id,
          productName: lot.product.name,
          expiryDate: lot.expiryDate.toISOString(),
          daysRemaining,
          status,
          lotNumber: lot.batchNumber,
          quantity: lot.quantity
        };
      });

      res.json({
        success: true,
        data: alerts
      });

    } catch (error: any) {
      console.error('Error en getExpiryAlerts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener historial de movimientos de stock
   * GET /api/inventory/movements?productId=123
   */
  async getStockMovements(req: Request, res: Response) {
    try {
      const productId = req.query.productId ? parseInt(req.query.productId as string) : undefined;

      const movementRepo = AppDataSource.getRepository(StockMovement);
      
      const whereClause: any = {};
      if (productId) {
        whereClause.product = { id: productId };
      }

      const movements = await movementRepo.find({
        where: whereClause,
        relations: ['product'],
        order: { createdAt: 'DESC' },
        take: 100
      });

      const formattedMovements = movements.map(m => ({
        id: m.id,
        productId: m.product.id,
        productName: m.product.name,
        type: m.type,
        quantity: m.quantity,
        previousStock: 0, // Habría que calcularlo con el movimiento anterior
        newStock: m.stockAfter,
        reason: m.notes || 'Sin motivo',
        date: m.createdAt.toISOString()
        // userId eliminado porque no existe en la entidad
      }));

      res.json({
        success: true,
        data: formattedMovements
      });

    } catch (error: any) {
      console.error('Error en getStockMovements:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Ajustar stock de un producto
   * POST /api/inventory/adjust
   */
  async adjustStock(req: Request, res: Response) {
    try {
      const { productId, newStock, newOrdered, newExpiryDate, reason, notes } = 
req.body;

      const productRepo = AppDataSource.getRepository(Product);
      const movementRepo = AppDataSource.getRepository(StockMovement);
      const lotRepo = AppDataSource.getRepository(InventoryLot);

      const product = await productRepo.findOne({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const previousStock = product.stock;

      // Actualizar stock del producto
      product.stock = newStock;
      await productRepo.save(product);

      // Registrar movimiento
      const movement = new StockMovement();
      movement.product = product;
      movement.type = 'ajustement';
      movement.quantity = newStock - previousStock;
      movement.stockAfter = newStock;
      movement.notes = `${reason}: ${notes || ''}`;
      movement.createdAt = new Date();
      await movementRepo.save(movement);

      // Si se proporciona nueva fecha de caducidad, actualizar o crear lote
      if (newExpiryDate) {
        // Buscar lote existente o crear uno nuevo
        let lot = await lotRepo.findOne({
          where: {
            product: { id: productId },
            expiryDate: new Date(newExpiryDate)
          }
        });

        if (lot) {
          lot.quantity = newStock;
          await lotRepo.save(lot);
        } else {
          lot = new InventoryLot();
          lot.product = product;
          lot.batchNumber = `LOTE-${Date.now()}`;
          lot.expiryDate = new Date(newExpiryDate);
          lot.quantity = newStock;
          lot.createdAt = new Date();
          lot.updatedAt = new Date();
          await lotRepo.save(lot);
        }
      }

      const updatedProduct = {
        id: product.id,
        name: product.name,
        dosage: product.dosageForm,
        stock: product.stock,
        reserved: 0,
        available: product.stock,
        ordered: newOrdered || 0,
        pricePPH: Number(product.pricePPH),
        pricePPV: Number(product.pricePPV),
        zone: product.zone || 'Sin zona',
        expiryDate: newExpiryDate || product.expirationDate?.toISOString() || 
new Date().toISOString(),
        barcode1: product.barcode || '',
        barcode2: product.sku || '',
        laboratory: product.laboratory || '',
        category: product.category || ''
      };

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Stock ajustado correctamente'
      });

    } catch (error: any) {
      console.error('Error en adjustStock:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Obtener resumen del inventario
   * GET /api/inventory/summary
   */
  async getSummary(req: Request, res: Response) {
    try {
      const productRepo = AppDataSource.getRepository(Product);
      
      const products = await productRepo.find({
        where: { active: true }
      });

      const totalPPH = products.reduce((sum, p) => sum + Number(p.pricePPH) * 
p.stock, 0);
      const totalPPV = products.reduce((sum, p) => sum + Number(p.pricePPV) * 
p.stock, 0);
      
      const lowStockCount = products.filter(p => p.stock < 5).length;

      // Productos próximos a caducar (< 90 días)
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 90);

      const lotRepo = AppDataSource.getRepository(InventoryLot);
      const expiringLots = await lotRepo.find({
        where: {
          expiryDate: Between(today, futureDate)
        }
      });
      
      const expiringCount = expiringLots.length;

      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          totalStockValue: totalPPH,
          totalRetailValue: totalPPV,
          lowStockCount,
          expiringCount,
          expiredCount: 0 // Por implementar
        }
      });

    } catch (error: any) {
      console.error('Error en getSummary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Buscar producto por código de barras
   * GET /api/inventory/scan/:barcode
   */
  async scanBarcode(req: Request, res: Response) {
    try {
      const barcode = req.params.barcode;
      
      const productRepo = AppDataSource.getRepository(Product);
      
      const product = await productRepo.findOne({
        where: [
          { barcode },
          { sku: barcode }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const inventoryItem = {
        id: product.id,
        name: product.name,
        dosage: product.dosageForm,
        stock: product.stock,
        reserved: 0,
        available: product.stock,
        ordered: 0,
        pricePPH: Number(product.pricePPH),
        pricePPV: Number(product.pricePPV),
        zone: product.zone || 'Sin zona',
        expiryDate: product.expirationDate || new Date().toISOString(),
        barcode1: product.barcode || '',
        barcode2: product.sku || '',
        laboratory: product.laboratory || '',
        category: product.category || ''
      };

      res.json({
        success: true,
        data: inventoryItem
      });

    } catch (error: any) {
      console.error('Error en scanBarcode:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const inventoryController = new InventoryController();
