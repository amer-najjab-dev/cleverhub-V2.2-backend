import { AppDataSource } from '../../data-source';
import { Sale } from '../../entities/Sale';
import { Payment } from '../../entities/Payment';
import { ClientDebt } from '../../entities/ClientDebt';
import { MoreThan, QueryRunner } from 'typeorm';

interface VentaActualizada {
  saleId: number;
  saleNumber: string;
  previousBalance: number;
  appliedAmount: number;
  newBalance: number;
  newStatus: string;
}

export class PagoService {
  private saleRepository = AppDataSource.getRepository(Sale);
  private paymentRepository = AppDataSource.getRepository(Payment);
  private clientDebtRepository = AppDataSource.getRepository(ClientDebt);

  async procesarPago(
    clientId: number,
    monto: number,
    datosPago: { paymentMethod: string; reference?: string; notes?: string },
    queryRunner?: QueryRunner
  ): Promise<{
    success: boolean;
    totalAplicado: number;
    sobrante: number;
    ventasActualizadas: VentaActualizada[];
    deudaCliente: any;
  }> {
    const manager = queryRunner ? queryRunner.manager : AppDataSource.manager;
    const saleRepo = manager.getRepository(Sale);
    const paymentRepo = manager.getRepository(Payment);
    const debtRepo = manager.getRepository(ClientDebt);

    // 1. Obtener todas las ventas con deuda pendiente, ordenadas FIFO
    const ventasPendientes = await saleRepo.find({
      where: { clientId, amountPending: MoreThan(0.01) },
      order: { createdAt: 'ASC', id: 'ASC' }
    });

    if (ventasPendientes.length === 0) {
      throw new Error('El cliente no tiene deudas pendientes');
    }

    let restante = Number(monto.toFixed(2));
    let totalAplicado = 0;
    const ventasActualizadas: VentaActualizada[] = [];

    // 2. Aplicar pago a las ventas en orden FIFO
    for (const venta of ventasPendientes) {
      if (restante <= 0.01) break;

      const pendienteActual = Number(venta.amountPending);
      if (pendienteActual <= 0.01) continue;

      const aplicar = Math.min(pendienteActual, restante);
      const saldoAnterior = pendienteActual;

      // Actualizar la venta
      venta.paidAmount = Number(venta.paidAmount) + aplicar;
      venta.amountApplied = Number(venta.amountApplied) + aplicar;
      venta.amountPending = pendienteActual - aplicar;

      if (venta.amountPending <= 0.01) {
        venta.paymentStatus = 'paid';
        venta.isDebtPaid = true;
      } else {
        venta.paymentStatus = 'partial';
        venta.isDebtPaid = false;
      }

      await manager.save(venta);

      // Registrar pago en la tabla payments
      const pago = paymentRepo.create({
        saleId: venta.id,
        amount: aplicar,
        paymentMethod: datosPago.paymentMethod,
        reference: datosPago.reference || `Pago venta ${venta.saleNumber}`,
        notes: datosPago.notes || ''
      });
      await manager.save(pago);

      ventasActualizadas.push({
        saleId: venta.id,
        saleNumber: venta.saleNumber,
        previousBalance: saldoAnterior,
        appliedAmount: aplicar,
        newBalance: venta.amountPending,
        newStatus: venta.paymentStatus
      });

      restante = Number((restante - aplicar).toFixed(2));
      totalAplicado = Number((totalAplicado + aplicar).toFixed(2));
    }

    // 3. Recalcular deuda consolidada (suma de amount_pending de todas las ventas del cliente)
    const totalPendiente = await manager
      .createQueryBuilder(Sale, 'sale')
      .select('SUM(sale.amountPending)', 'total')
      .where('sale.clientId = :clientId', { clientId })
      .andWhere('sale.amountPending > 0.01')
      .getRawOne();

    const nuevaDeudaTotal = Number(totalPendiente?.total || 0);

    // 4. Obtener o crear el registro de deuda del cliente
    let clientDebt = await debtRepo.findOne({ where: { clientId } });
    if (!clientDebt) {
      clientDebt = debtRepo.create({ clientId });
    }

    // Actualizar campos
    clientDebt.totalDebt = nuevaDeudaTotal;
    // ✅ Sumamos el monto aplicado al histórico de pagos
    clientDebt.paidAmount = 0;
    clientDebt.status = nuevaDeudaTotal > 0.01 ? 'partial' : 'paid';
    clientDebt.lastPaymentDate = new Date();

    // Actualizar notas con el detalle del pago (opcional)
    const ventasConDeuda = ventasPendientes.filter(v => v.amountPending > 0.01);
    const listaVentas = ventasConDeuda.map(v => `${v.saleNumber} (${v.amountPending}€)`).join(', ');
    clientDebt.notes = `Ventas pendientes: ${listaVentas || 'ninguna'}`;

    await debtRepo.save(clientDebt);

    return {
      success: true,
      totalAplicado,
      sobrante: restante,
      ventasActualizadas,
      deudaCliente: clientDebt
    };
  }
}

export const pagoService = new PagoService();