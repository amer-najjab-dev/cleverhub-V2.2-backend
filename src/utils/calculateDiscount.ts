/**
 * Tipos de descuento soportados
 */
export type DiscountType = "percentage" | "fixed";

/**
 * Configuración de descuento
 */
export interface DiscountConfig {
  type: DiscountType;
  value: number; // porcentaje (0–100) o importe fijo
}

/**
 * Calcula el descuento aplicado a un precio
 */
export const calculateDiscount = (
  price: number,
  quantity: number,
  discount?: DiscountConfig
) => {
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
