"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscount = void 0;
/**
 * Calcula el descuento aplicado a un precio
 */
const calculateDiscount = (price, quantity, discount) => {
    const subtotal = price * quantity;
    if (!discount) {
        return {
            subtotal,
            discountAmount: 0,
            total: subtotal
        };
    }
    let discountAmount = 0;
    if (discount.type === "percentage") {
        discountAmount = (subtotal * discount.value) / 100;
    }
    if (discount.type === "fixed") {
        discountAmount = discount.value;
    }
    // Nunca permitir descuento mayor que el subtotal
    if (discountAmount > subtotal) {
        discountAmount = subtotal;
    }
    return {
        subtotal,
        discountAmount,
        total: subtotal - discountAmount
    };
};
exports.calculateDiscount = calculateDiscount;
