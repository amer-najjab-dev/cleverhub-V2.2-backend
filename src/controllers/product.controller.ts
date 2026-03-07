import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/Product';
import { Like } from 'typeorm';

export class ProductoController {
  async listar(req: Request, res: Response) {
    try {
      const products = await AppDataSource.getRepository(Product).find();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async obtenerPorId(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await AppDataSource.getRepository(Product).findOne({
        where: { id },
        relations: ['priceHistories', 'inventoryLots', 'stockMovements', 'stockMovements.lot']
      });
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async buscar(req: Request, res: Response) {
    try {
      const query = req.query.q as string || '';
      const where = query
        ? [
            { name: Like(`%${query}%`) },
            { description: Like(`%${query}%`) },
            { category: Like(`%${query}%`) },
            { sku: Like(`%${query}%`) }
          ]
        : {};
      const products = await AppDataSource.getRepository(Product).find({
        where,
        order: { name: 'ASC' }
      });
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Método adicional si quieres obtener solo el historial de precios de un producto
  async getPriceHistory(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const priceHistory = await AppDataSource.getRepository('PriceHistory').find({
        where: { product: { id } },
        order: { date: 'DESC' }
      });
      res.json(priceHistory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const productController = new ProductoController();