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
exports.InventoryLot = void 0;
const typeorm_1 = require("typeorm");
const Product_1 = require("./Product");
const StockMovement_1 = require("./StockMovement");
let InventoryLot = class InventoryLot {
};
exports.InventoryLot = InventoryLot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InventoryLot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, product => product.inventoryLots, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], InventoryLot.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, name: 'batch_number' }),
    __metadata("design:type", String)
], InventoryLot.prototype, "batchNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'expiry_date' }),
    __metadata("design:type", Date)
], InventoryLot.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InventoryLot.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryLot.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryLot.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => StockMovement_1.StockMovement, stockMovement => stockMovement.lot),
    __metadata("design:type", Array)
], InventoryLot.prototype, "stockMovements", void 0);
exports.InventoryLot = InventoryLot = __decorate([
    (0, typeorm_1.Entity)('inventory_lots')
], InventoryLot);
