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
exports.CreditNote = void 0;
const typeorm_1 = require("typeorm");
const Supplier_1 = require("./Supplier");
let CreditNote = class CreditNote {
};
exports.CreditNote = CreditNote;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CreditNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], CreditNote.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], CreditNote.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'issue_date', type: 'date' }),
    __metadata("design:type", Date)
], CreditNote.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], CreditNote.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CreditNote.prototype, "usedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remaining_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CreditNote.prototype, "remainingAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], CreditNote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], CreditNote.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'linked_bl', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], CreditNote.prototype, "linkedBL", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CreditNote.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CreditNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], CreditNote.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Supplier_1.Supplier, supplier => supplier.creditNotes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", Supplier_1.Supplier)
], CreditNote.prototype, "supplier", void 0);
exports.CreditNote = CreditNote = __decorate([
    (0, typeorm_1.Entity)('credit_notes')
], CreditNote);
