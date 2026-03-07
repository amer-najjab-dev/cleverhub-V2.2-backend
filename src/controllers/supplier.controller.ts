import { Request, Response } from 'express';
import { supplierService } from '../services/supplier/supplier.service';

export class SupplierController {
  
  async getAll(req: Request, res: Response) {
    try {
      const { search } = req.query;
      
      const filters: any = {};
      if (search) filters.search = search;
      
      const suppliers = await supplierService.getAll(filters);
      
      res.json({
        success: true,
        data: suppliers
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supplier = await supplierService.getById(id);
      
      if (!supplier) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fournisseur non trouvé' 
        });
      }
      
      res.json({
        success: true,
        data: supplier
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const suppliers = await supplierService.search(q as string);
      
      res.json({
        success: true,
        data: suppliers
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async create(req: Request, res: Response) {
    try {
      const supplier = await supplierService.create(req.body);
      
      res.status(201).json({
        success: true,
        data: supplier
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supplier = await supplierService.update(id, req.body);
      
      res.json({
        success: true,
        data: supplier
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
  
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await supplierService.delete(id);
      
      res.json({
        success: true,
        message: 'Fournisseur supprimé avec succès'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

export const supplierController = new SupplierController();
