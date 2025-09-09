// tests/e2e/chat.e2e.spec.js
import { test, expect } from '@playwright/test';
import { cleanupMessages } from '../helpers/prismaCleanup.mjs';

// Adapter l'URL si besoin
const APP_URL = 'http://localhost:3000';

test.describe('Chat E2E', () => {
  test('Un utilisateur peut ouvrir le chat, saisir un pseudo et envoyer un message', async ({ page }) => {
    await page.goto(APP_URL);
    await page.fill('#login-pseudo', 'Alice');
    await page.fill('#login-password', 'test'); // Assurez-vous que le mot de passe correspond à l'utilisateur Alice
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector('#chat-container', { state: 'visible' });
    await page.fill('#input', 'Hello world!');
    await page.click('#form button[type="submit"]');
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('#messages li')).some(li => li.textContent.includes('Alice : Hello world!'));
    });
    const messages = await page.locator('#messages li').allTextContents();
    console.log('MESSAGES AFFICHÉS APRÈS ENVOI:', messages);
    expect(messages).toContainEqual(expect.stringContaining('Alice : Hello world!'));
    await cleanupMessages({ pseudo: 'Alice', content: 'Hello world!' });
  });

  test('Deux utilisateurs voient le message envoyé', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    await page1.goto(APP_URL);
    await page2.goto(APP_URL);
    await page1.fill('#login-pseudo', 'Alice');
    await page1.fill('#login-password', 'test');
    await page1.click('#login-form button[type="submit"]');
    await page2.fill('#login-pseudo', 'Bob');
    await page2.fill('#login-password', 'test');
    await page2.click('#login-form button[type="submit"]');
    await page1.waitForSelector('#chat-container', { state: 'visible' });
    await page2.waitForSelector('#chat-container', { state: 'visible' });
    await page1.fill('#input', 'Salut Bob!');
    await page1.click('#form button[type="submit"]');
    await page1.waitForFunction(() => {
      return Array.from(document.querySelectorAll('#messages li')).some(li => li.textContent.includes('Alice : Salut Bob!'));
    });
    await page2.waitForFunction(() => {
      return Array.from(document.querySelectorAll('#messages li')).some(li => li.textContent.includes('Alice : Salut Bob!'));
    });
    const messages1 = await page1.locator('#messages li').allTextContents();
    const messages2 = await page2.locator('#messages li').allTextContents();
    expect(messages1).toContainEqual(expect.stringContaining('Alice : Salut Bob!'));
    expect(messages2).toContainEqual(expect.stringContaining('Alice : Salut Bob!'));
    await cleanupMessages({ pseudo: 'Alice', content: 'Salut Bob!' });
    await context1.close();
    await context2.close();
  });
});
