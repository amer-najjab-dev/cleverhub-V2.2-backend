import { AppDataSource } from '../../data-source';
import { Supplier } from '../../entities/Supplier';
import { SupplierPhone } from '../../entities/SupplierPhone';
import { SupplierAddress } from '../../entities/SupplierAddress';
import { Like } from 'typeorm';

export class SupplierService {
  private supplierRepo = AppDataSource.getRepository(Supplier);
  private phoneRepo = AppDataSource.getRepository(SupplierPhone);
  private addressRepo = AppDataSource.getRepository(SupplierAddress);

  async getAll(filters?: any) {
    const where: any = {};

    if (filters?.search) {
      where.companyName = Like(`%${filters.search}%`);
    }

    const suppliers = await this.supplierRepo.find({
      where,
      relations: ['phones', 'addresses'],
      order: { companyName: 'ASC' }
    });

    return suppliers;
  }

  async getById(id: string) {
    const supplier = await this.supplierRepo.findOne({
      where: { id },
      relations: ['phones', 'addresses']
    });

    return supplier;
  }

  async search(query: string) {
    return this.getAll({ search: query });
  }

  async create(data: any) {
    const queryRunner = AppDataSource.createQueryRunner();
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
        const phones = data.phones.map((p: any) => this.phoneRepo.create({
          ...p,
          supplierId: supplier.id
        }));
        await queryRunner.manager.save(phones);
      }

      // Guardar direcciones
      if (data.addresses && data.addresses.length > 0) {
        const addresses = data.addresses.map((a: any) => 
this.addressRepo.create({
          ...a,
          supplierId: supplier.id
        }));
        await queryRunner.manager.save(addresses);
      }

      await queryRunner.commitTransaction();
      return this.getById(supplier.id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, data: any) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Actualizar proveedor
      await queryRunner.manager.update(Supplier, id, {
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
        await queryRunner.manager.delete(SupplierPhone, { supplierId: id });
        const phones = data.phones.map((p: any) => this.phoneRepo.create({
          ...p,
          supplierId: id
        }));
        await queryRunner.manager.save(phones);
      }

      // Actualizar direcciones (borrar y recrear)
      if (data.addresses) {
        await queryRunner.manager.delete(SupplierAddress, { supplierId: id });
        const addresses = data.addresses.map((a: any) => 
this.addressRepo.create({
          ...a,
          supplierId: id
        }));
        await queryRunner.manager.save(addresses);
      }

      await queryRunner.commitTransaction();
      return this.getById(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string) {
    await this.supplierRepo.delete(id);
  }

  async updateBalance(id: string, amount: number) {
    await this.supplierRepo.increment({ id }, 'balance', amount);
  }
}

export const supplierService = new SupplierService();
