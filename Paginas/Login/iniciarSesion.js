import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import firebaseConfig from "../../Servicios/firebaseConfig.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    } else {
      const userData = userDoc.data();
      console.log("Datos del usuario ya existen en Firestore:", userData);
      // Guardar en localStorage
      localStorage.setItem("Usuario", JSON.stringify(userData));
    }

    alert("Inicio de sesión exitoso. Bienvenido, " + (userDoc.data()?.nombre || "Usuario"));
    // Redirigir al usuario a la página principal o dashboard
    window.location.href = "/Paginas/Inicio/index.html";
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    errorMessage.textContent = "Correo o contraseña incorrectos.";
  }
});
