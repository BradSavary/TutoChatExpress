# Connexion à PostgreSQL sur Render

1. Créez un service PostgreSQL sur Render.
2. Récupérez l'URL de connexion (ex: `postgresql://user:pass@server.render.com/base`).
3. Ajoutez cette URL dans le fichier `.env` à la variable `DATABASE_URL`.
4. Ajoutez `.env` à `.gitignore` pour ne pas exposer vos identifiants.
5. Installez dotenv :
   ```sh
   npm install dotenv
   ```
6. Ajoutez en haut de votre fichier principal (ex: `server.js`):
   ```js
   import dotenv from 'dotenv';
   dotenv.config();
   ```
7. Vérifiez que `provider = "postgresql"` dans `prisma/schema.prisma`.
8. Supprimez le dossier `prisma/migrations` si vous avez migré en SQLite localement.
9. Générez le client Prisma :
   ```sh
   npx prisma generate
   ```
10. Testez votre appli en local puis sur Render.
11. Connectez DBeaver à votre base PostgreSQL Render pour la visualiser.
