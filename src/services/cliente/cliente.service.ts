import { AppDataSource } from '../../data-source';
import { Client } from '../../entities/Client';

export class ClienteService {
  private clienteRepository = AppDataSource.getRepository(Client);

  async listarTodos(): Promise<Client[]> {
    return await this.clienteRepository.find();
  }

  async obtenerPorId(id: number): Promise<Client | null> {
    return await this.clienteRepository.findOne({ where: { id } });
  }

  async crear(data: Partial<Client>): Promise<Client> {
    const cliente = this.clienteRepository.create(data);
    return await this.clienteRepository.save(cliente);
  }

  async actualizar(id: number, data: Partial<Client>): Promise<Client | null> {
    await this.clienteRepository.update(id, data);
    return this.obtenerPorId(id);
  }

  async eliminar(id: number): Promise<void> {
    await this.clienteRepository.delete(id);
  }
}

export const clienteService = new ClienteService();
