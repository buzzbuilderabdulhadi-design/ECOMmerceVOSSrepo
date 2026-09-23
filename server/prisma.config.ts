import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma config for ZOYA GOODS server.
// Kept on Prisma ORM v6: Prisma v7 does not ship a MongoDB connector yet, so
// v6.19.x (the last supported v6 release for MongoDB) is the correct current
// version for this project. The datasource URL is declared in schema.prisma
// via env("MONGODB_URI") and the .env file at server/.env.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});