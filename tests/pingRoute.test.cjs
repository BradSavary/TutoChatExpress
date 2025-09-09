// Exemple de test d'une route Express avec Supertest
const request = require('supertest');
const express = require('express');

const app = express();
app.get('/ping', (req, res) => res.status(200).json({ message: 'pong' }));

describe('GET /ping', () => {
  it('retourne 200 et le message pong', async () => {
    const res = await request(app).get('/ping');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'pong' });
  });
});