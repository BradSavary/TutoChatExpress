// Importation des modules nécessaires (ES Modules)
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import twig from 'twig';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import prisma from './prisma/client.js';


// Gestion de __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Création de l'application Express
const app = express();
// Création d'un serveur HTTP basé sur l'application Express
const server = http.createServer(app);
// Création d'une instance de Socket.IO attachée au serveur HTTP
const io = new Server(server);

// Configuration du dossier public pour les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de template Twig
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// Définition de la route principale
app.get('/', async (req, res) => {
  // Récupère les 50 derniers messages (ordre chronologique)
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'asc' },
    take: 50
  });
  res.render('chat', { messages });
});

// Gestion des connexions Socket.IO
io.on('connection', async (socket) => {
  // Envoie les messages existants à la connexion
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'asc' },
    take: 50
  });
  socket.emit('chat history', messages);

  // Nouveau message reçu
  socket.on('chat message', async (data) => {
    // Stocke le message en base
    const saved = await prisma.message.create({
      data: {
        pseudo: data.pseudo,
        content: data.message
      }
    });
    // Réémission du message à tous les clients
    io.emit('chat message', {
      pseudo: saved.pseudo,
      message: saved.content,
      createdAt: saved.createdAt
    });
  });
});

// Définition du port d'écoute (3000 par défaut ou celui défini dans les variables d'environnement)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});