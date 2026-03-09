"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productController = exports.ProductoController = void 0;
const data_source_1 = require("../data-source");
const Product_1 = require("../entities/Product");
const typeorm_1 = require("typeorm");
class ProductoController {
    async listar(req, res) {
        try {
            const products = await data_source_1.AppDataSource.getRepository(Product_1.Product).find();
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = parseInt(req.params.id);
            const product = await data_source_1.AppDataSource.getRepository(Product_1.Product).findOne({
                where: { id },
                relations: ['priceHistories', 'inventoryLots', 'stockMovements', 'stockMovements.lot']
            });
            if (!product)
                return res.status(404).json({ error: 'Producto no encontrado' });
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async buscar(req, res) {
        try {
            const query = req.query.q || '';
            const where = query
                ? [
                    { name: (0, typeorm_1.Like)(`%${query}%`) },
                    { description: (0, typeorm_1.Like)(`%${query}%`) },
                    { category: (0, typeorm_1.Like)(`%${query}%`) },
                    { sku: (0, typeorm_1.Like)(`%${query}%`) }
                ]
                : {};
            const products = await data_source_1.AppDataSource.getRepository(Product_1.Product).find({
                where,
                order: { name: 'ASC' }
            });
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    // Método adicional si quieres obtener solo el historial de precios de un producto
    async getPriceHistory(req, res) {
        try {
            const id = parseInt(req.params.id);
            const priceHistory = await data_source_1.AppDataSource.getRepository('PriceHistory').find({
                where: { product: { id } },
                order: { date: 'DESC' }
            });
            res.json(priceHistory);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
exports.ProductoController = ProductoController;
exports.productController = new ProductoController();
