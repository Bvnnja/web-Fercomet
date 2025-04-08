
document.addEventListener("DOMContentLoaded", function () {
  const messages = document.querySelectorAll('.er-navbar .messages p');
  let currentMessageIndex = 0;

  function showNextMessage() {
    // Ocultar todos los mensajes
    messages.forEach((message) => {
      message.classList.remove('active');
    });

    // Mostrar el siguiente mensaje
    currentMessageIndex = (currentMessageIndex + 1) % messages.length;
    messages[currentMessageIndex].classList.add('active');
  }

  // Inicialmente mostrar el primer mensaje
  showNextMessage();

  // Cambiar mensaje cada 7 segundos
  setInterval(showNextMessage, 7000);
});
