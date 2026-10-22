import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config({
  path:
    process.env.NODE_ENV === 'dev'
      ? '.env.dev'
      : '.env',
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
