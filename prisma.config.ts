import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config({
  path:
    process.env.NODE_ENV === 'dev'
      ? '.env.dev'
      : process.env.DOTENV_CONFIG_PATH || '.env.dev',
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
