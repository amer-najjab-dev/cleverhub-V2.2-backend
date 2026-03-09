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
exports.AIGeneratedMessage = void 0;
// backend/src/entities/AIGeneratedMessage.ts
const typeorm_1 = require("typeorm");
const Product_1 = require("./Product");
const User_1 = require("./User");
let AIGeneratedMessage = class AIGeneratedMessage {
};
exports.AIGeneratedMessage = AIGeneratedMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], AIGeneratedMessage.prototype, "tone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AIGeneratedMessage.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id' }),
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], AIGeneratedMessage.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'points_cost', nullable: true, type: 'int' }) // ✅ Añadido nullable: true
    ,
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "pointsCost", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usage_count', default: 0 }),
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "usageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'like_count', default: 0 }),
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "likeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", Number)
], AIGeneratedMessage.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", User_1.User)
], AIGeneratedMessage.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AIGeneratedMessage.prototype, "createdAt", void 0);
exports.AIGeneratedMessage = AIGeneratedMessage = __decorate([
    (0, typeorm_1.Entity)('ai_generated_messages')
], AIGeneratedMessage);
