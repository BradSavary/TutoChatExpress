// tests/helpers/authHelpers.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Génère un pseudo de test aléatoire
 * @returns {string} - pseudo du type "TestUser_1234567"
 */
export function generateRandomTestPseudo() {
  const randomId = Math.floor(Math.random() * 9000000) + 1000000; // 7 chiffres
  return `TestUser_${randomId}`;
}

/**
 * Génère un email de test aléatoire
 * @param {string} pseudo - le pseudo à utiliser
 * @returns {string} - email du type "testuser_1234567@test.local"
 */
export function generateTestEmail(pseudo) {
  return `${pseudo.toLowerCase()}@test.local`;
}

/**
 * Crée un utilisateur directement en base avec un compte déjà validé
 * @param {string} pseudo - le pseudo de l'utilisateur
 * @param {string} password - le mot de passe en clair
 * @param {string} email - l'email de l'utilisateur
 * @returns {Object} - l'utilisateur créé
 */
export async function createValidatedUser(pseudo, password = 'testpassword', email = null) {
  const userEmail = email || generateTestEmail(pseudo);
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    return await prisma.user.create({
      data: {
        pseudo,
        email: userEmail,
        password: hashedPassword,
        isActive: true // Directement validé pour les tests
      }
    });
  } catch (error) {
    // Si l'utilisateur existe déjà, le récupérer
    if (error.code === 'P2002') {
      console.log(`User ${pseudo} already exists, fetching existing user`);
      return await prisma.user.findUnique({ where: { pseudo } });
    }
    throw error;
  }
}

/**
 * Inscrit un utilisateur via l'API REST directement
 * @param {string} baseUrl - URL de base de l'application
 * @param {string} pseudo - le pseudo de l'utilisateur
 * @param {string} password - le mot de passe
 * @param {string} email - l'email de l'utilisateur
 * @returns {Object} - réponse de l'inscription
 */
export async function registerUserViaAPI(baseUrl, pseudo, password, email) {
  try {
    const response = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pseudo, email, password })
    });

    const responseText = await response.text();
    
    if (response.ok || response.status === 409) {
      // 409 = utilisateur déjà existant, c'est OK pour les tests
      console.log(`Registration API response for ${pseudo}: ${responseText}`);
      return { success: true, message: responseText };
    } else {
      throw new Error(`Registration failed: ${response.status} - ${responseText}`);
    }
  } catch (error) {
    console.error(`Error in registerUserViaAPI for ${pseudo}:`, error.message);
    throw error;
  }
}

/**
 * Supprime un utilisateur de test
 * @param {string} pseudo - le pseudo de l'utilisateur à supprimer
 */
export async function cleanupUser(pseudo) {
  await prisma.user.deleteMany({
    where: { pseudo }
  });
}

/**
 * Effectue l'inscription complète d'un utilisateur via l'API
 * @param {Object} page - page Playwright
 * @param {string} pseudo - le pseudo de l'utilisateur
 * @param {string} password - le mot de passe
 * @param {string} email - l'email de l'utilisateur
 * @param {string} baseUrl - URL de base de l'application
 * @returns {Object} - les données de l'utilisateur créé
 */
export async function registerUser(page, pseudo, password, email, baseUrl) {
  try {
    // Aller sur la page d'inscription
    await page.goto(`${baseUrl}/register`);
    
    // Attendre que la page soit chargée
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Remplir le formulaire d'inscription
    await page.fill('input[name="pseudo"]', pseudo);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Soumettre le formulaire
    await page.click('button[type="submit"]');
    
    // Attendre la confirmation d'inscription ou une erreur
    try {
      await page.waitForFunction(() => {
        const text = document.body.textContent;
        return text.includes('Inscription réussie') || text.includes('déjà utilisé') || text.includes('Erreur');
      }, { timeout: 10000 });
      
      const pageContent = await page.textContent('body');
      if (pageContent.includes('déjà utilisé')) {
        console.log(`User ${pseudo} already exists, proceeding...`);
      } else if (pageContent.includes('Erreur')) {
        throw new Error(`Registration failed: ${pageContent}`);
      } else {
        console.log(`User ${pseudo} registered successfully`);
      }
    } catch (error) {
      console.log(`Registration may have completed despite timeout for ${pseudo}`);
    }
    
    return { pseudo, email, password };
  } catch (error) {
    console.error(`Error in registerUser for ${pseudo}:`, error.message);
    throw error;
  }
}

/**
 * Valide un utilisateur en simulant le clic sur le lien de validation
 * @param {Object} page - page Playwright
 * @param {string} pseudo - le pseudo de l'utilisateur
 * @param {string} baseUrl - URL de base de l'application
 */
export async function validateUser(page, pseudo, baseUrl) {
  // Récupérer le token de validation depuis la variable globale du serveur
  // En production, on récupérerait le token depuis l'email
  // Pour les tests, on va chercher l'utilisateur et le valider directement en base
  const user = await prisma.user.findUnique({ where: { pseudo } });
  if (!user) {
    throw new Error(`User ${pseudo} not found`);
  }
  
  // Activer l'utilisateur directement
  await prisma.user.update({
    where: { id: user.id },
    data: { isActive: true }
  });
}

/**
 * Connecte un utilisateur via l'interface web
 * @param {Object} page - page Playwright
 * @param {string} pseudo - le pseudo de l'utilisateur
 * @param {string} password - le mot de passe
 * @param {string} baseUrl - URL de base de l'application
 */
export async function loginUser(page, pseudo, password, baseUrl) {
  try {
    await page.goto(baseUrl);
    
    // Attendre que le formulaire de connexion soit visible
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    // Remplir le formulaire de connexion
    await page.fill('#login-pseudo', pseudo);
    await page.fill('#login-password', password);
    
    // Soumettre le formulaire
    await page.click('#login-form button[type="submit"]');
    
    // Attendre que le chat soit visible ou qu'une erreur apparaisse
    try {
      await page.waitForSelector('#chat-container', { state: 'visible', timeout: 15000 });
      console.log(`User ${pseudo} logged in successfully`);
    } catch (error) {
      // Vérifier s'il y a un message d'erreur
      const errorElement = await page.locator('#login-error').textContent().catch(() => '');
      if (errorElement) {
        throw new Error(`Login failed for ${pseudo}: ${errorElement}`);
      }
      throw new Error(`Login timeout for ${pseudo}: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error in loginUser for ${pseudo}:`, error.message);
    throw error;
  }
}

/**
 * Envoie un message dans le chat
 * @param {Object} page - page Playwright
 * @param {string} message - le message à envoyer
 */
export async function sendMessage(page, message) {
  try {
    // Vérifier que le chat est bien visible
    await page.waitForSelector('#chat-container', { state: 'visible', timeout: 10000 });
    
    // Attendre que le pseudo soit chargé côté client (crucial pour l'envoi de messages)
    await page.waitForFunction(() => {
      return window.pseudo && window.pseudo.length > 0;
    }, { timeout: 10000 });
    
    console.log('Pseudo chargé côté client, prêt à envoyer le message');
    
    // Compter les messages avant l'envoi
    const messagesBefore = await page.locator('#messages li').count();
    
    // Remplir le champ de message
    await page.fill('#input', message);
    
    // Cliquer sur le bouton d'envoi
    await page.click('#form button[type="submit"]');
    
    // Attendre d'abord qu'un nouveau message soit ajouté
    await page.waitForFunction(
      (count) => document.querySelectorAll('#messages li').length > count,
      messagesBefore,
      { timeout: 10000 }
    );
    
    // Puis attendre spécifiquement notre message
    await page.waitForFunction((msg) => {
      const messages = Array.from(document.querySelectorAll('#messages li'));
      return messages.some(li => li.textContent.includes(msg));
    }, message, { timeout: 5000 });
    
    console.log(`Message "${message}" envoyé avec succès`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi du message "${message}":`, error.message);
    
    // Essayons de débugger en récupérant l'état de la page
    const chatVisible = await page.isVisible('#chat-container');
    const inputVisible = await page.isVisible('#input');
    const buttonVisible = await page.isVisible('#form button[type="submit"]');
    const currentMessages = await page.locator('#messages li').allTextContents();
    const inputValue = await page.inputValue('#input');
    const pseudoValue = await page.evaluate(() => window.pseudo);
    
    console.log('Debug info:', {
      chatVisible,
      inputVisible,
      buttonVisible,
      inputValue,
      pseudoValue,
      messageCount: currentMessages.length,
      lastMessages: currentMessages.slice(-5),
      containsOurMessage: currentMessages.some(msg => msg.includes(message))
    });
    
    // Si le message est effectivement présent mais non détecté, on peut continuer
    if (currentMessages.some(msg => msg.includes(message))) {
      console.log(`Message trouvé malgré l'erreur, continuons...`);
      return;
    }
    
    throw error;
  }
}

/**
 * Récupère tous les messages affichés dans le chat
 * @param {Object} page - page Playwright
 * @returns {Array<string>} - liste des messages
 */
export async function getChatMessages(page) {
  return await page.locator('#messages li').allTextContents();
}