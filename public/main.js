

let pseudo = '';
const socket = io();

// Exposer le pseudo dans l'objet window pour les tests
window.pseudo = pseudo;

const loginForm = document.getElementById('login-form');
const loginPseudo = document.getElementById('login-pseudo');
const loginPassword = document.getElementById('login-password');
const chatContainer = document.getElementById('chat-container');
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

if (loginForm) {
  const loginError = document.getElementById('login-error');
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    loginError.textContent = '';
    const pseudoValue = loginPseudo.value.trim();
    const passwordValue = loginPassword.value;
    if (pseudoValue && passwordValue) {
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pseudo: pseudoValue, password: passwordValue })
        });
        if (res.ok) {
          window.location.reload();
        } else {
          const data = await res.json();
          loginError.textContent = data.error || 'Identifiants invalides';
        }
      } catch (err) {
        loginError.textContent = 'Erreur lors de la connexion';
      }
    } else {
      loginError.textContent = 'Veuillez remplir tous les champs.';
    }
  });
}

if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value && pseudo) {
      socket.emit('chat message', { pseudo, message: input.value });
      input.value = '';
    }
  });
}


// Affiche l'historique des messages à la connexion
socket.on('chat history', function(history) {
  messages.innerHTML = '';
  history.forEach(function(data) {
    const item = document.createElement('li');
    item.textContent = `${data.pseudo} : ${data.content}`;
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
  // Récupère le pseudo de session côté client (pour l'envoi de messages)
  fetch('/me').then(r => r.json()).then(data => {
    if (data.pseudo) {
      pseudo = data.pseudo;
      window.pseudo = pseudo; // Exposer pour les tests
      console.log('Pseudo chargé:', pseudo);
    }
  });
});

// Nouveau message reçu
socket.on('chat message', function(data) {
  const item = document.createElement('li');
  item.textContent = `${data.pseudo} : ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
