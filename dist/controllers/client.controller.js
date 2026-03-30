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
                    include: {
                        sales: {
                            orderBy: { created_at: 'desc' },
                            take: 1,
                            select: {
                                created_at: true
                            }
                        },
                        client_debts: {
                            where: {
                                pending_amount: { gt: 0 }
                            },
                            select: {
                                pending_amount: true
                            }
                        }
                    }
                }),
                server_1.prisma.clients.count({ where }),
            ]);
            // Tipado correcto para el reduce
            const clientsWithDetails = clients.map((client) => ({
                ...client,
                last_purchase_date: client.sales?.[0]?.created_at || null,
                total_debt: client.client_debts?.reduce((sum, debt) => sum + Number(debt.pending_amount), 0) || 0,
                sales: undefined,
                client_debts: undefined
            }));
            res.json({
                success: true,
                data: clientsWithDetails,
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
            const { firstName, lastName, phone, email, dni, ...rest } = req.body;
            // Mapear camelCase a snake_case
            const clientData = {
                first_name: firstName,
                last_name: lastName,
                phone,
                email,
                dni,
                ...rest
            };
            const client = await server_1.prisma.clients.create({
                data: clientData,
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
    async checkCanDelete(req, res) {
        try {
            const id = parseInt(req.params.id);
            // Verificar si el cliente tiene deuda pendiente
            const activeDebt = await server_1.prisma.client_debt.findFirst({
                where: {
                    client_id: id,
                    pending_amount: { gt: 0 }
                }
            });
            const canDelete = !activeDebt;
            res.json({
                success: true,
                data: { canDelete }
            });
        }
        catch (error) {
            console.error('Error checking if client can be deleted:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { firstName, lastName, phone, email, dni, ...rest } = req.body;
            // Mapear camelCase a snake_case
            const clientData = {
                first_name: firstName,
                last_name: lastName,
                phone,
                email,
                dni,
                ...rest
            };
            const client = await server_1.prisma.clients.update({
                where: { id: Number(id) },
                data: clientData,
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
            if (debts.length === 0) {
                return res.json({
                    success: true,
                    data: []
                });
            }
            // Consolidar todas las deudas en una sola
            const totalDebt = debts.reduce((sum, d) => sum + Number(d.total_debt), 0);
            const totalPaid = debts.reduce((sum, d) => sum + Number(d.paid_amount), 0);
            const totalPending = debts.reduce((sum, d) => sum + Number(d.pending_amount), 0);
            // Determinar estado consolidado
            let consolidatedStatus = 'paid';
            if (totalPending > 0 && totalPaid > 0) {
                consolidatedStatus = 'partial';
            }
            else if (totalPending > 0) {
                consolidatedStatus = 'pending';
            }
            const consolidatedDebt = {
                id: debts[0].id,
                client_id: Number(id),
                total_debt: totalDebt,
                paid_amount: totalPaid,
                pending_amount: totalPending,
                status: consolidatedStatus,
                last_payment_date: debts[0].last_payment_date,
                notes: debts.map(d => d.notes).filter(Boolean).join('\n'),
                created_at: debts[0].created_at,
                updated_at: debts[0].updated_at
            };
            res.json({
                success: true,
                data: consolidatedDebt
            });
        }
        catch (error) {
            console.error('Error getting client debts:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    async getClientPurchases(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const purchases = await server_1.prisma.sales.findMany({
                where: { client_id: clientId },
                include: {
                    sale_items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            res.json({
                success: true,
                data: purchases
            });
        }
        catch (error) {
            console.error('Error getting client purchases:', error);
            res.status(500).json({
                success: false,
                message: error.message
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
                    record_date: recordDate ? new Date(recordDate) : new Date(),
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
    async registerDebtPayment(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const { amount, notes } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Monto inválido' });
            }
            let remainingAmount = amount;
            let updatedDebts = [];
            // Obtener todas las deudas activas ordenadas por fecha ASC (FIFO)
            const activeDebts = await server_1.prisma.client_debt.findMany({
                where: {
                    client_id: clientId,
                    pending_amount: { gt: 0 }
                },
                orderBy: { created_at: 'asc' },
                include: {
                    client: true
                }
            });
            if (activeDebts.length === 0) {
                return res.status(404).json({ error: 'No hay deudas pendientes' });
            }
            // Aplicar el pago a las deudas en orden FIFO
            for (const debt of activeDebts) {
                if (remainingAmount <= 0)
                    break;
                const currentPending = Number(debt.pending_amount);
                const currentPaid = Number(debt.paid_amount);
                const currentTotal = Number(debt.total_debt);
                // Calcular cuánto aplicar a esta deuda
                const applyAmount = Math.min(remainingAmount, currentPending);
                const newPaidAmount = currentPaid + applyAmount;
                // ACTUALIZAR client_debt
                await server_1.prisma.client_debt.update({
                    where: { id: debt.id },
                    data: {
                        paid_amount: newPaidAmount,
                        status: newPaidAmount >= currentTotal ? 'paid' : 'partial',
                        updated_at: new Date(),
                        last_payment_date: new Date(),
                        notes: notes ? `${debt.notes || ''}\n${notes}`.trim() : debt.notes
                    }
                });
                // BUSCAR Y ACTUALIZAR LA VENTA ASOCIADA A ESTA DEUDA
                // Buscar la venta con crédito pendiente más antigua
                const venta = await server_1.prisma.sales.findFirst({
                    where: {
                        client_id: clientId,
                        payment_status: { in: ['pending', 'partial'] }, // ← Incluir partial
                        amount_pending: { gt: 0 }
                    },
                    orderBy: { created_at: 'asc' }
                });
                if (venta) {
                    // Limitar el monto a aplicar por el amount_pending de la venta
                    const ventaPending = Number(venta.amount_pending);
                    const amountToApply = Math.min(applyAmount, ventaPending);
                    const newAmountApplied = Number(venta.amount_applied) + amountToApply;
                    const newAmountPending = ventaPending - amountToApply;
                    const newPaymentStatus = newAmountPending === 0 ? 'paid' : 'partial';
                    await server_1.prisma.sales.update({
                        where: { id: venta.id },
                        data: {
                            amount_applied: newAmountApplied,
                            amount_pending: newAmountPending,
                            payment_status: newPaymentStatus,
                            updated_at: new Date()
                        }
                    });
                    // Si el pago no se aplicó completamente a esta venta, continuar con la siguiente
                    remainingAmount = remainingAmount - amountToApply;
                }
                updatedDebts.push({
                    id: debt.id,
                    saleId: venta?.id,
                    appliedAmount: applyAmount,
                    newPaidAmount,
                    totalDebt: currentTotal
                });
            }
            res.json({
                success: true,
                message: `Pago de ${amount} MAD aplicado correctamente`,
                data: {
                    appliedAmount: amount - remainingAmount,
                    remainingAmount: remainingAmount,
                    updatedDebts
                }
            });
        }
        catch (error) {
            console.error('Error registering payment:', error);
            res.status(500).json({ error: error.message || 'Error al registrar el pago' });
        }
    }
    async get_pending_amount(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const activeDebt = await server_1.prisma.client_debt.findFirst({
                where: {
                    client_id: clientId,
                    pending_amount: { gt: 0 }
                },
                orderBy: { created_at: 'desc' }
            });
            const pendingAmount = activeDebt ? Number(activeDebt.pending_amount) : 0;
            res.json({
                success: true,
                data: {
                    clientId,
                    pendingAmount
                }
            });
        }
        catch (error) {
            console.error('Error getting pending amount:', error);
            res.status(500).json({ error: error.message || 'Error al obtener el monto pendiente' });
        }
    }
    async getPendingAmount(req, res) {
        try {
            const clientId = parseInt(req.params.clientId);
            const activeDebt = await server_1.prisma.client_debt.findFirst({
                where: {
                    client_id: clientId,
                    pending_amount: { gt: 0 }
                },
                orderBy: { created_at: 'desc' }
            });
            const pendingAmount = activeDebt ? Number(activeDebt.pending_amount) : 0;
            res.json({
                success: true,
                data: {
                    clientId,
                    pendingAmount
                }
            });
        }
        catch (error) {
            console.error('Error getting pending amount:', error);
            res.status(500).json({ error: error.message || 'Error al obtener el monto pendiente' });
        }
    }
}
exports.ClientController = ClientController;
exports.clientController = new ClientController();
