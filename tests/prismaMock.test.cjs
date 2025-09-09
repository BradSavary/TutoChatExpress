const { createMessage, prisma } = require('./prismaMock.cjs');

describe('createMessage', () => {
  it('appelle prisma.message.create avec les bons paramètres', async () => {
    const data = { user: 'Bob', text: 'Hello' };
    prisma.message.create.mockResolvedValue({ id: 1, ...data });
    const result = await createMessage(data);
    expect(prisma.message.create).toHaveBeenCalledWith({ data });
    expect(result).toEqual({ id: 1, ...data });
  });
});