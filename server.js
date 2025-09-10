// Importation des modules nécessaires (ES Modules)
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import twig from 'twig';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';
import cors from 'cors';
import prisma from './prisma/client.js';


// Gestion de __dirname avec ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';
// Création de l'application Express
const app = express();
// Trust proxy pour cookies secure derrière un proxy (ex: Heroku, Render, etc.)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: FRONT_URL,
  credentials: true,
}));

// Session
const isProduction = FRONT_URL.startsWith('https://');
app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // true si FRONT_URL est https
    sameSite: isProduction ? 'none' : 'lax',
    domain: undefined, // à adapter si besoin
  }
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Création d'un serveur HTTP basé sur l'application Express
const server = http.createServer(app);
// Création d'une instance de Socket.IO attachée au serveur HTTP
const io = new Server(server, {
  cors: {
    origin: FRONT_URL,
    credentials: true,
  }
});

// Configuration du dossier public pour les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du moteur de template Twig
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// Route principale : affiche le chat si connecté, sinon le formulaire de connexion
app.get('/', async (req, res) => {
  if (req.session.userId) {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
      take: 50
    });
    res.render('chat', { messages, isAuthenticated: true });
  } else {
    res.render('chat', { messages: null, isAuthenticated: false });
  }
});

// Route POST /login
app.post('/login', async (req, res) => {
  try {
    const { pseudo, password } = req.body;
    if (!pseudo || !password) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs.' });
    }
    const user = await prisma.user.findUnique({ where: { pseudo } });
    if (!user) {
      return res.status(401).json({ error: 'Pseudo inconnu.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'Utilisateur inactif.' });
    }
    req.session.userId = user.id;
    req.session.pseudo = user.pseudo;
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur dans /login:', err);
    res.status(500).json({ error: 'Erreur serveur, veuillez réessayer.' });
  }
});

// Route GET /logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Route GET /me (pour récupérer le pseudo côté client)
app.get('/me', (req, res) => {
  if (req.session && req.session.pseudo) {
    res.json({ pseudo: req.session.pseudo });
  } else {
    res.json({});
  }
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
    // Vérifie que le pseudo existe côté User
    const user = await prisma.user.findUnique({ where: { pseudo: data.pseudo } });
    if (!user) return;
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

// Log temporaire pour diagnostic Render
console.log('PORT Render:', process.env.PORT);
// Définition du port d'écoute (3000 par défaut ou celui défini dans les variables d'environnement)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur port ${PORT}`);
});