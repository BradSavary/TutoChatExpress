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

/**
 * Supprime tous les anciens messages de tests (pour éviter l'accumulation)
 */
export async function cleanupOldTestMessages() {
  await prisma.message.deleteMany({
    where: {
      OR: [
        { pseudo: { startsWith: 'TestUser_' } },
        { pseudo: { startsWith: 'Alice' } },
        { pseudo: { startsWith: 'Bob' } },
        { content: { contains: 'test' } },
        { content: { contains: 'Test' } }
      ]
    }
  });
  console.log('Anciens messages de test supprimés');
}

/**
 * Supprime tous les utilisateurs de test
 */
export async function cleanupTestUsers() {
  await prisma.user.deleteMany({
    where: {
      OR: [
        { pseudo: { startsWith: 'TestUser_' } },
        { email: { endsWith: '@test.local' } }
      ]
    }
  });
  console.log('Utilisateurs de test supprimés');
}
