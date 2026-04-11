"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const employee_controller_1 = require("../controllers/hr/employee.controller");
const shift_controller_1 = require("../controllers/hr/shift.controller");
const timeoff_controller_1 = require("../controllers/hr/timeoff.controller");
const guard_controller_1 = require("../controllers/hr/guard.controller");
const holiday_controller_1 = require("../controllers/hr/holiday.controller");
const coverage_controller_1 = require("../controllers/hr/coverage.controller");
const shiftAssignment_controller_1 = require("../controllers/hr/shiftAssignment.controller");
const router = (0, express_1.Router)();
// Todas las rutas requieren autenticación
router.use(auth_1.requireAuth);
// ==================== EMPLEADOS ====================
router.get('/employees', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.getAll);
router.get('/employees/:id', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.getById);
router.post('/employees', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.create);
router.put('/employees/:id', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.update);
router.delete('/employees/:id', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.delete);
router.put('/employees/:id/shift', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.assignShift);
//router.put('/shifts/:id/config', requireRole(['admin']), shiftController.updateConfig);
router.delete('/shift-assignments', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.removeShiftAssignment);
// ==================== ASIGNACIONES DE TURNO ====================
router.get('/shift-assignments', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.getAssignments);
router.post('/shift-assignments', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.assignShift);
router.post('/shift-assignments/range', (0, rbac_1.requireRole)(['admin']), shiftAssignment_controller_1.shiftAssignmentController.assignRange);
router.get('/shift-assignments/coverage', (0, rbac_1.requireRole)(['admin']), shiftAssignment_controller_1.shiftAssignmentController.getCoverage);
// ==================== TURNOS ====================
router.get('/shifts', shift_controller_1.shiftController.getAll);
router.post('/shifts', (0, rbac_1.requireRole)(['admin']), shift_controller_1.shiftController.create);
router.put('/shifts/:id', (0, rbac_1.requireRole)(['admin']), shift_controller_1.shiftController.update);
router.delete('/shifts/:id', (0, rbac_1.requireRole)(['admin']), shift_controller_1.shiftController.delete);
router.patch('/shifts/:id/config', (0, rbac_1.requireRole)(['admin']), shift_controller_1.shiftController.updateShiftConfig);
// ==================== SOLICITUDES ====================
router.get('/time-off-requests', timeoff_controller_1.timeOffController.getAll);
router.post('/time-off-requests', timeoff_controller_1.timeOffController.create);
router.patch('/time-off-requests/:id/approve', (0, rbac_1.requireRole)(['admin']), timeoff_controller_1.timeOffController.approve);
router.patch('/time-off-requests/:id/reject', (0, rbac_1.requireRole)(['admin']), timeoff_controller_1.timeOffController.reject);
router.get('/time-off-requests/balance', timeoff_controller_1.timeOffController.getBalance);
// ==================== GUARDIAS ====================
router.get('/guard-periods', guard_controller_1.guardController.getPeriods);
router.post('/guard-periods', (0, rbac_1.requireRole)(['admin']), guard_controller_1.guardController.createPeriod);
router.delete('/guard-periods/:id', (0, rbac_1.requireRole)(['admin']), guard_controller_1.guardController.deletePeriod);
// ==================== FESTIVOS ====================
router.get('/holidays', holiday_controller_1.holidayController.getAll);
router.post('/holidays', (0, rbac_1.requireRole)(['admin']), holiday_controller_1.holidayController.create);
router.delete('/holidays/:id', (0, rbac_1.requireRole)(['admin']), holiday_controller_1.holidayController.delete);
// ==================== COBERTURA ====================
router.get('/coverage', coverage_controller_1.coverageController.getCoverage);
router.post('/employees/assign-shift-range', (0, rbac_1.requireRole)(['admin']), employee_controller_1.employeeController.assignShiftRange);
exports.default = router;
