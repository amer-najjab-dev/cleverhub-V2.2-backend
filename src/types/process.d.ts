// src/types/process.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DATABASE_URL: string;
    SESSION_SECRET: string;
    JWT_SECRET?: string;
    [key: string]: string | undefined;
  }
}