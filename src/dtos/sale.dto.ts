import { IsOptional, IsNumber, IsString, IsEnum, IsBoolean, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para un pago individual (puede usarse en ventas mixtas)
export class PaymentItemDto {
  @IsString()
  method: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

// DTO para crear un ítem de venta
export class CreateSaleItemDTO {
  @IsNumber()
  productId: number;
  
  @IsNumber()
  quantity: number;
  
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
  
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
  
  constructor(data: Partial<CreateSaleItemDTO>) {
    this.productId = data.productId!;
    this.quantity = data.quantity!;
    this.discountAmount = data.discountAmount || 0;
    this.discountPercentage = data.discountPercentage;
  }
}

// DTO para crear una venta
export class CreateSaleDTO {
  @IsOptional()
  @IsNumber()
  clientId?: number;
  
  @IsNumber()
  userId: number;
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDTO)
  items: CreateSaleItemDTO[];
  
  @IsOptional()
  @IsEnum(['percentage', 'fixed', 'product', 'cart', 'none'])
  discountType?: 'percentage' | 'fixed' | 'product' | 'cart' | 'none';
  
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
  
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
  
  // Método de pago (puede ser 'credit', 'cash', 'mixed', etc.)
  @IsEnum(['cash', 'credit', 'Bank Cheque', 'Bank Transfer', 'Credit Card', 'mixed'])
  paymentMethod: string;
  
  // Para compatibilidad con el frontend (pago único)
  @IsOptional()
  @IsNumber()
  paidAmount?: number;
  
  // Array de pagos para métodos mixtos o múltiples pagos
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  payments?: PaymentItemDto[];
  
  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  @IsBoolean()
  adultFlag?: boolean;
  
  @IsOptional()
  @IsBoolean()
  pregnantFlag?: boolean;
  
  @IsOptional()
  @IsBoolean()
  lactatingFlag?: boolean;
  
  @IsOptional()
  @IsBoolean()
  chronicConditionFlag?: boolean;
  
  @IsOptional()
  @IsBoolean()
  usualMedicationFlag?: boolean;
  
  constructor(data: Partial<CreateSaleDTO>) {
    this.clientId = data.clientId;
    this.userId = data.userId!;
    this.items = (data.items || []).map(item => new CreateSaleItemDTO(item));
    this.discountType = data.discountType || 'none';
    this.discountAmount = data.discountAmount || 0;
    this.discountPercentage = data.discountPercentage;
    this.paymentMethod = data.paymentMethod!;
    this.paidAmount = data.paidAmount || 0;
    this.payments = data.payments; // se asigna directamente
    this.notes = data.notes;
    this.adultFlag = data.adultFlag;
    this.pregnantFlag = data.pregnantFlag;
    this.lactatingFlag = data.lactatingFlag;
    this.chronicConditionFlag = data.chronicConditionFlag;
    this.usualMedicationFlag = data.usualMedicationFlag;
  }
}

// DTO para respuesta de venta (simplificado)
export class SaleResponseDTO {
  id: number;
  saleNumber: string;
  clientId?: number;
  userId: number;
  subtotal: number;
  discountAmount?: number;
  discountType?: string;
  discountPercentage?: number;
  taxAmount?: number;
  total: number;
  paidAmount: number;
  changeAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  saleStatus?: string;
  notes?: string;
  adultFlag?: boolean;
  pregnantFlag?: boolean;
  lactatingFlag?: boolean;
  chronicConditionFlag?: boolean;
  usualMedicationFlag?: boolean;
  amountApplied: number;
  amountPending: number;
  isDebtPaid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  client?: any;
  user?: any;
  items?: any[];
  payments?: any[];

  constructor(sale: any) {
    this.id = sale.id;
    this.saleNumber = sale.saleNumber;
    this.clientId = sale.clientId;
    this.userId = sale.userId;
    this.subtotal = parseFloat(sale.subtotal);
    this.discountAmount = parseFloat(sale.discountAmount);
    this.discountType = sale.discountType;
    this.discountPercentage = sale.discountPercentage;
    this.taxAmount = parseFloat(sale.taxAmount);
    this.total = parseFloat(sale.total);
    this.paidAmount = parseFloat(sale.paidAmount);
    this.changeAmount = parseFloat(sale.changeAmount);
    this.paymentMethod = sale.paymentMethod;
    this.paymentStatus = sale.paymentStatus;
    this.saleStatus = sale.saleStatus;
    this.notes = sale.notes;
    this.adultFlag = sale.adultFlag;
    this.pregnantFlag = sale.pregnantFlag;
    this.lactatingFlag = sale.lactatingFlag;
    this.chronicConditionFlag = sale.chronicConditionFlag;
    this.usualMedicationFlag = sale.usualMedicationFlag;
    this.amountApplied = parseFloat(sale.amountApplied);
    this.amountPending = parseFloat(sale.amountPending);
    this.isDebtPaid = sale.isDebtPaid;
    this.createdAt = sale.createdAt;
    this.updatedAt = sale.updatedAt;
    this.client = sale.client;
    this.user = sale.user;
    this.items = sale.items || [];
    this.payments = sale.payments || [];
  }
}