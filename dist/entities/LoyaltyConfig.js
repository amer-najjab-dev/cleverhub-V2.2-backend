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
exports.LoyaltyConfig = void 0;
const typeorm_1 = require("typeorm");
let LoyaltyConfig = class LoyaltyConfig {
};
exports.LoyaltyConfig = LoyaltyConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_per_unit', default: 1 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "pointsPerUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'currency_unit', default: 10 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "currencyUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'min_purchase_for_points', default: 0, type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "minPurchaseForPoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_expiry_days', default: 365 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "pointsExpiryDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'welcome_points', default: 100 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "welcomePoints", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'birthday_multiplier', default: 2, type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "birthdayMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_purchase_multiplier', default: 1.5, type: 'decimal', precision: 3, scale: 1 }),
    __metadata("design:type", Number)
], LoyaltyConfig.prototype, "firstPurchaseMultiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], LoyaltyConfig.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tier_thresholds', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], LoyaltyConfig.prototype, "tierThresholds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoyaltyConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], LoyaltyConfig.prototype, "updatedAt", void 0);
exports.LoyaltyConfig = LoyaltyConfig = __decorate([
    (0, typeorm_1.Entity)('loyalty_config')
], LoyaltyConfig);
