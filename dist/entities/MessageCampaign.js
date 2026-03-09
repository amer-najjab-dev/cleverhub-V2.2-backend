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
exports.MessageCampaign = void 0;
// backend/src/entities/MessageCampaign.ts
const typeorm_1 = require("typeorm");
const MessageTemplate_1 = require("./MessageTemplate");
const User_1 = require("./User");
let MessageCampaign = class MessageCampaign {
};
exports.MessageCampaign = MessageCampaign;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], MessageCampaign.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'template_id' }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => MessageTemplate_1.MessageTemplate),
    (0, typeorm_1.JoinColumn)({ name: 'template_id' }),
    __metadata("design:type", MessageTemplate_1.MessageTemplate)
], MessageCampaign.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], MessageCampaign.prototype, "segments", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_recipients', default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "totalRecipients", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_count', default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "sentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_count', default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "deliveredCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_count', default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "readCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversion_count', default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "conversionCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversion_value', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "conversionValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'draft' }),
    __metadata("design:type", String)
], MessageCampaign.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_for', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageCampaign.prototype, "scheduledFor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageCampaign.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageCampaign.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', nullable: true }),
    __metadata("design:type", Number)
], MessageCampaign.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", User_1.User)
], MessageCampaign.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MessageCampaign.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MessageCampaign.prototype, "updatedAt", void 0);
exports.MessageCampaign = MessageCampaign = __decorate([
    (0, typeorm_1.Entity)('message_campaigns')
], MessageCampaign);
