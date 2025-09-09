# Tests End-to-End (E2E)

- Placez ici tous les tests qui simulent le comportement utilisateur réel dans le navigateur.
- Utilisez Playwright pour automatiser l'ouverture de la page, la saisie, l'envoi de messages, etc.
- Les sélecteurs (input[name="pseudo"], .message, etc.) sont à adapter selon votre HTML.

## Lancer les tests E2E

1. Démarrez votre serveur (ex: `node server.js` ou `npm start`).
2. Dans un autre terminal, lancez :

   npx playwright test tests/e2e

## Exemples
- `chat.e2e.spec.js` :
  - Un utilisateur envoie un message
  - Deux utilisateurs voient le même message
