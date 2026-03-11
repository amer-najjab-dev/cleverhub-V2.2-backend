"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductController = void 0;
const server_1 = require("../server");
class ProductController {
    async listar(req, res) {
        try {
            const { q, category, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = { active: true };
            if (q) {
                where.name = { contains: q, mode: 'insensitive' };
            }
            if (category) {
                where.category = category;
            }
            const [products, total] = await Promise.all([
                server_1.prisma.products.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { name: 'asc' }
                }),
                server_1.prisma.products.count({ where })
            ]);
            res.json({
                success: true,
                data: products,
                meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const product = await server_1.prisma.products.findUnique({
                where: { id: parseInt(id) }
            });
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            res.json({ success: true, data: product });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async buscar(req, res) {
        try {
            const { q } = req.query;
            if (!q)
                return res.json({ success: true, data: [] });
            const products = await server_1.prisma.products.findMany({
                where: {
                    name: { contains: q, mode: 'insensitive' },
                    active: true
                },
                take: 20,
                orderBy: { name: 'asc' }
            });
            res.json({ success: true, data: products });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    async getPriceHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await server_1.prisma.price_history.findMany({
                where: { product_id: parseInt(id) },
                orderBy: { date: 'desc' },
                take: 10
            });
            res.json({ success: true, data: history });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.ProductController = ProductController;
exports.productController = new ProductController();
