import { Request, Response } from 'express';
import { deliveryService } from '../services/delivery.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    pharmacyId: number | null;
  };
}

export const deliveryController = {
  async registerDelivery(req: AuthRequest, res: Response) {
    try {
      const pharmacyId = req.user?.pharmacyId;
      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia asignada' });
      }

      const result = await deliveryService.registerDelivery({
        ...req.body,
        received_by: req.user?.id,
        reception_date: new Date(req.body.reception_date),
        pharmacy_id: pharmacyId
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Albarán registrado correctamente'
      });
    } catch (error: any) {
      console.error('Error registering delivery:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async registerObligationPayment(req: AuthRequest, res: Response) {
    try {
      const result = await deliveryService.registerObligationPayment(req.body);
      
      res.json({
        success: true,
        data: result,
        message: 'Pago registrado correctamente'
      });
    } catch (error: any) {
      console.error('Error registering payment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getSupplierObligations(req: AuthRequest, res: Response) {
  try {
    const { supplierId } = req.params;
    const obligations = await deliveryService.getSupplierObligations(supplierId); // ← no usar parseInt
    
    res.json({ success: true, data: obligations });
  } catch (error: any) {
    console.error('Error getting obligations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
};
