"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryService = void 0;
const server_1 = require("../server");
exports.deliveryService = {
    async registerDelivery(data) {
        let totalAmount = 0;
        const itemsWithSubtotal = data.items.map(item => {
            const subtotal = item.quantity * item.unit_cost_pph;
            totalAmount += subtotal;
            return { ...item, subtotal };
        });
        const result = await server_1.prisma.$transaction(async (tx) => {
            const deliveryNote = await tx.delivery_note.create({
                data: {
                    note_number: data.note_number,
                    supplier_id: data.supplier_id,
                    bl_number: data.bl_number,
                    reception_date: data.reception_date,
                    total_amount: totalAmount,
                    total_items: data.items.length,
                    notes: data.notes,
                    received_by: data.received_by,
                    payment_status: 'pending'
                }
            });
            for (const item of itemsWithSubtotal) {
                await tx.delivery_note_items.create({
                    data: {
                        delivery_note_id: deliveryNote.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_cost_pph: item.unit_cost_pph,
                        suggested_ppv: item.suggested_ppv,
                        expiration_date: item.expiration_date,
                        batch_number: item.batch_number,
                        subtotal: item.subtotal
                    }
                });
                await tx.inventory_lots.create({
                    data: {
                        product_id: item.product_id,
                        pharmacy_id: data.pharmacy_id,
                        batch_number: item.batch_number || `BATCH-${Date.now()}`,
                        quantity: item.quantity,
                        expiry_date: item.expiration_date
                    }
                });
                await tx.products.update({
                    where: { id: item.product_id },
                    data: { pricePPH: item.unit_cost_pph }
                });
            }
            const dueDate = data.due_date || new Date();
            if (!data.due_date) {
                dueDate.setDate(dueDate.getDate() + 30);
            }
            const obligation = await tx.payment_obligation.create({
                data: {
                    delivery_note_id: deliveryNote.id,
                    supplier_id: data.supplier_id,
                    total_amount: totalAmount,
                    paid_amount: 0,
                    pending_amount: totalAmount,
                    due_date: dueDate,
                    status: 'pending',
                    payment_terms: data.payment_terms || '30 días'
                }
            });
            return { deliveryNote, obligation };
        });
        return result;
    },
    async registerObligationPayment(data) {
        const result = await server_1.prisma.$transaction(async (tx) => {
            const payment = await tx.obligation_payment.create({
                data: {
                    obligation_id: data.obligation_id,
                    amount: data.amount,
                    payment_method: data.payment_method,
                    reference: data.reference,
                    notes: data.notes
                }
            });
            const obligation = await tx.payment_obligation.findUnique({
                where: { id: data.obligation_id }
            });
            if (!obligation)
                throw new Error('Obligación no encontrada');
            const newPaidAmount = Number(obligation.paid_amount) + data.amount;
            const newPendingAmount = Number(obligation.total_amount) - newPaidAmount;
            const newStatus = newPendingAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'pending';
            const updatedObligation = await tx.payment_obligation.update({
                where: { id: data.obligation_id },
                data: {
                    paid_amount: newPaidAmount,
                    pending_amount: newPendingAmount,
                    status: newStatus
                }
            });
            if (newStatus === 'paid') {
                await tx.delivery_note.update({
                    where: { id: obligation.delivery_note_id },
                    data: {
                        payment_status: 'paid',
                        is_paid: true,
                        paid_amount: newPaidAmount,
                        paid_date: new Date()
                    }
                });
            }
            else if (newPaidAmount > 0) {
                await tx.delivery_note.update({
                    where: { id: obligation.delivery_note_id },
                    data: {
                        payment_status: 'partial',
                        paid_amount: newPaidAmount
                    }
                });
            }
            return { payment, obligation: updatedObligation };
        });
        return result;
    },
    async getSupplierObligations(supplierId) {
        return await server_1.prisma.payment_obligation.findMany({
            where: { supplier_id: supplierId },
            include: {
                delivery_note: {
                    select: {
                        note_number: true,
                        reception_date: true,
                        items: {
                            select: {
                                quantity: true,
                                product: { select: { name: true } }
                            }
                        }
                    }
                },
                payments: true
            },
            orderBy: { due_date: 'asc' }
        });
    }
};
