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
exports.SaleItem = void 0;
const typeorm_1 = require("typeorm");
const Sale_1 = require("./Sale");
const Product_1 = require("./Product");
let SaleItem = class SaleItem {
};
exports.SaleItem = SaleItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SaleItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_id' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], SaleItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SaleItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price_ppv', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "unitPricePPV", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price_pph', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "unitPricePPH", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SaleItem.prototype, "discountAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "discountPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lot_id', nullable: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "lotId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiration_date', nullable: true }),
    __metadata("design:type", Date)
], SaleItem.prototype, "expirationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SaleItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SaleItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, insert: false, select: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "margin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'margin_percentage', type: 'decimal', precision: 5, scale: 2, insert: false, select: true }),
    __metadata("design:type", Number)
], SaleItem.prototype, "marginPercentage", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Sale_1.Sale, sale => sale.items),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", Sale_1.Sale)
], SaleItem.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, product => product.saleItems),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], SaleItem.prototype, "product", void 0);
exports.SaleItem = SaleItem = __decorate([
    (0, typeorm_1.Entity)('sale_items')
], SaleItem);
