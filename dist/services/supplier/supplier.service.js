"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierService = exports.SupplierService = void 0;
const data_source_1 = require("../../data-source");
const Supplier_1 = require("../../entities/Supplier");
const SupplierPhone_1 = require("../../entities/SupplierPhone");
const SupplierAddress_1 = require("../../entities/SupplierAddress");
const typeorm_1 = require("typeorm");
class SupplierService {
    constructor() {
        this.supplierRepo = data_source_1.AppDataSource.getRepository(Supplier_1.Supplier);
        this.phoneRepo = data_source_1.AppDataSource.getRepository(SupplierPhone_1.SupplierPhone);
        this.addressRepo = data_source_1.AppDataSource.getRepository(SupplierAddress_1.SupplierAddress);
    }
    async getAll(filters) {
        const where = {};
        if (filters?.search) {
            where.companyName = (0, typeorm_1.Like)(`%${filters.search}%`);
        }
        const suppliers = await this.supplierRepo.find({
            where,
            relations: ['phones', 'addresses'],
            order: { companyName: 'ASC' }
        });
        return suppliers;
    }
    async getById(id) {
        const supplier = await this.supplierRepo.findOne({
            where: { id },
            relations: ['phones', 'addresses']
        });
        return supplier;
    }
    async search(query) {
        return this.getAll({ search: query });
    }
    async create(data) {
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Crear proveedor
            const supplier = this.supplierRepo.create({
                companyName: data.companyName,
                email: data.email,
                website: data.website,
                fax: data.fax,
                paymentTerms: data.paymentTerms,
                taxId: data.taxId,
                registrationNumber: data.registrationNumber,
                balance: data.balance || 0,
                notes: data.notes,
                isActive: true
            });
            await queryRunner.manager.save(supplier);
            // Guardar teléfonos
            if (data.phones && data.phones.length > 0) {
                const phones = data.phones.map((p) => this.phoneRepo.create({
                    ...p,
                    supplierId: supplier.id
                }));
                await queryRunner.manager.save(phones);
            }
            // Guardar direcciones
            if (data.addresses && data.addresses.length > 0) {
                const addresses = data.addresses.map((a) => this.addressRepo.create({
                    ...a,
                    supplierId: supplier.id
                }));
                await queryRunner.manager.save(addresses);
            }
            await queryRunner.commitTransaction();
            return this.getById(supplier.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async update(id, data) {
        const queryRunner = data_source_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Actualizar proveedor
            await queryRunner.manager.update(Supplier_1.Supplier, id, {
                companyName: data.companyName,
                email: data.email,
                website: data.website,
                fax: data.fax,
                paymentTerms: data.paymentTerms,
                taxId: data.taxId,
                registrationNumber: data.registrationNumber,
                notes: data.notes
            });
            // Actualizar teléfonos (borrar y recrear)
            if (data.phones) {
                await queryRunner.manager.delete(SupplierPhone_1.SupplierPhone, { supplierId: id });
                const phones = data.phones.map((p) => this.phoneRepo.create({
                    ...p,
                    supplierId: id
                }));
                await queryRunner.manager.save(phones);
            }
            // Actualizar direcciones (borrar y recrear)
            if (data.addresses) {
                await queryRunner.manager.delete(SupplierAddress_1.SupplierAddress, { supplierId: id });
                const addresses = data.addresses.map((a) => this.addressRepo.create({
                    ...a,
                    supplierId: id
                }));
                await queryRunner.manager.save(addresses);
            }
            await queryRunner.commitTransaction();
            return this.getById(id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async delete(id) {
        await this.supplierRepo.delete(id);
    }
    async updateBalance(id, amount) {
        await this.supplierRepo.increment({ id }, 'balance', amount);
    }
}
exports.SupplierService = SupplierService;
exports.supplierService = new SupplierService();
