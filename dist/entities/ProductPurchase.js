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
exports.ProductPurchase = void 0;
const typeorm_1 = require("typeorm");
const Supplier_1 = require("./Supplier");
const Product_1 = require("./Product");
let ProductPurchase = class ProductPurchase {
};
exports.ProductPurchase = ProductPurchase;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProductPurchase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProductPurchase.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'int' }),
    __metadata("design:type", Number)
], ProductPurchase.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_date', type: 'date' }),
    __metadata("design:type", Date)
], ProductPurchase.prototype, "purchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ProductPurchase.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_pph', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ProductPurchase.prototype, "pricePPH", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'previous_pph', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ProductPurchase.prototype, "previousPPH", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'batch_number', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], ProductPurchase.prototype, "batchNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ProductPurchase.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_note_id', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], ProductPurchase.prototype, "deliveryNoteId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ProductPurchase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Supplier_1.Supplier, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", Supplier_1.Supplier)
], ProductPurchase.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], ProductPurchase.prototype, "product", void 0);
exports.ProductPurchase = ProductPurchase = __decorate([
    (0, typeorm_1.Entity)('product_purchases')
], ProductPurchase);
