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
exports.Sale = void 0;
const typeorm_1 = require("typeorm");
const Client_1 = require("./Client");
const User_1 = require("./User");
const SaleItem_1 = require("./SaleItem");
const Payment_1 = require("./Payment");
let Sale = class Sale {
};
exports.Sale = Sale;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Sale.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_number', unique: true }),
    __metadata("design:type", String)
], Sale.prototype, "saleNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', nullable: true }),
    __metadata("design:type", Number)
], Sale.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", Number)
], Sale.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Sale.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_type', nullable: true }),
    __metadata("design:type", String)
], Sale.prototype, "discountType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Sale.prototype, "discountPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Sale.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'change_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "changeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', nullable: true }),
    __metadata("design:type", String)
], Sale.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_status', default: 'pending' }),
    __metadata("design:type", String)
], Sale.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_status', default: 'completed' }),
    __metadata("design:type", String)
], Sale.prototype, "saleStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Sale.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adult_flag', nullable: true }),
    __metadata("design:type", Boolean)
], Sale.prototype, "adultFlag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pregnant_flag', nullable: true }),
    __metadata("design:type", Boolean)
], Sale.prototype, "pregnantFlag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lactating_flag', nullable: true }),
    __metadata("design:type", Boolean)
], Sale.prototype, "lactatingFlag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chronic_condition_flag', nullable: true }),
    __metadata("design:type", Boolean)
], Sale.prototype, "chronicConditionFlag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usual_medication_flag', nullable: true }),
    __metadata("design:type", Boolean)
], Sale.prototype, "usualMedicationFlag", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_applied', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "amountApplied", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_pending', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sale.prototype, "amountPending", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_debt_paid', default: false }),
    __metadata("design:type", Boolean)
], Sale.prototype, "isDebtPaid", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Sale.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Sale.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Client_1.Client, client => client.sales, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", Client_1.Client)
], Sale.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Sale.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SaleItem_1.SaleItem, item => item.sale, { cascade: true }),
    __metadata("design:type", Array)
], Sale.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Payment_1.Payment, payment => payment.sale, { cascade: true }),
    __metadata("design:type", Array)
], Sale.prototype, "payments", void 0);
exports.Sale = Sale = __decorate([
    (0, typeorm_1.Entity)('sales')
], Sale);
