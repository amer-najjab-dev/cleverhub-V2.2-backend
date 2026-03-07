import { Request, Response } from 'express';
import { ventaService } from '../services/venta/venta.service';
import { CreateSaleDTO } from '../dtos/sale.dto';

export class VentaController {
  async crear(req: Request, res: Response) {
    console.log('Payload recibido:', JSON.stringify(req.body, null, 2));
    try {
      const { userId, clientId, paymentMethod, items } = req.body;
      if (!userId || !items) {
        return res.status(400).json({ error: 'Faltan datos: userId, items' });
      }
      const saleData = new CreateSaleDTO(req.body);
      
      // YA NO PASAMOS REGIÓN - El frontend ya calcula el IVA
      const venta = await ventaService.crearVenta(saleData);
      
      res.status(201).json(venta);
    } catch (error: any) {
      console.error('Error detallado:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const venta = await ventaService.getVentaPorId(id);
      if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
      res.json(venta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        saleStatus: req.query.saleStatus as string,
        paymentStatus: req.query.paymentStatus as string,
        paymentMethod: req.query.paymentMethod as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      
      // Obtener ventas con relaciones de cliente y usuario
      const ventas = await ventaService.getVentas(filters);
      
      // Devolver en el formato esperado por el frontend
      res.json({
        success: true,
        data: ventas
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

export const saleController = new VentaController();