import { AppDataSource } from '../../data-source';
import { Sale } from '../../entities/Sale';
import { SaleItem } from '../../entities/SaleItem';
import { Product } from '../../entities/Product';
import { Client } from '../../entities/Client';
import { User } from '../../entities/User';
import { Between, LessThanOrEqual, Like, MoreThanOrEqual, QueryRunner } from 'typeorm';
import { CreateSaleDTO, SaleResponseDTO } from '../../dtos/sale.dto';
import { ClientDebt } from '../../entities/ClientDebt';

export class VentaService {
  private saleRepository = AppDataSource.getRepository(Sale);
  private saleItemRepository = AppDataSource.getRepository(SaleItem);
  private productRepository = AppDataSource.getRepository(Product);
  private clientRepository = AppDataSource.getRepository(Client);
  private userRepository = AppDataSource.getRepository(User);

  private async generarNumeroVenta(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    const todaySales = await this.saleRepository.find({
      where: { saleNumber: Like(`V-${datePrefix}-%`) },
      order: { createdAt: 'DESC' },
      take: 1
    });

    let sequence = 1;
    if (todaySales.length > 0 && todaySales[0].saleNumber) {
      const match = todaySales[0].saleNumber.match(/V-\d{8}-(\d{4})/);
      if (match && match[1]) sequence = parseInt(match[1]) + 1;
    }
    return `V-${datePrefix}-${sequence.toString().padStart(4, '0')}`;
  }

  async crearVenta(saleData: CreateSaleDTO, queryRunner?: QueryRunner): Promise<SaleResponseDTO> {
    const manager = queryRunner ? queryRunner.manager : AppDataSource.manager;
    const saleRepo = manager.getRepository(Sale);
    const saleItemRepo = manager.getRepository(SaleItem);
    const productRepo = manager.getRepository(Product);
    const clientRepo = manager.getRepository(Client);
    const userRepo = manager.getRepository(User);
    const debtRepo = manager.getRepository(ClientDebt);

    // 1. Validar usuario
    const user = await userRepo.findOne({ where: { id: saleData.userId } });
    if (!user) throw new Error('Usuario no encontrado');

    // 2. Validar cliente si existe
    let client = null;
    if (saleData.clientId) {
      client = await clientRepo.findOne({ where: { id: saleData.clientId } });
    }

    // 3. Procesar items y calcular subtotal
    let subtotal = 0;
    const saleItems: SaleItem[] = [];

    for (const itemData of saleData.items) {
      const product = await productRepo.findOne({ where: { id: itemData.productId } });
      if (!product) throw new Error(`Producto con ID ${itemData.productId} no encontrado`);
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
    } else if (saleData.paymentMethod === 'mixed') {
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
    } else {
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

    const savedSale = await saleRepo.save(sale) as Sale;

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
    if (!createdSale) throw new Error('Error al recuperar la venta creada');
    return createdSale;
  }

  async getVentaPorId(id: number): Promise<SaleResponseDTO | null> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['client', 'user', 'items', 'items.product'],
    });
    return sale ? new SaleResponseDTO(sale) : null;
  }

  async getVentas(filters: any): Promise<Sale[]> {
    const saleRepo = AppDataSource.getRepository(Sale);
    
    const where: any = {};
    
    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
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

  async getVentasPorCliente(clientId: number): Promise<SaleResponseDTO[]> {
    const sales = await this.saleRepository.find({
      where: { clientId },
      relations: ['items', 'items.product', 'payments'],
      order: { createdAt: 'DESC' }
    });
    return sales.map(s => new SaleResponseDTO(s));
  }
}

export const ventaService = new VentaService();