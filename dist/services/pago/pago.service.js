"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagoService = exports.PagoService = void 0;
const data_source_1 = require("../../data-source");
const Sale_1 = require("../../entities/Sale");
const Payment_1 = require("../../entities/Payment");
const ClientDebt_1 = require("../../entities/ClientDebt");
const typeorm_1 = require("typeorm");
class PagoService {
    constructor() {
        this.saleRepository = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
        this.paymentRepository = data_source_1.AppDataSource.getRepository(Payment_1.Payment);
        this.clientDebtRepository = data_source_1.AppDataSource.getRepository(ClientDebt_1.ClientDebt);
    }
    async procesarPago(clientId, monto, datosPago, queryRunner) {
        const manager = queryRunner ? queryRunner.manager : data_source_1.AppDataSource.manager;
        const saleRepo = manager.getRepository(Sale_1.Sale);
        const paymentRepo = manager.getRepository(Payment_1.Payment);
        const debtRepo = manager.getRepository(ClientDebt_1.ClientDebt);
        // 1. Obtener todas las ventas con deuda pendiente, ordenadas FIFO
        const ventasPendientes = await saleRepo.find({
            where: { clientId, amountPending: (0, typeorm_1.MoreThan)(0.01) },
            order: { createdAt: 'ASC', id: 'ASC' }
        });
        if (ventasPendientes.length === 0) {
            throw new Error('El cliente no tiene deudas pendientes');
        }
        let restante = Number(monto.toFixed(2));
        let totalAplicado = 0;
        const ventasActualizadas = [];
        // 2. Aplicar pago a las ventas en orden FIFO
        for (const venta of ventasPendientes) {
            if (restante <= 0.01)
                break;
            const pendienteActual = Number(venta.amountPending);
            if (pendienteActual <= 0.01)
                continue;
            const aplicar = Math.min(pendienteActual, restante);
            const saldoAnterior = pendienteActual;
            // Actualizar la venta
            venta.paidAmount = Number(venta.paidAmount) + aplicar;
            venta.amountApplied = Number(venta.amountApplied) + aplicar;
            venta.amountPending = pendienteActual - aplicar;
            if (venta.amountPending <= 0.01) {
                venta.paymentStatus = 'paid';
                venta.isDebtPaid = true;
            }
            else {
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
            .createQueryBuilder(Sale_1.Sale, 'sale')
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
exports.PagoService = PagoService;
exports.pagoService = new PagoService();
