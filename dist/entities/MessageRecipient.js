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
exports.MessageRecipient = void 0;
// backend/src/entities/MessageRecipient.ts
const typeorm_1 = require("typeorm");
const Client_1 = require("./Client");
const MessageCampaign_1 = require("./MessageCampaign");
const Sale_1 = require("./Sale");
let MessageRecipient = class MessageRecipient {
};
exports.MessageRecipient = MessageRecipient;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MessageRecipient.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id' }),
    __metadata("design:type", Number)
], MessageRecipient.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Client_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", Client_1.Client)
], MessageRecipient.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'campaign_id' }),
    __metadata("design:type", Number)
], MessageRecipient.prototype, "campaignId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MessageCampaign_1.MessageCampaign),
    (0, typeorm_1.JoinColumn)({ name: 'campaign_id' }),
    __metadata("design:type", MessageCampaign_1.MessageCampaign)
], MessageRecipient.prototype, "campaign", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], MessageRecipient.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MessageRecipient.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'pending' }),
    __metadata("design:type", String)
], MessageRecipient.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageRecipient.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageRecipient.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageRecipient.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'converted_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageRecipient.prototype, "convertedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversion_sale_id', nullable: true }),
    __metadata("design:type", Number)
], MessageRecipient.prototype, "conversionSaleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Sale_1.Sale, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'conversion_sale_id' }),
    __metadata("design:type", Sale_1.Sale)
], MessageRecipient.prototype, "conversionSale", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MessageRecipient.prototype, "createdAt", void 0);
exports.MessageRecipient = MessageRecipient = __decorate([
    (0, typeorm_1.Entity)('message_recipients')
], MessageRecipient);
