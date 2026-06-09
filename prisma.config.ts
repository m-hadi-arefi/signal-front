// @ts-ignore — Prisma 7 defineConfig types lag behind runtime support for adapter
import { defineConfig } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    adapter: () =>
      new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});
