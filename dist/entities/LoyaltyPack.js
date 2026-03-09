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
exports.LoyaltyPack = void 0;
const typeorm_1 = require("typeorm");
const Product_1 = require("./Product");
let LoyaltyPack = class LoyaltyPack {
};
exports.LoyaltyPack = LoyaltyPack;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoyaltyPack.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LoyaltyPack.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoyaltyPack.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_cost' }),
    __metadata("design:type", Number)
], LoyaltyPack.prototype, "pointsCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], LoyaltyPack.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], LoyaltyPack.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_quantity', nullable: true }),
    __metadata("design:type", Number)
], LoyaltyPack.prototype, "maxQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], LoyaltyPack.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], LoyaltyPack.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Product_1.Product),
    (0, typeorm_1.JoinTable)({
        name: 'loyalty_pack_products',
        joinColumn: { name: 'pack_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' }
    }),
    __metadata("design:type", Array)
], LoyaltyPack.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoyaltyPack.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LoyaltyPack.prototype, "updatedAt", void 0);
exports.LoyaltyPack = LoyaltyPack = __decorate([
    (0, typeorm_1.Entity)('loyalty_packs')
], LoyaltyPack);
