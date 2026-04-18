import { prisma } from "../db/client.js";

export async function pingDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
