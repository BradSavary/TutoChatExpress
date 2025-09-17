// tests/e2e/chat.e2e.spec.js
import { test, expect } from '@playwright/test';
import { cleanupMessages } from '../helpers/prismaCleanup.mjs';
import { 
  generateRandomTestPseudo, 
  generateTestEmail, 
  createValidatedUser,
  registerUserViaAPI,
  validateUser, 
  loginUser, 
  sendMessage, 
  getChatMessages,
  cleanupUser 
} from '../helpers/authHelpers.mjs';

// Adapter l'URL si besoin
const APP_URL = 'http://localhost:3000';

test.describe('Chat E2E avec inscription et validation', () => {
  test('Un utilisateur peut s\'inscrire via API, se connecter et envoyer un message', async ({ page }) => {
    const testPseudo = generateRandomTestPseudo();
    const testEmail = generateTestEmail(testPseudo);
    const testPassword = 'testPassword123';
    const testMessage = 'Hello world from test!';

    try {
      // 1. Inscription via API
      await registerUserViaAPI(APP_URL, testPseudo, testPassword, testEmail);
      
      // 2. Validation d'email (simulation directe en base)
      await validateUser(page, testPseudo, APP_URL);
      
      // 3. Connexion via interface web
      await loginUser(page, testPseudo, testPassword, APP_URL);
      
      // 4. Envoi d'un message
      await sendMessage(page, testMessage);
      
      // 5. Vérification que le message apparaît
      const messages = await getChatMessages(page);
      console.log('MESSAGES AFFICHÉS APRÈS ENVOI:', messages);
      expect(messages).toContainEqual(expect.stringContaining(`${testPseudo} : ${testMessage}`));
      
    } finally {
      // Nettoyage des messages
      await cleanupMessages({ pseudo: testPseudo, content: testMessage });
    }
  });

  test('Deux utilisateurs créés directement en base voient le même message', async ({ browser }) => {
    const testPseudo1 = generateRandomTestPseudo();
    const testPseudo2 = generateRandomTestPseudo();
    const testEmail1 = generateTestEmail(testPseudo1);
    const testEmail2 = generateTestEmail(testPseudo2);
    const testPassword = 'testPassword123';
    const testMessage = `Message partagé ${Date.now()}`;

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // 1. Création directe des utilisateurs en base (plus fiable)
      await createValidatedUser(testPseudo1, testPassword, testEmail1);
      await createValidatedUser(testPseudo2, testPassword, testEmail2);
      
      // 2. Connexion des deux utilisateurs
      await loginUser(page1, testPseudo1, testPassword, APP_URL);
      await loginUser(page2, testPseudo2, testPassword, APP_URL);
      
      // 3. L'utilisateur 1 envoie un message
      await sendMessage(page1, testMessage);
      
      // 4. Vérification que les deux utilisateurs voient le message
      await page2.waitForFunction((msg) => {
        return Array.from(document.querySelectorAll('#messages li')).some(li => 
          li.textContent.includes(msg)
        );
      }, testMessage, { timeout: 10000 });
      
      const messages1 = await getChatMessages(page1);
      const messages2 = await getChatMessages(page2);
      
      console.log('MESSAGES UTILISATEUR 1:', messages1);
      console.log('MESSAGES UTILISATEUR 2:', messages2);
      
      expect(messages1).toContainEqual(expect.stringContaining(`${testPseudo1} : ${testMessage}`));
      expect(messages2).toContainEqual(expect.stringContaining(`${testPseudo1} : ${testMessage}`));
      
    } finally {
      // Nettoyage
      await cleanupMessages({ pseudo: testPseudo1, content: testMessage });
      await context1.close();
      await context2.close();
    }
  });

  test('Test complet du processus d\'inscription via interface web', async ({ page }) => {
    const testPseudo = generateRandomTestPseudo();
    const testEmail = generateTestEmail(testPseudo);
    const testPassword = 'testPassword123';
    const testMessage = 'Message après inscription complète';

    try {
      // 1. Aller sur la page d'inscription
      await page.goto(`${APP_URL}/register`);
      
      // 2. Attendre que la page soit chargée
      await page.waitForSelector('form', { timeout: 10000 });
      
      // 3. Remplir le formulaire d'inscription
      await page.fill('input[name="pseudo"]', testPseudo);
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      
      // 4. Soumettre le formulaire
      await page.click('button[type="submit"]');
      
      // 5. Attendre la confirmation d'inscription
      await page.waitForFunction(() => {
        const text = document.body.textContent;
        return text.includes('Inscription réussie') || text.includes('déjà utilisé');
      }, { timeout: 10000 });
      
      // 6. Validation d'email (simulation directe en base)
      await validateUser(page, testPseudo, APP_URL);
      
      // 7. Aller sur la page de connexion
      await page.goto(APP_URL);
      
      // 8. Se connecter
      await page.fill('#login-pseudo', testPseudo);
      await page.fill('#login-password', testPassword);
      await page.click('#login-form button[type="submit"]');
      
      // 9. Attendre que le chat soit visible
      await page.waitForSelector('#chat-container', { state: 'visible', timeout: 15000 });
      
      // 10. Envoyer un message
      await sendMessage(page, testMessage);
      
      // 11. Vérifier que le message apparaît
      const messages = await getChatMessages(page);
      expect(messages).toContainEqual(expect.stringContaining(`${testPseudo} : ${testMessage}`));
      
    } finally {
      // Nettoyage
      await cleanupMessages({ pseudo: testPseudo, content: testMessage });
    }
  });
});
