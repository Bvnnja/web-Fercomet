import { auth } from "../../Servicios/firebaseConfig.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Lógica para enviar el correo de recuperación
document.getElementById("btnEnviar").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const mensaje = document.getElementById("mensaje");

  sendPasswordResetEmail(auth, email)
    .then(() => {
      mensaje.textContent = "📨 Se ha enviado un correo para restablecer la contraseña.";
      mensaje.style.color = "green";
    })
    .catch((error) => {
      mensaje.textContent = "⚠️ Debes ingresar un correo válido o el correo no está registrado.";
      mensaje.style.color = "red";
    });
});