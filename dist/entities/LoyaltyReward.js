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
exports.LoyaltyReward = void 0;
const typeorm_1 = require("typeorm");
const Product_1 = require("./Product");
let LoyaltyReward = class LoyaltyReward {
};
exports.LoyaltyReward = LoyaltyReward;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoyaltyReward.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], LoyaltyReward.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], LoyaltyReward.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_cost' }),
    __metadata("design:type", Number)
], LoyaltyReward.prototype, "pointsCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], LoyaltyReward.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoyaltyReward.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', nullable: true }),
    __metadata("design:type", String)
], LoyaltyReward.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'max_quantity', nullable: true }),
    __metadata("design:type", Number)
], LoyaltyReward.prototype, "maxQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], LoyaltyReward.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_date', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], LoyaltyReward.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoyaltyReward.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LoyaltyReward.prototype, "updatedAt", void 0);
exports.LoyaltyReward = LoyaltyReward = __decorate([
    (0, typeorm_1.Entity)('loyalty_rewards')
], LoyaltyReward);
