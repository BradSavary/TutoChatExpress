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
import { sendValidationEmail } from './mailer.js';
import crypto from 'crypto';

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
    res.render('chat', { messages, isAuthenticated: true, user: { pseudo: req.session.pseudo } });
  } else {
    res.render('chat', { messages: null, isAuthenticated: false, user: null });
  }
});

// Route GET /register : affiche le formulaire d'inscription
app.get('/register', (req, res) => {
  res.render('register');
});

const validationTokens = {};

// Route POST /register : traite l'inscription
import bcrypt from 'bcrypt';
app.post('/register', async (req, res) => {
  try {
    const { pseudo, email, password } = req.body;
    if (!pseudo || !email || !password) {
      return res.status(400).send('Veuillez remplir tous les champs.');
    }
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { pseudo },
          { email }
        ]
      }
    });
    if (existingUser) {
      return res.status(409).send('Pseudo ou email déjà utilisé.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        pseudo,
        email,
        password: hashedPassword,
        isActive: false
      }
    });
    const token = crypto.randomBytes(32).toString('hex');
    validationTokens[token] = user.id;
    await sendValidationEmail(email, token);
    res.status(201).send('Inscription réussie ! Vérifiez votre email pour valider votre compte.');
  } catch (err) {
    console.error('Erreur dans /register:', err);
    res.status(500).send('Erreur serveur, veuillez réessayer.');
  }
});

app.get('/validate/:token', async (req, res) => {
  const { token } = req.params;
  const userId = validationTokens[token];
  if (!userId) {
    return res.status(400).send('Lien de validation invalide ou expiré.');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true }
  });
  delete validationTokens[token];
  res.send('Votre compte a été validé avec succès ! <a href="/">Cliquez ici pour vous connecter</a>');
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
    // Vérification du mot de passe hashé
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
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