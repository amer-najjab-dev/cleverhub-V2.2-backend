// src/controllers/supplier.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/rbac';

export class SupplierController {
  
  async getAll(req: Request, res: Response) {
    try {
      const suppliers = await prisma.suppliers.findMany({
        orderBy: { company_name: 'asc' }
      });
      res.json({ success: true, data: suppliers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supplier = await prisma.suppliers.findUnique({
        where: { id: id }
      });
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
      }
      res.json({ success: true, data: supplier });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      const where: Prisma.suppliersWhereInput = q ? { 
        company_name: { contains: q as string, mode: Prisma.QueryMode.insensitive } 
      } : {};
      
      const suppliers = await prisma.suppliers.findMany({
        where,
        take: 20,
        orderBy: { company_name: 'asc' }
      });
      res.json({ success: true, data: suppliers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req: AuthRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      
      if (!pharmacyId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Usuario sin farmacia asignada' 
        });
      }
      
      const data: any = {
        company_name: req.body.name,
        pharmacy_id: pharmacyId,  // ← AÑADIR ESTO
      };
      
      // Añadir campos opcionales solo si existen
      if (req.body.email) data.email = req.body.email;
      if (req.body.website) data.website = req.body.website;
      if (req.body.fax) data.fax = req.body.fax;
      if (req.body.payment_terms) data.payment_terms = req.body.paymentTerms;
      if (req.body.tax_id) data.tax_id = req.body.taxId;
      if (req.body.registration_number) data.registration_number = req.body.registrationNumber;
      if (req.body.notes) data.notes = req.body.notes;
      
      const supplier = await prisma.suppliers.create({ data });
      
      res.status(201).json({ success: true, data: supplier });
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // CORREGIDO: Usando SOLO los campos que existen en el modelo
      const data: any = {};
      
      if (req.body.name) data.company_name = req.body.name;
      if (req.body.email) data.email = req.body.email;
      if (req.body.website) data.website = req.body.website;
      if (req.body.fax) data.fax = req.body.fax;
      if (req.body.payment_terms) data.payment_terms = req.body.paymentTerms;
      if (req.body.tax_id) data.tax_id = req.body.taxId;
      if (req.body.registration_number) data.registration_number = req.body.registrationNumber;
      if (req.body.notes) data.notes = req.body.notes;

      const supplier = await prisma.suppliers.update({
        where: { id: id },
        data
      });
      
      res.json({ success: true, data: supplier });
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.suppliers.delete({ where: { id: id } });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const supplierController = new SupplierController();