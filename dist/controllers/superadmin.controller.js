"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminController = exports.SuperAdminController = void 0;
exports.checkExpirations = checkExpirations;
const server_1 = require("../server");
const date_fns_1 = require("date-fns");
// Función auxiliar para logging de acciones de administrador
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
    try {
        await server_1.prisma.adminLog.create({
            data: {
                admin_id: adminId,
                action,
                target_type: targetType,
                target_id: targetId,
                details
            }
        });
    }
    catch (error) {
        console.error('Error logging admin action:', error);
    }
};
// ==========================================
// FUNCIÓN INDEPENDIENTE PARA CHECK EXPIRATIONS
// ==========================================
async function checkExpirations() {
    const today = new Date();
    const days30 = (0, date_fns_1.addDays)(today, 30);
    const days7 = (0, date_fns_1.addDays)(today, 7);
    // Suscripciones que expiran en 30 días
    const expiring30 = await server_1.prisma.subscription.findMany({
        where: {
            end_date: { lte: days30, gt: days7 },
            status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
        },
        include: { pharmacy: true }
    });
    // Suscripciones que expiran en 7 días
    const expiring7 = await server_1.prisma.subscription.findMany({
        where: {
            end_date: { lte: days7, gt: today },
            status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
        },
        include: { pharmacy: true }
    });
    // Suscripciones expiradas
    const expired = await server_1.prisma.subscription.findMany({
        where: {
            end_date: { lt: today },
            status: { in: ['ACTIVE', 'TRIAL', 'GRACE_PERIOD'] }
        },
        include: { pharmacy: true }
    });
    // Enviar recordatorios por email (30 días)
    for (const sub of expiring30) {
        // TODO: Implementar envío de email
        if (sub.pharmacy) {
            console.log(`📧 Recordatorio: ${sub.pharmacy.email} - Licencia expira en 30 días`);
        }
    }
    // Crear notificaciones críticas (7 días)
    for (const sub of expiring7) {
        await server_1.prisma.systemNotification.create({
            data: {
                target: 'SPECIFIC_PHARMACY',
                pharmacy_id: sub.pharmacy_id,
                title: '⚠️ Tu licencia expira pronto',
                message: `Tu licencia expirará el ${sub.end_date.toLocaleDateString()}. Renueva ahora para evitar interrupciones.`,
                action_url: '/dashboard/subscription/renew',
                created_by: 1 // SUPER_ADMIN ID
            }
        });
    }
    // Suspender expiradas
    for (const sub of expired) {
        await server_1.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'SUSPENDED' }
        });
        await server_1.prisma.systemNotification.create({
            data: {
                target: 'SPECIFIC_PHARMACY',
                pharmacy_id: sub.pharmacy_id,
                title: '❌ Licencia suspendida',
                message: 'Tu licencia ha expirado. Contacta al administrador para reactivar tu cuenta.',
                action_url: '/dashboard/subscription/renew',
                created_by: 1
            }
        });
    }
    return {
        expiring30: expiring30.length,
        expiring7: expiring7.length,
        expired: expired.length
    };
}
class SuperAdminController {
    // ==========================================
    // GESTIÓN DE SUSCRIPCIONES
    // ==========================================
    // Obtener todas las suscripciones con filtros
    async getSubscriptions(req, res) {
        try {
            const { status, plan, search } = req.query;
            const where = {};
            if (status)
                where.status = status;
            if (plan)
                where.plan = plan;
            if (search) {
                where.pharmacy = {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { license: { contains: search, mode: 'insensitive' } }
                    ]
                };
            }
            const subscriptions = await server_1.prisma.subscription.findMany({
                where,
                include: {
                    pharmacy: {
                        select: { id: true, name: true, license: true, email: true, phone: true }
                    },
                    payments: {
                        take: 1,
                        orderBy: { created_at: 'desc' }
                    }
                },
                orderBy: { end_date: 'asc' }
            });
            res.json({ success: true, data: subscriptions });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Obtener suscripción de una farmacia específica
    async getPharmacySubscription(req, res) {
        try {
            const { pharmacyId } = req.params;
            const subscription = await server_1.prisma.subscription.findUnique({
                where: { pharmacy_id: parseInt(pharmacyId) },
                include: {
                    pharmacy: true,
                    payments: { orderBy: { created_at: 'desc' } }
                }
            });
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
            }
            res.json({ success: true, data: subscription });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Crear o actualizar suscripción (inicial)
    async createSubscription(req, res) {
        try {
            const { pharmacy_id, plan, trial_days = 30 } = req.body;
            // Verificar que la farmacia existe
            const pharmacy = await server_1.prisma.pharmacy.findUnique({
                where: { id: pharmacy_id }
            });
            if (!pharmacy) {
                return res.status(404).json({ success: false, message: 'Farmacia no encontrada' });
            }
            const startDate = new Date();
            const endDate = (0, date_fns_1.addDays)(startDate, trial_days);
            const subscription = await server_1.prisma.subscription.upsert({
                where: { pharmacy_id },
                update: {
                    plan,
                    start_date: startDate,
                    end_date: endDate,
                    status: 'TRIAL',
                    trial_end_date: endDate
                },
                create: {
                    pharmacy_id,
                    plan,
                    start_date: startDate,
                    end_date: endDate,
                    status: 'TRIAL',
                    trial_end_date: endDate
                }
            });
            // Registrar en log
            await logAdminAction(req.user?.id, 'UPDATE_SUBSCRIPTION', 'subscription', subscription.id, { action: 'create', plan, trial_days });
            res.status(201).json({ success: true, data: subscription });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Renovar licencia (basado en pago)
    async renewLicense(req, res) {
        try {
            const { pharmacyId, months = 12, amount, paymentMethod, transactionId } = req.body;
            const subscription = await server_1.prisma.subscription.findUnique({
                where: { pharmacy_id: pharmacyId }
            });
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
            }
            // Calcular nueva fecha de expiración
            const currentEndDate = subscription.end_date;
            const newEndDate = (0, date_fns_1.isBefore)(currentEndDate, new Date())
                ? (0, date_fns_1.addDays)(new Date(), months * 30)
                : (0, date_fns_1.addDays)(currentEndDate, months * 30);
            // Actualizar suscripción
            const updated = await server_1.prisma.subscription.update({
                where: { pharmacy_id: pharmacyId },
                data: {
                    end_date: newEndDate,
                    next_billing_date: (0, date_fns_1.addDays)(newEndDate, months * 30),
                    status: 'ACTIVE',
                    updated_at: new Date()
                }
            });
            // Registrar pago
            const payment = await server_1.prisma.paymentLog.create({
                data: {
                    subscription_id: subscription.id,
                    amount,
                    payment_method: paymentMethod,
                    status: 'COMPLETED',
                    transaction_id: transactionId,
                    paid_at: new Date()
                }
            });
            // Registrar en log
            await logAdminAction(req.user?.id, 'RENEW_LICENSE', 'subscription', subscription.id, { months, amount, new_end_date: newEndDate });
            res.json({ success: true, data: { subscription: updated, payment } });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Extender cortesía (7 días manual)
    async extendCourtesy(req, res) {
        try {
            const { pharmacyId, days = 7, reason } = req.body;
            const subscription = await server_1.prisma.subscription.findUnique({
                where: { pharmacy_id: pharmacyId }
            });
            if (!subscription) {
                return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
            }
            const newEndDate = (0, date_fns_1.addDays)(subscription.end_date, days);
            const updated = await server_1.prisma.subscription.update({
                where: { pharmacy_id: pharmacyId },
                data: {
                    end_date: newEndDate,
                    status: subscription.status === 'SUSPENDED' ? 'GRACE_PERIOD' : subscription.status,
                    updated_at: new Date()
                }
            });
            // Registrar en log
            await logAdminAction(req.user?.id, 'EXTEND_COURTESY', 'subscription', subscription.id, { days, reason, new_end_date: newEndDate });
            // Crear notificación para la farmacia
            await server_1.prisma.systemNotification.create({
                data: {
                    target: 'SPECIFIC_PHARMACY',
                    pharmacy_id: pharmacyId,
                    title: 'Extensión de cortesía',
                    message: `Se ha extendido tu licencia por ${days} días como cortesía. Nueva fecha de expiración: 
${newEndDate.toLocaleDateString()}`,
                    action_url: '/dashboard/subscription',
                    created_by: req.user?.id
                }
            });
            res.json({ success: true, data: updated });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // CENTRO DE COMUNICACIÓN
    // ==========================================
    // Broadcast masivo
    async sendBroadcast(req, res) {
        try {
            const { target, title, message, action_url, filters } = req.body;
            const adminId = req.user?.id;
            let pharmacies = [];
            // Filtrar farmacias según target
            switch (target) {
                case 'ALL':
                    pharmacies = await server_1.prisma.pharmacy.findMany({
                        where: { is_active: true }
                    });
                    break;
                case 'ACTIVE':
                    pharmacies = await server_1.prisma.pharmacy.findMany({
                        where: {
                            is_active: true,
                            subscription: { status: 'ACTIVE' }
                        },
                        include: { subscription: true }
                    });
                    break;
                case 'GRACE_PERIOD':
                    pharmacies = await server_1.prisma.pharmacy.findMany({
                        where: {
                            subscription: { status: 'GRACE_PERIOD' }
                        },
                        include: { subscription: true }
                    });
                    break;
                case 'SUSPENDED':
                    pharmacies = await server_1.prisma.pharmacy.findMany({
                        where: {
                            subscription: { status: 'SUSPENDED' }
                        },
                        include: { subscription: true }
                    });
                    break;
                case 'SPECIFIC_PHARMACY':
                    if (filters?.pharmacy_ids) {
                        pharmacies = await server_1.prisma.pharmacy.findMany({
                            where: { id: { in: filters.pharmacy_ids } }
                        });
                    }
                    break;
            }
            // Crear notificación para cada farmacia o una global
            if (target === 'ALL') {
                // Notificación global
                await server_1.prisma.systemNotification.create({
                    data: {
                        target: 'ALL',
                        title,
                        message,
                        action_url,
                        created_by: adminId
                    }
                });
            }
            else {
                // Notificaciones individuales
                for (const pharmacy of pharmacies) {
                    await server_1.prisma.systemNotification.create({
                        data: {
                            target: 'SPECIFIC_PHARMACY',
                            pharmacy_id: pharmacy.id,
                            title,
                            message,
                            action_url,
                            created_by: adminId
                        }
                    });
                }
            }
            // Enviar emails si se solicita
            if (filters?.sendEmail) {
                for (const pharmacy of pharmacies) {
                    // TODO: Implementar envío de email
                    console.log(`📧 Email a ${pharmacy.email}: ${title}`);
                }
            }
            // Registrar en log
            await logAdminAction(adminId, 'SEND_BROADCAST', 'notification', 0, { target, title, recipients: pharmacies.length });
            res.json({
                success: true,
                message: `Broadcast enviado a ${pharmacies.length} farmacias`,
                data: { recipients: pharmacies.length }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // HEALTH CHECK (SEMÁFORO)
    // ==========================================
    async getHealthStatus(req, res) {
        try {
            const today = new Date();
            const weekAgo = (0, date_fns_1.addDays)(today, -7);
            const days10 = (0, date_fns_1.addDays)(today, 10);
            const allPharmacies = await server_1.prisma.pharmacy.findMany({
                include: {
                    subscription: true,
                    _count: {
                        select: { sales: true }
                    }
                }
            });
            const status = {
                green: [], // Activa + ventas recientes
                yellow: [], // Vence < 10 días o sin ventas en 1 semana
                red: [] // Suspendida o sin actividad total
            };
            for (const pharmacy of allPharmacies) {
                const subscription = pharmacy.subscription;
                const hasRecentSales = pharmacy._count.sales > 0;
                const expiringSoon = subscription?.end_date && (0, date_fns_1.isBefore)(subscription.end_date, days10);
                const isSuspended = subscription?.status === 'SUSPENDED';
                if (isSuspended || (!hasRecentSales && pharmacy._count.sales === 0)) {
                    status.red.push({
                        id: pharmacy.id,
                        name: pharmacy.name,
                        license: pharmacy.license,
                        status: isSuspended ? 'SUSPENDED' : 'INACTIVE',
                        last_sale: null,
                        subscription_end: subscription?.end_date
                    });
                }
                else if (expiringSoon || !hasRecentSales) {
                    status.yellow.push({
                        id: pharmacy.id,
                        name: pharmacy.name,
                        license: pharmacy.license,
                        status: expiringSoon ? 'EXPIRING_SOON' : 'NO_RECENT_SALES',
                        subscription_end: subscription?.end_date,
                        total_sales: pharmacy._count.sales
                    });
                }
                else {
                    status.green.push({
                        id: pharmacy.id,
                        name: pharmacy.name,
                        license: pharmacy.license,
                        status: 'ACTIVE',
                        subscription_end: subscription?.end_date,
                        total_sales: pharmacy._count.sales
                    });
                }
            }
            res.json({
                success: true,
                data: {
                    summary: {
                        total: allPharmacies.length,
                        green: status.green.length,
                        yellow: status.yellow.length,
                        red: status.red.length
                    },
                    status
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // CRON JOB ENDPOINT
    // ==========================================
    // Endpoint para cron job (protegido por secret)
    async runExpirationCheck(req, res) {
        try {
            const secret = req.query.secret;
            const CRON_SECRET = process.env.CRON_SECRET;
            if (!CRON_SECRET) {
                console.error('❌ CRON_SECRET no configurado');
                return res.status(500).json({ success: false, message: 'Configuración incorrecta' });
            }
            if (secret !== CRON_SECRET) {
                console.error('❌ Intento de acceso no autorizado al cron');
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            console.log('🕐 Ejecutando checkExpirations programado...');
            const result = await checkExpirations(); // ← Llamada directa a la función
            console.log('✅ checkExpirations completado:', result);
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('❌ Error en checkExpirations:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ==========================================
    // IMPERSONATE (Shadow Login)
    // ==========================================
    async impersonate(req, res) {
        try {
            const { pharmacyId } = req.params;
            const adminId = req.user?.id;
            // Verificar que la farmacia existe
            const pharmacy = await server_1.prisma.pharmacy.findUnique({
                where: { id: parseInt(pharmacyId) }
            });
            if (!pharmacy) {
                return res.status(404).json({ success: false, message: 'Farmacia no encontrada' });
            }
            // Obtener un usuario ADMIN de la farmacia para tomar sus permisos
            const targetUser = await server_1.prisma.users.findFirst({
                where: {
                    pharmacy_id: parseInt(pharmacyId),
                    role: 'ADMIN'
                }
            });
            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'No se encontró un administrador en esta farmacia' });
            }
            // Generar JWT temporal con 1 hora de validez
            const jwt = require('jsonwebtoken');
            const impersonateToken = jwt.sign({
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role,
                pharmacyId: targetUser.pharmacy_id,
                impersonated_by: adminId,
                impersonated_at: new Date().toISOString()
            }, process.env.JWT_SECRET || 'cleverhub-secret-key-2026', { expiresIn: '1h' });
            // Registrar en log de auditoría
            await logAdminAction(adminId, 'IMPERSONATE', 'pharmacy', parseInt(pharmacyId), { target_user: targetUser.email, pharmacy_name: pharmacy.name });
            res.json({
                success: true,
                data: {
                    token: impersonateToken,
                    pharmacy: {
                        id: pharmacy.id,
                        name: pharmacy.name,
                        license: pharmacy.license
                    },
                    expires_in: '1 hour',
                    message: `Sesión iniciada como ${targetUser.email} en ${pharmacy.name}`
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.SuperAdminController = SuperAdminController;
exports.superAdminController = new SuperAdminController();
