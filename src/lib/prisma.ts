import { PrismaClient } from '@prisma/client';

// Solo para depuración: Ver qué está leyendo el proceso antes de instanciar
console.log("🔍 DATABASE_URL actual en el proceso:", process.env.DATABASE_URL ? "Configurada (OK)" : "VACÍA (ERROR)");

export const prisma = new PrismaClient();