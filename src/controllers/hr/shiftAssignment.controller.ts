import { Response } from 'express';
import { shiftAssignmentService } from '../../services/shiftAssignment.service';
import { AuthRequest } from '../../middleware/rbac';

export const shiftAssignmentController = {
  assignRange: async (req: AuthRequest, res: Response) => {
    try {
      const { employeeId, shiftId, startDate, endDate } = req.body;
      const pharmacyId = req.user?.pharmacyId;

      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }

      const assignments = await shiftAssignmentService.assignRange(employeeId, shiftId, startDate, endDate);
      res.json({ success: true, data: assignments });
    } catch (error: any) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCoverage: async (req: AuthRequest, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const pharmacyId = req.user?.pharmacyId;

      if (!pharmacyId) {
        return res.status(403).json({ success: false, message: 'Usuario sin farmacia' });
      }

      const assignments = await shiftAssignmentService.getByDateRange(
        pharmacyId,
        startDate as string,
        endDate as string
      );

      res.json({ success: true, data: assignments });
    } catch (error: any) {
      console.error('Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
