// tests/integration/README.md
# Tests d'intégration

- Placez ici tous les tests qui vérifient l'interaction entre plusieurs composants (ex: Socket.IO, base de données, routes Express, etc).
- Utilisez des helpers dans `../helpers/` pour factoriser le code commun (création de client, setup serveur, etc).
- Structurez chaque fichier de test avec des blocs clairs :
  - `beforeAll`/`afterAll` pour le setup/teardown
  - Un test par fonctionnalité intégrée

## Exemples
- `socketio.test.cjs` : connexion et échange de messages Socket.IO
- `history.test.cjs` : récupération de l'historique
