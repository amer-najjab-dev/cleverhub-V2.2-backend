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
    // ========== HEALTH RECORDS ==========
    async getHealthRecords(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const records = await server_1.prisma.health_records.findMany({
                where: { client_id: clientId },
                orderBy: { record_date: 'desc' }
            });
            res.json({
                success: true,
                data: records
            });
        }
        catch (error) {
            console.error('Error getting health records:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async createHealthRecord(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const { glucoseLevel, bloodPressureSystolic, bloodPressureDiastolic, weight, heartRate, recordDate, notes } = req.body;
            // Calcular estados
            let glucoseStatus;
            if (glucoseLevel) {
                if (glucoseLevel < 0.7)
                    glucoseStatus = 'baja';
                else if (glucoseLevel > 1.1)
                    glucoseStatus = 'alta';
                else
                    glucoseStatus = 'normal';
            }
            let bloodPressureStatus;
            if (bloodPressureSystolic && bloodPressureDiastolic) {
                if (bloodPressureSystolic < 9 && bloodPressureDiastolic < 6)
                    bloodPressureStatus = 'baja';
                else if (bloodPressureSystolic > 14 || bloodPressureDiastolic > 9)
                    bloodPressureStatus = 'alta';
                else if (bloodPressureSystolic <= 12 && bloodPressureDiastolic <= 8)
                    bloodPressureStatus = 'ideal';
                else
                    bloodPressureStatus = 'normal';
            }
            let heartRateStatus;
            if (heartRate) {
                if (heartRate < 60)
                    heartRateStatus = 'baja';
                else if (heartRate > 100)
                    heartRateStatus = 'alta';
                else
                    heartRateStatus = 'normal';
            }
            const record = await server_1.prisma.health_records.create({
                data: {
                    client_id: clientId,
                    glucose_level: glucoseLevel,
                    blood_pressure_systolic: bloodPressureSystolic,
                    blood_pressure_diastolic: bloodPressureDiastolic,
                    weight,
                    heart_rate: heartRate,
                    record_date: new Date(recordDate),
                    notes,
                    glucose_status: glucoseStatus,
                    blood_pressure_status: bloodPressureStatus,
                    heart_rate_status: heartRateStatus
                }
            });
            res.json({
                success: true,
                data: record
            });
        }
        catch (error) {
            console.error('Error creating health record:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getHealthStats(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const records = await server_1.prisma.health_records.findMany({
                where: { client_id: clientId },
                orderBy: { record_date: 'desc' }
            });
            if (records.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        totalRecords: 0,
                        lastRecord: null,
                        glucose: { average: null, lastValue: null, trend: 'stable' },
                        bloodPressure: { systolicAverage: null, diastolicAverage: null, lastValues: null },
                        weight: { average: null, lastValue: null, trend: 'stable' },
                        heartRate: { average: null, lastValue: null, trend: 'stable' }
                    }
                });
            }
            // Calcular estadísticas con tipos explícitos
            const glucoseValues = records
                .filter((r) => r.glucose_level)
                .map((r) => Number(r.glucose_level));
            const systolicValues = records
                .filter((r) => r.blood_pressure_systolic)
                .map((r) => r.blood_pressure_systolic);
            const diastolicValues = records
                .filter((r) => r.blood_pressure_diastolic)
                .map((r) => r.blood_pressure_diastolic);
            const weightValues = records
                .filter((r) => r.weight)
                .map((r) => Number(r.weight));
            const heartRateValues = records
                .filter((r) => r.heart_rate)
                .map((r) => r.heart_rate);
            // Función para calcular promedio con tipado explícito
            const calculateAverage = (values) => {
                if (values.length === 0)
                    return null;
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            };
            // Función para calcular tendencia con tipado explícito
            const calculateTrend = (values) => {
                if (values.length < 2)
                    return 'stable';
                if (values[0] > values[1])
                    return 'up';
                if (values[0] < values[1])
                    return 'down';
                return 'stable';
            };
            const stats = {
                totalRecords: records.length,
                lastRecord: records[0],
                glucose: {
                    average: calculateAverage(glucoseValues),
                    lastValue: glucoseValues[0] || null,
                    trend: calculateTrend(glucoseValues)
                },
                bloodPressure: {
                    systolicAverage: calculateAverage(systolicValues),
                    diastolicAverage: calculateAverage(diastolicValues),
                    lastValues: records[0] ? {
                        systolic: records[0].blood_pressure_systolic,
                        diastolic: records[0].blood_pressure_diastolic
                    } : null
                },
                weight: {
                    average: calculateAverage(weightValues),
                    lastValue: weightValues[0] || null,
                    trend: calculateTrend(weightValues)
                },
                heartRate: {
                    average: calculateAverage(heartRateValues),
                    lastValue: heartRateValues[0] || null,
                    trend: calculateTrend(heartRateValues)
                }
            };
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error getting health stats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.ClientController = ClientController;
exports.clientController = new ClientController();
