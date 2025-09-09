// Exemple de test unitaire pour une fonction utilitaire
function formatMessage(user, text) {
  return {
    user,
    text,
    date: new Date().toISOString(),
  };
}

module.exports = formatMessage;
