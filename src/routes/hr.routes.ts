import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { employeeController } from '../controllers/hr/employee.controller';
import { shiftController } from '../controllers/hr/shift.controller';
import { timeOffController } from '../controllers/hr/timeoff.controller';
import { guardController } from '../controllers/hr/guard.controller';
import { holidayController } from '../controllers/hr/holiday.controller';
import { coverageController } from '../controllers/hr/coverage.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// ==================== EMPLEADOS ====================
router.get('/employees', requireRole(['admin']), employeeController.getAll);
router.get('/employees/:id', requireRole(['admin']), employeeController.getById);
router.post('/employees', requireRole(['admin']), employeeController.create);
router.put('/employees/:id', requireRole(['admin']), employeeController.update);
router.delete('/employees/:id', requireRole(['admin']), employeeController.delete);
router.put('/employees/:id/shift', requireRole(['admin']), employeeController.assignShift);
router.put('/shifts/:id/config', requireRole(['admin']), shiftController.updateConfig);

// ==================== ASIGNACIONES DE TURNO ====================
router.get('/shift-assignments', requireRole(['admin']), employeeController.getAssignments);
router.post('/shift-assignments', requireRole(['admin']), employeeController.assignShift);

// ==================== TURNOS ====================
router.get('/shifts', shiftController.getAll);
router.post('/shifts', requireRole(['admin']), shiftController.create);
router.put('/shifts/:id', requireRole(['admin']), shiftController.update);
router.delete('/shifts/:id', requireRole(['admin']), shiftController.delete);

// ==================== SOLICITUDES ====================
router.get('/time-off-requests', timeOffController.getAll);
router.post('/time-off-requests', timeOffController.create);
router.patch('/time-off-requests/:id/approve', requireRole(['admin']), timeOffController.approve);
router.patch('/time-off-requests/:id/reject', requireRole(['admin']), timeOffController.reject);
router.get('/time-off-requests/balance', timeOffController.getBalance);

// ==================== GUARDIAS ====================
router.get('/guard-periods', guardController.getPeriods);
router.post('/guard-periods', requireRole(['admin']), guardController.createPeriod);
router.delete('/guard-periods/:id', requireRole(['admin']), guardController.deletePeriod);

// ==================== FESTIVOS ====================
router.get('/holidays', holidayController.getAll);
router.post('/holidays', requireRole(['admin']), holidayController.create);
router.delete('/holidays/:id', requireRole(['admin']), holidayController.delete);

// ==================== COBERTURA ====================
router.get('/coverage', coverageController.getCoverage);

export default router;