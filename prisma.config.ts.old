import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: {
    kind: 'file',
    filePath: 'prisma/schema.prisma',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});