"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteService = exports.ClienteService = void 0;
const data_source_1 = require("../../data-source");
const Client_1 = require("../../entities/Client");
class ClienteService {
    constructor() {
        this.clienteRepository = data_source_1.AppDataSource.getRepository(Client_1.Client);
    }
    async listarTodos() {
        return await this.clienteRepository.find();
    }
    async obtenerPorId(id) {
        return await this.clienteRepository.findOne({ where: { id } });
    }
    async crear(data) {
        const cliente = this.clienteRepository.create(data);
        return await this.clienteRepository.save(cliente);
    }
    async actualizar(id, data) {
        await this.clienteRepository.update(id, data);
        return this.obtenerPorId(id);
    }
    async eliminar(id) {
        await this.clienteRepository.delete(id);
    }
}
exports.ClienteService = ClienteService;
exports.clienteService = new ClienteService();
