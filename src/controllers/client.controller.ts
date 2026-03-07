import { Request, Response } from 'express';
import { clienteService } from '../services/cliente/cliente.service';
import { ventaService } from '../services/venta/venta.service';
import { AppDataSource } from '../data-source';
import { ClientDebt } from '../entities/ClientDebt';

export class ClienteController {
  async listar(req: Request, res: Response) {
    try {
      const clientes = await clienteService.listarTodos();
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const cliente = await clienteService.obtenerPorId(id);
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(cliente);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async crear(req: Request, res: Response) {
    try {
      const cliente = await clienteService.crear(req.body);
      res.status(201).json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async actualizar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const cliente = await clienteService.actualizar(id, req.body);
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async eliminar(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await clienteService.eliminar(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ===== NUEVOS ENDPOINTS =====

  async obtenerDeuda(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      const deuda = await AppDataSource.getRepository(ClientDebt).findOne({ where: { clientId } });
      if (!deuda) {
        return res.json({ totalDebt: 0, paidAmount: 0, pendingAmount: 0, status: 'paid' });
      }
      res.json(deuda);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerHealthRecords(req: Request, res: Response) {
    try {
      // Por ahora devolvemos un array vacío (puedes implementar luego)
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerHealthStats(req: Request, res: Response) {
    try {
      // Devuelve un objeto con lastRecord null
      res.json({ lastRecord: null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerCompras(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      if (isNaN(clientId)) {
        return res.status(400).json({ error: 'ID de cliente inválido' });
      }
      const compras = await ventaService.getVentasPorCliente(clientId);
      res.json({ success: true, data: compras });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const clientController = new ClienteController();
