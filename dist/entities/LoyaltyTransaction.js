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
exports.LoyaltyTransaction = void 0;
const typeorm_1 = require("typeorm");
const Client_1 = require("./Client");
const Sale_1 = require("./Sale");
const LoyaltyReward_1 = require("./LoyaltyReward");
const LoyaltyPack_1 = require("./LoyaltyPack");
let LoyaltyTransaction = class LoyaltyTransaction {
};
exports.LoyaltyTransaction = LoyaltyTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Client_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", Client_1.Client)
], LoyaltyTransaction.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "points", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], LoyaltyTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoyaltyTransaction.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sale_id', nullable: true }),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "saleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Sale_1.Sale, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sale_id' }),
    __metadata("design:type", Sale_1.Sale)
], LoyaltyTransaction.prototype, "sale", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reward_id', nullable: true }),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "rewardId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LoyaltyReward_1.LoyaltyReward, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'reward_id' }),
    __metadata("design:type", LoyaltyReward_1.LoyaltyReward)
], LoyaltyTransaction.prototype, "reward", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pack_id', nullable: true }),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "packId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LoyaltyPack_1.LoyaltyPack, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'pack_id' }),
    __metadata("design:type", LoyaltyPack_1.LoyaltyPack)
], LoyaltyTransaction.prototype, "pack", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_value', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], LoyaltyTransaction.prototype, "productValue", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoyaltyTransaction.prototype, "createdAt", void 0);
exports.LoyaltyTransaction = LoyaltyTransaction = __decorate([
    (0, typeorm_1.Entity)('loyalty_transactions')
], LoyaltyTransaction);
