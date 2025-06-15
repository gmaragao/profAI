import { PrismaClient } from "@/generated/prisma";

// src/lib/prisma.ts
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  console.log("Initializing Prisma Client...");

  if (!prisma) {
    prisma = new PrismaClient();
  }

  return prisma;
}
