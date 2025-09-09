// Exemple de mock Prisma pour tester une fonction d'accès aux données
const prisma = {
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

async function createMessage(data) {
  return prisma.message.create({ data });
}

module.exports = { createMessage, prisma };