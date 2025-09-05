// Importation des modules nécessaires
const express = require('express'); // Framework web pour Node.js
const http = require('http'); // Module HTTP natif de Node.js
const path = require('path'); // Module pour travailler avec les chemins de fichiers
const { Server } = require('socket.io'); // Bibliothèque pour la communication en temps réel via WebSocket
const twig = require('twig'); // Moteur de template Twig pour générer des vues dynamiques

// Création de l'application Express
const app = express();
// Création d'un serveur HTTP basé sur l'application Express
const server = http.createServer(app);
// Création d'une instance de Socket.IO attachée au serveur HTTP
const io = new Server(server);

// Configuration du dossier public pour les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de template Twig
app.set('views', path.join(__dirname, 'views')); // Chemin vers le dossier des vues
app.set('view engine', 'twig'); // Définition de Twig comme moteur de rendu

// Définition de la route principale
app.get('/', (req, res) => {
  // Rendu de la vue "chat.twig" lorsque l'utilisateur accède à la racine du site
  res.render('chat');
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  // Écoute de l'événement "chat message" envoyé par un client
  socket.on('chat message', (data) => {
    // Réémission du message à tous les clients connectés
    io.emit('chat message', data);
  });
});

// Définition du port d'écoute (3000 par défaut ou celui défini dans les variables d'environnement)
const PORT = process.env.PORT || 3000;
// Démarrage du serveur HTTP
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});