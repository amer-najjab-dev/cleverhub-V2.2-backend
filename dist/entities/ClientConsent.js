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
exports.ClientConsent = void 0;
// backend/src/entities/ClientConsent.ts
const typeorm_1 = require("typeorm");
const Client_1 = require("./Client");
let ClientConsent = class ClientConsent {
};
exports.ClientConsent = ClientConsent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ClientConsent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', unique: true }),
    __metadata("design:type", Number)
], ClientConsent.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Client_1.Client),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", Client_1.Client)
], ClientConsent.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ClientConsent.prototype, "whatsapp", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ClientConsent.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ClientConsent.prototype, "sms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unsubscribed_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Date)
], ClientConsent.prototype, "unsubscribedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unsubscribe_reason', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ClientConsent.prototype, "unsubscribeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unsubscribe_token', nullable: true, length: 100, unique: true }),
    __metadata("design:type", String)
], ClientConsent.prototype, "unsubscribeToken", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ClientConsent.prototype, "createdAt", void 0);
exports.ClientConsent = ClientConsent = __decorate([
    (0, typeorm_1.Entity)('client_consent')
], ClientConsent);
