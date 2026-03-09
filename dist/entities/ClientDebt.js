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
exports.ClientDebt = void 0;
const typeorm_1 = require("typeorm");
const Client_1 = require("./Client");
let ClientDebt = class ClientDebt {
};
exports.ClientDebt = ClientDebt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ClientDebt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", Number)
], ClientDebt.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_debt', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ClientDebt.prototype, "totalDebt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ClientDebt.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pending_amount', type: 'decimal', precision: 10, scale: 2, generatedType: 'STORED', asExpression: 'total_debt - paid_amount' }),
    __metadata("design:type", Number)
], ClientDebt.prototype, "pendingAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_payment_date', nullable: true }),
    __metadata("design:type", Date)
], ClientDebt.prototype, "lastPaymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], ClientDebt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ClientDebt.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClientDebt.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ClientDebt.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Client_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", Client_1.Client)
], ClientDebt.prototype, "client", void 0);
exports.ClientDebt = ClientDebt = __decorate([
    (0, typeorm_1.Entity)('client_debts')
], ClientDebt);
