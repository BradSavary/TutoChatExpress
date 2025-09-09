const formatMessage = require('./formatMessage.cjs');

describe('formatMessage', () => {
  it('retourne un objet message formaté', () => {
    const user = 'Alice';
    const text = 'Bonjour';
    const result = formatMessage(user, text);
    expect(result).toHaveProperty('user', user);
    expect(result).toHaveProperty('text', text);
    expect(result).toHaveProperty('date');
    expect(typeof result.date).toBe('string');
  });
});