"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaleResponseDTO = exports.CreateSaleDTO = exports.CreateSaleItemDTO = exports.PaymentItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
// DTO para un pago individual (puede usarse en ventas mixtas)
class PaymentItemDto {
}
exports.PaymentItemDto = PaymentItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentItemDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PaymentItemDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentItemDto.prototype, "reference", void 0);
// DTO para crear un ítem de venta
class CreateSaleItemDTO {
    constructor(data) {
        this.productId = data.productId;
        this.quantity = data.quantity;
        this.discountAmount = data.discountAmount || 0;
        this.discountPercentage = data.discountPercentage;
    }
}
exports.CreateSaleItemDTO = CreateSaleItemDTO;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleItemDTO.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleItemDTO.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleItemDTO.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleItemDTO.prototype, "discountPercentage", void 0);
// DTO para crear una venta
class CreateSaleDTO {
    constructor(data) {
        this.clientId = data.clientId;
        this.userId = data.userId;
        this.items = (data.items || []).map(item => new CreateSaleItemDTO(item));
        this.discountType = data.discountType || 'none';
        this.discountAmount = data.discountAmount || 0;
        this.discountPercentage = data.discountPercentage;
        this.paymentMethod = data.paymentMethod;
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
exports.CreateSaleDTO = CreateSaleDTO;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleDTO.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleDTO.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSaleItemDTO),
    __metadata("design:type", Array)
], CreateSaleDTO.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['percentage', 'fixed', 'product', 'cart', 'none']),
    __metadata("design:type", String)
], CreateSaleDTO.prototype, "discountType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleDTO.prototype, "discountAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleDTO.prototype, "discountPercentage", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['cash', 'credit', 'Bank Cheque', 'Bank Transfer', 'Credit Card', 'mixed']),
    __metadata("design:type", String)
], CreateSaleDTO.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateSaleDTO.prototype, "paidAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PaymentItemDto),
    __metadata("design:type", Array)
], CreateSaleDTO.prototype, "payments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSaleDTO.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDTO.prototype, "adultFlag", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDTO.prototype, "pregnantFlag", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDTO.prototype, "lactatingFlag", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDTO.prototype, "chronicConditionFlag", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSaleDTO.prototype, "usualMedicationFlag", void 0);
// DTO para respuesta de venta (simplificado)
class SaleResponseDTO {
    constructor(sale) {
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
exports.SaleResponseDTO = SaleResponseDTO;
