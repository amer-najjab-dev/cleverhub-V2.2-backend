"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeService = void 0;
const server_1 = require("../../server");
const bcrypt = __importStar(require("bcrypt"));
exports.employeeService = {
    getAll: async (pharmacyId) => {
        return await server_1.prisma.employees.findMany({
            where: { pharmacy_id: pharmacyId },
            include: {
                users: {
                    select: { id: true, full_name: true, email: true }
                }
            }
        });
    },
    create: async (pharmacyId, data) => {
        const hashedPassword = await bcrypt.hash(data.password || 'empleado123', 10);
        const user = await server_1.prisma.users.create({
            data: {
                email: data.email,
                password: hashedPassword,
                full_name: data.full_name,
                role: 'EMPLOYEE',
                pharmacy_id: pharmacyId,
                is_active: true
            }
        });
        const employee = await server_1.prisma.employees.create({
            data: {
                user_id: user.id,
                pharmacy_id: pharmacyId,
                phone: data.phone,
                address: data.address,
                cni: data.cni,
                birth_date: data.birth_date ? new Date(data.birth_date) : null,
                marital_status: data.marital_status,
                children_count: data.children_count || 0,
                vacation_days: 22,
                vacation_days_used: 0,
                updated_at: new Date()
            },
            include: { users: true }
        });
        return employee;
    },
    delete: async (id, pharmacyId) => {
        const employee = await server_1.prisma.employees.findFirst({
            where: { id, pharmacy_id: pharmacyId }
        });
        if (!employee)
            throw new Error('Empleado no encontrado');
        await server_1.prisma.shift_assignments.deleteMany({ where: { employee_id: id } });
        await server_1.prisma.employees.delete({ where: { id } });
        await server_1.prisma.users.delete({ where: { id: employee.user_id } });
        return { success: true };
    }
};
