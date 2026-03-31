// src/types/express.d.ts
import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        pharmacyId: number | null;  // ← Permitir null
      };
      pharmacyFilter?: {
        pharmacy_id?: number;
      };
    }
  }
}

export {};