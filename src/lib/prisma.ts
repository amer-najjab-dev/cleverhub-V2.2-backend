import { PrismaClient } from '@prisma/client';

// Log para saber qué está viendo el proceso de Node ANTES de que Prisma actúe
console.log("🔍 [DIAGNÓSTICO PRISMA] DATABASE_URL en process.env:", process.env.DATABASE_URL ? "DETECTADA" : "NO DETECTADA");

// Dejamos que Prisma busque DATABASE_URL por su cuenta en el entorno
export const prisma = new PrismaClient();