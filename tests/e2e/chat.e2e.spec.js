// tests/e2e/chat.e2e.spec.js
import { test, expect } from '@playwright/test';

// Adapter l'URL si besoin
const APP_URL = 'http://localhost:3000';

test.describe('Chat E2E', () => {
  test('Un utilisateur peut ouvrir le chat, saisir un pseudo et envoyer un message', async ({ page }) => {
    await page.goto(APP_URL);
    // Exemple: supposez un input pour le pseudo et un bouton "Entrer"
  await page.fill('#pseudo-input', 'Alice');
  await page.click('#pseudo-form button[type="submit"]');
  // Saisir un message
  await page.fill('#input', 'Hello world!');
  await page.click('#form button[type="submit"]');
  // Vérifier qu'au moins un message correspond exactement à "Alice : Hello world!"
  const messages = await page.locator('#messages li').allTextContents();
  console.log('MESSAGES AFFICHÉS APRÈS ENVOI:', messages);
  expect(messages).toContainEqual(expect.stringContaining('Alice : Hello world!'));
  });

  test('Deux utilisateurs voient le message envoyé', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    await page1.goto(APP_URL);
    await page2.goto(APP_URL);
  await page1.fill('#pseudo-input', 'Alice');
  await page1.click('#pseudo-form button[type="submit"]');
  await page2.fill('#pseudo-input', 'Bob');
  await page2.click('#pseudo-form button[type="submit"]');
  await page1.fill('#input', 'Salut Bob!');
  await page1.click('#form button[type="submit"]');
  // Les deux doivent voir le message exact
  const messages1 = await page1.locator('#messages li').allTextContents();
  const messages2 = await page2.locator('#messages li').allTextContents();
  expect(messages1).toContainEqual(expect.stringContaining('Alice : Salut Bob!'));
  expect(messages2).toContainEqual(expect.stringContaining('Alice : Salut Bob!'));
    await context1.close();
    await context2.close();
  });
});
