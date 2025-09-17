// tests/e2e/setup.js
import { cleanupOldTestMessages, cleanupTestUsers } from '../helpers/prismaCleanup.mjs';

export default async function globalSetup() {
  console.log('Nettoyage de la base de données avant les tests...');
  
  try {
    await cleanupOldTestMessages();
    await cleanupTestUsers();
    console.log('Nettoyage terminé');
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}