import { auth, db } from "../../Servicios/firebaseConfig.js"; // Importar auth y db correctamente
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Función para mostrar el mensaje personalizado
function mostrarMensajePersonalizado(mensaje) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "1000";

  const mensajeDiv = document.createElement("div");
  mensajeDiv.style.backgroundColor = "#fff";
  mensajeDiv.style.padding = "40px";
  mensajeDiv.style.borderRadius = "16px";
  mensajeDiv.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";
  mensajeDiv.style.textAlign = "center";
  mensajeDiv.style.fontSize = "18px";
  mensajeDiv.style.color = "#000";
  mensajeDiv.style.display = "flex";
  mensajeDiv.style.flexDirection = "column";
  mensajeDiv.style.alignItems = "center";

  const logoImg = document.createElement("img");
  logoImg.src = "/imagenes/Captura de pantalla 2025-04-07 193041.png"; // Ruta del logo de Fercomet
  logoImg.alt = "Fercomet Logo";
  logoImg.style.maxWidth = "150px";
  logoImg.style.marginBottom = "20px";

  const mensajeTexto = document.createElement("p");
  mensajeTexto.textContent = mensaje;
  mensajeTexto.style.margin = "0";

  mensajeDiv.appendChild(logoImg); // Agregar el logo al cuadro
  mensajeDiv.appendChild(mensajeTexto); // Agregar el texto al cuadro
  overlay.appendChild(mensajeDiv);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 5000);
}

// Manejar el formulario de inicio de sesión
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  try {
    // Autenticar al usuario
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener referencia al documento del usuario en Firestore
    const userDocRef = doc(db, "usuarios", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Si no existe, guardar los datos del usuario en Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        nombre: "Nombre por defecto", // Cambiar por un valor real si lo tienes
        apellido: "Apellido por defecto", // Cambiar por un valor real si lo tienes
        rut: "RUT por defecto" // Cambiar por un valor real si lo tienes
      };
      await setDoc(userDocRef, userData);
      console.log("Datos del usuario guardados en Firestore:", userData);
      // Guardar en localStorage
      localStorage.setItem("Usuario", JSON.stringify(userData));
      localStorage.setItem("cart", JSON.stringify([])); // Carrito vacío para nuevo usuario
    } else {
      const userData = userDoc.data();
      console.log("Datos del usuario ya existen en Firestore:", userData);
      // Guardar en localStorage
      localStorage.setItem("Usuario", JSON.stringify(userData));
      // Sincronizar carrito del usuario
      if (Array.isArray(userData.carrito)) {
        localStorage.setItem("cart", JSON.stringify(userData.carrito));
      } else {
        localStorage.setItem("cart", JSON.stringify([]));
      }
    }

    mostrarMensajePersonalizado("Inicio de sesión exitoso. Bienvenido, " + (userDoc.data()?.nombre || "Usuario"));
    // Redirigir al usuario a la página principal o dashboard
    setTimeout(() => {
      window.location.href = "/Paginas/Inicio/index.html";
    }, 5000);
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    errorMessage.textContent = "Correo o contraseña incorrectos.";
  }
});
