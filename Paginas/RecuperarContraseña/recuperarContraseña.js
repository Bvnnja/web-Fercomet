import firebaseConfig from "../../Servicios/firebaseConfig.js";
console.log(firebaseConfig);
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); 

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
      mensaje.textContent = "⚠️ Debes ingresar un correo válido.";
      mensaje.style.color = "red";
    });
});