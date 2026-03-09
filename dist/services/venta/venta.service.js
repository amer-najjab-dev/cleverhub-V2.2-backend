"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ventaService = exports.VentaService = void 0;
const data_source_1 = require("../../data-source");
const Sale_1 = require("../../entities/Sale");
const SaleItem_1 = require("../../entities/SaleItem");
const Product_1 = require("../../entities/Product");
const Client_1 = require("../../entities/Client");
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const sale_dto_1 = require("../../dtos/sale.dto");
const ClientDebt_1 = require("../../entities/ClientDebt");
class VentaService {
    constructor() {
        this.saleRepository = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
        this.saleItemRepository = data_source_1.AppDataSource.getRepository(SaleItem_1.SaleItem);
        this.productRepository = data_source_1.AppDataSource.getRepository(Product_1.Product);
        this.clientRepository = data_source_1.AppDataSource.getRepository(Client_1.Client);
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
    }
    async generarNumeroVenta() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;
        const todaySales = await this.saleRepository.find({
            where: { saleNumber: (0, typeorm_1.Like)(`V-${datePrefix}-%`) },
            order: { createdAt: 'DESC' },
            take: 1
        });
        let sequence = 1;
        if (todaySales.length > 0 && todaySales[0].saleNumber) {
            const match = todaySales[0].saleNumber.match(/V-\d{8}-(\d{4})/);
            if (match && match[1])
                sequence = parseInt(match[1]) + 1;
        }
        return `V-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
    }
    async crearVenta(saleData, queryRunner) {
        const manager = queryRunner ? queryRunner.manager : data_source_1.AppDataSource.manager;
        const saleRepo = manager.getRepository(Sale_1.Sale);
        const saleItemRepo = manager.getRepository(SaleItem_1.SaleItem);
        const productRepo = manager.getRepository(Product_1.Product);
        const clientRepo = manager.getRepository(Client_1.Client);
        const userRepo = manager.getRepository(User_1.User);
        const debtRepo = manager.getRepository(ClientDebt_1.ClientDebt);
        // 1. Validar usuario
        const user = await userRepo.findOne({ where: { id: saleData.userId } });
        if (!user)
            throw new Error('Usuario no encontrado');
        // 2. Validar cliente si existe
        let client = null;
        if (saleData.clientId) {
            client = await clientRepo.findOne({ where: { id: saleData.clientId } });
        }
        // 3. Procesar items y calcular subtotal
        let subtotal = 0;
        const saleItems = [];
        for (const itemData of saleData.items) {
            const product = await productRepo.findOne({ where: { id: itemData.productId } });
            if (!product)
                throw new Error(`Producto con ID ${itemData.productId} no encontrado`);
            if (product.stock < itemData.quantity) {
                throw new Error(`Stock insuficiente para ${product.name}`);
            }
            // Descontar stock (sin gestión de lotes por simplicidad)
            product.stock -= itemData.quantity;
            await productRepo.save(product);
            const unitPricePPV = product.pricePPV;
            const unitPricePPH = product.pricePPH;
            const discountAmount = itemData.discountAmount || 0;
            const itemTotal = (unitPricePPV * itemData.quantity) - discountAmount;
            subtotal += itemTotal;
            const saleItem = saleItemRepo.create({
                productId: product.id,
                quantity: itemData.quantity,
                unitPricePPV,
                unitPricePPH,
                discountAmount,
                discountPercentage: itemData.discountPercentage || 0,
            });
            saleItems.push(saleItem);
        }
        // 4. Calcular totales (SIN IVA - el frontend ya lo incluye según la región)
        const discountAmount = saleData.discountAmount || 0;
        const taxAmount = 0; // IVA ya incluido en el precio desde el frontend
        const total = subtotal - discountAmount; // El frontend ya envió el total con IVA incluido
        console.log('💰 Cálculo de venta (backend):', {
            subtotal,
            discountAmount,
            taxAmount: 0,
            total
        });
        // 5. Determinar montos de crédito y líquido según el método de pago
        let creditAmount = 0;
        let liquidAmount = 0;
        if (saleData.paymentMethod === 'credit') {
            creditAmount = total;
        }
        else if (saleData.paymentMethod === 'mixed') {
            // Validar que se haya enviado el array payments
            if (!saleData.payments || !Array.isArray(saleData.payments) || saleData.payments.length === 0) {
                throw new Error('Para pagos mixtos es obligatorio enviar el array payments con los métodos');
            }
            const creditPayments = saleData.payments.filter(p => p.method === 'credit');
            const liquidPayments = saleData.payments.filter(p => p.method !== 'credit');
            creditAmount = creditPayments.reduce((sum, p) => sum + p.amount, 0);
            liquidAmount = liquidPayments.reduce((sum, p) => sum + p.amount, 0);
            // Validar que la suma de pagos sea igual al total (con tolerancia por redondeo)
            const totalPayments = creditAmount + liquidAmount;
            if (Math.abs(totalPayments - total) > 0.01) {
                throw new Error(`La suma de los pagos (${totalPayments.toFixed(2)}) no coincide con el total de la venta (${total.toFixed(2)})`);
            }
        }
        else {
            // Otros métodos (cash, card, transfer, cheque) se consideran pago completo inmediato
            liquidAmount = total;
        }
        // 6. Crear la venta con los valores calculados
        const sale = saleRepo.create({
            saleNumber: await this.generarNumeroVenta(),
            clientId: saleData.clientId || null,
            userId: saleData.userId,
            subtotal,
            discountAmount,
            discountType: saleData.discountType || 'none',
            discountPercentage: saleData.discountPercentage,
            taxAmount, // Será 0 siempre ahora
            total,
            paidAmount: liquidAmount,
            changeAmount: 0,
            paymentMethod: saleData.paymentMethod,
            paymentStatus: creditAmount > 0 ? (liquidAmount > 0 ? 'partial' : 'pending') : 'paid',
            saleStatus: 'completed',
            notes: saleData.notes,
            adultFlag: saleData.adultFlag,
            pregnantFlag: saleData.pregnantFlag,
            lactatingFlag: saleData.lactatingFlag,
            chronicConditionFlag: saleData.chronicConditionFlag,
            usualMedicationFlag: saleData.usualMedicationFlag,
            amountApplied: liquidAmount,
            amountPending: creditAmount,
            isDebtPaid: creditAmount === 0,
        });
        const savedSale = await saleRepo.save(sale);
        // 7. Guardar los items de la venta
        for (const item of saleItems) {
            item.saleId = savedSale.id;
            await saleItemRepo.save(item);
        }
        // 8. Actualizar deuda del cliente si hay crédito
        if (creditAmount > 0 && saleData.clientId) {
            let clientDebt = await debtRepo.findOne({ where: { clientId: saleData.clientId } });
            if (!clientDebt) {
                clientDebt = debtRepo.create({ clientId: saleData.clientId });
            }
            clientDebt.totalDebt = Number(clientDebt.totalDebt) + creditAmount;
            clientDebt.status = clientDebt.totalDebt > 0 ? 'partial' : 'paid';
            clientDebt.notes = (clientDebt.notes ? clientDebt.notes + '\n' : '') + `+ Venta #${savedSale.id}: ${creditAmount}€ (crédito)`;
            await debtRepo.save(clientDebt);
        }
        // 9. Actualizar datos del cliente (total compras, última compra, puntos)
        if (client) {
            client.totalPurchases = (Number(client.totalPurchases) || 0) + total;
            client.lastPurchaseDate = new Date();
            client.loyaltyPoints = (client.loyaltyPoints || 0) + Math.floor(total);
            await clientRepo.save(client);
        }
        // 10. Retornar la venta creada con relaciones
        const createdSale = await this.getVentaPorId(savedSale.id);
        if (!createdSale)
            throw new Error('Error al recuperar la venta creada');
        return createdSale;
    }
    async getVentaPorId(id) {
        const sale = await this.saleRepository.findOne({
            where: { id },
            relations: ['client', 'user', 'items', 'items.product'],
        });
        return sale ? new sale_dto_1.SaleResponseDTO(sale) : null;
    }
    async getVentas(filters) {
        const saleRepo = data_source_1.AppDataSource.getRepository(Sale_1.Sale);
        const where = {};
        if (filters.startDate && filters.endDate) {
            where.createdAt = (0, typeorm_1.Between)(filters.startDate, filters.endDate);
        }
        if (filters.clientId) {
            where.client = { id: filters.clientId };
        }
        if (filters.userId) {
            where.user = { id: filters.userId };
        }
        if (filters.saleStatus) {
            where.saleStatus = filters.saleStatus;
        }
        if (filters.paymentStatus) {
            where.paymentStatus = filters.paymentStatus;
        }
        if (filters.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }
        return await saleRepo.find({
            where,
            relations: ['client', 'user'],
            order: { createdAt: 'DESC' },
            take: filters.limit,
            skip: filters.offset
        });
    }
    async getVentasPorCliente(clientId) {
        const sales = await this.saleRepository.find({
            where: { clientId },
            relations: ['items', 'items.product', 'payments'],
            order: { createdAt: 'DESC' }
        });
        return sales.map(s => new sale_dto_1.SaleResponseDTO(s));
    }
}
exports.VentaService = VentaService;
exports.ventaService = new VentaService();
