let pseudo = '';
while (!pseudo) {
  pseudo = prompt('Entrez votre pseudo :');
}

const socket = io();
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', { pseudo, message: input.value });
    input.value = '';
  }
});

socket.on('chat message', function(data) {
  const item = document.createElement('li');
  item.textContent = `${data.pseudo} : ${data.message}`;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});
