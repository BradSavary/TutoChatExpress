
let pseudo = '';
const socket = io();

const pseudoForm = document.getElementById('pseudo-form');
const pseudoInput = document.getElementById('pseudo-input');
const chatContainer = document.getElementById('chat-container');
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

pseudoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const value = pseudoInput.value.trim();
  if (value) {
    pseudo = value;
    pseudoForm.style.display = 'none';
    chatContainer.style.display = '';
    input.focus();
  }
});

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value && pseudo) {
    socket.emit('chat message', { pseudo, message: input.value });
    input.value = '';
  }
});


// Affiche l'historique des messages à la connexion
socket.on('chat history', function(history) {
  messages.innerHTML = '';
  history.forEach(function(data) {
    const item = document.createElement('li');
    item.textContent = `${data.pseudo} : ${data.content}`;
    messages.appendChild(item);
  });
  messages.scrollTop = messages.scrollHeight;
});

// Nouveau message reçu
socket.on('chat message', function(data) {
  const item = document.createElement('li');
  item.textContent = `${data.pseudo} : ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
