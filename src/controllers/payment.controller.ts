import { Request, Response } from 'express';
import { pagoService } from '../services/pago/pago.service';

export class PagoController {
  async procesarPago(req: Request, res: Response) {
    try {
      const clientId = parseInt(req.params.clientId);
      const { amount, paymentMethod, reference, notes } = req.body;

      if (!clientId || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Faltan datos: clientId, amount, paymentMethod' });
      }

      const resultado = await pagoService.procesarPago(
        clientId,
        amount,
        { paymentMethod, reference, notes }
      );

      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export const paymentController = new PagoController();