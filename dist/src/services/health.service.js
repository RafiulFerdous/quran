import { prisma } from "../db/client.js";
export async function pingDatabase() {
    await prisma.$queryRaw `SELECT 1`;
}
