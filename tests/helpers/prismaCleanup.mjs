// tests/helpers/prismaCleanup.cjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Supprime les messages de test par pseudo ou contenu
 * @param {Object} filter - ex: { pseudo: 'Alice' } ou { content: { contains: 'Hello world!' } }
 */
export async function cleanupMessages(filter) {
  await prisma.message.deleteMany({ where: filter });
}
