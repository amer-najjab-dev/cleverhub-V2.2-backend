"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientController = exports.ClientController = void 0;
const server_1 = require("../server");
class ClientController {
    async getAll(req, res) {
        try {
            const { page = 1, limit = 20, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [clients, total] = await Promise.all([
                server_1.prisma.clients.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { created_at: 'desc' },
                }),
                server_1.prisma.clients.count({ where }),
            ]);
            res.json({
                success: true,
                data: clients,
                meta: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (error) {
            console.error('Error getting clients:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async getById(req, res) {
        try {
            const { id } = req.params;
            const client = await server_1.prisma.clients.findUnique({
                where: { id: Number(id) },
                include: {
                    sales: {
                        take: 10,
                        orderBy: { created_at: 'desc' },
                    },
                },
            });
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            res.json({
                success: true,
                data: client,
            });
        }
        catch (error) {
            console.error('Error getting client:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async create(req, res) {
        try {
            const client = await server_1.prisma.clients.create({
                data: req.body,
            });
            res.json({
                success: true,
                data: client,
            });
        }
        catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const client = await server_1.prisma.clients.update({
                where: { id: Number(id) },
                data: req.body,
            });
            res.json({
                success: true,
                data: client,
            });
        }
        catch (error) {
            console.error('Error updating client:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            await server_1.prisma.clients.delete({
                where: { id: Number(id) },
            });
            res.json({
                success: true,
                message: 'Client supprimé',
            });
        }
        catch (error) {
            console.error('Error deleting client:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async getLoyaltyPoints(req, res) {
        try {
            const { id } = req.params;
            const client = await server_1.prisma.clients.findUnique({
                where: { id: Number(id) },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    loyalty_points: true,
                },
            });
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé',
                });
            }
            res.json({
                success: true,
                data: {
                    clientId: client.id,
                    clientName: `${client.first_name} ${client.last_name}`,
                    points: client.loyalty_points || 0,
                },
            });
        }
        catch (error) {
            console.error('Error getting loyalty points:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
    async getDebts(req, res) {
        try {
            const { id } = req.params;
            const debts = await server_1.prisma.client_debt.findMany({
                where: { client_id: Number(id) },
                orderBy: { created_at: 'desc' },
            });
            res.json({
                success: true,
                data: debts,
            });
        }
        catch (error) {
            console.error('Error getting client debts:', error);
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}
exports.ClientController = ClientController;
exports.clientController = new ClientController();
