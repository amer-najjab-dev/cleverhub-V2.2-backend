import { Request, Response } from 'express';
import { reportService } from '../services/report/report.service';
import { supplierAnalysisService } from '../services/report/supplierAnalysis.service';

export class ReportController {
  
  // ========== CIERRE DE CAJA ==========
  async getCashClosure(req: Request, res: Response) {
    try {
      const { date } = req.query;
      const userId = req.session.userId;
      
      if (!date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Date requise' 
        });
      }

      const closure = await reportService.getCashClosure(date as string, userId!);
      
      res.json({
        success: true,
        data: closure
      });
    } catch (error: any) {
      console.error('Error getting cash closure:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async validateClosure(req: Request, res: Response) {
    try {
      const result = await reportService.validateClosure(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async resolveDiscrepancy(req: Request, res: Response) {
    try {
      const result = await reportService.resolveDiscrepancy(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // ========== BUSINESS INTELLIGENCE ==========
  async getDashboardKPIs(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const kpis = await reportService.getDashboardKPIs(period as string);
      res.json({
        success: true,
        data: kpis
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async getSalesTrend(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const data = await reportService.getSalesTrend(period as string);
      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async getTopProducts(req: Request, res: Response) {
    try {
      const { limit, period } = req.query;
      const data = await reportService.getTopProducts(
        limit ? parseInt(limit as string) : 10, 
        period as string
      );
      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async getLostSales(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const data = await reportService.getLostSales(period as string);
      res.json({
        success: true,
        data
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  // ========== ANÁLISIS DE PROVEEDORES ==========
  async getSupplierAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate, supplierIds } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et fin sont requises'
        });
      }

      const filters: any = {
        startDate: startDate as string,
        endDate: endDate as string
      };

      // CORREGIDO: Manejar supplierIds correctamente
      if (supplierIds) {
        if (typeof supplierIds === 'string') {
          // Si es string (formato comma-separated)
          filters.supplierIds = supplierIds.split(',');
        } else if (Array.isArray(supplierIds)) {
          // Si ya es un array
          filters.supplierIds = supplierIds;
        }
      }

      const analysis = await supplierAnalysisService.getSupplierAnalysis(filters);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      console.error('Error getting supplier analysis:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSupplierPurchaseHistory(req: Request, res: Response) {
    try {
      const { supplierId } = req.params;
      const { months } = req.query;

      if (!supplierId) {
        return res.status(400).json({
          success: false,
          message: 'Supplier ID est requis'
        });
      }

      const history = await supplierAnalysisService.getSupplierPurchaseHistory(
        supplierId,
        months ? parseInt(months as string) : 6
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('Error getting purchase history:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSupplierCreditNotes(req: Request, res: Response) {
    try {
      const { supplierId } = req.params;
      const { status } = req.query;

      if (!supplierId) {
        return res.status(400).json({
          success: false,
          message: 'Supplier ID est requis'
        });
      }

      const creditNotes = await supplierAnalysisService.getSupplierCreditNotes(
        supplierId,
        status as string
      );

      res.json({
        success: true,
        data: creditNotes
      });
    } catch (error: any) {
      console.error('Error getting credit notes:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export const reportController = new ReportController();