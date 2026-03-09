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
exports.SupplierAddress = void 0;
const typeorm_1 = require("typeorm");
let SupplierAddress = class SupplierAddress {
};
exports.SupplierAddress = SupplierAddress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupplierAddress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'street_number', nullable: true, length: 20 }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "streetNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'street_name', length: 255 }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "streetName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'postal_code', nullable: true, length: 20 }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'Maroc' }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "complement", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_primary', default: false }),
    __metadata("design:type", Boolean)
], SupplierAddress.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_id' }),
    __metadata("design:type", String)
], SupplierAddress.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Supplier', 'addresses', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", Function)
], SupplierAddress.prototype, "supplier", void 0);
exports.SupplierAddress = SupplierAddress = __decorate([
    (0, typeorm_1.Entity)('supplier_addresses')
], SupplierAddress);
