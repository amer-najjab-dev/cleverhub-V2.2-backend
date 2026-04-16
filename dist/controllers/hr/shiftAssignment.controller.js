"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftAssignmentController = void 0;
const shiftAssignment_service_1 = require("../../services/shiftAssignment.service");
exports.shiftAssignmentController = {
    assignRange: async (req, res) => {
        try {
            const { employeeId, shiftId, startDate, endDate } = req.body;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
            }
            const assignments = await shiftAssignment_service_1.shiftAssignmentService.assignRange(employeeId, shiftId, startDate, endDate);
            res.json({ success: true, data: assignments });
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getCoverage: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const pharmacyId = req.user?.pharmacyId;
            if (!pharmacyId) {
                return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
            }
            const assignments = await shiftAssignment_service_1.shiftAssignmentService.getByDateRange(pharmacyId, startDate, endDate);
            res.json({ success: true, data: assignments });
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
