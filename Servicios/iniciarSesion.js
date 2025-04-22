import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      // Buscar documento en colección 'usuarios' con el UID
      const userDocRef = doc(db, "usuarios", uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // Guardar todos los datos en el localStorage
        localStorage.setItem('usuario', JSON.stringify({
          uid: uid,
          email: user.email,
          apellido: userData.apellido,
          nombre: userData.nombre,
          rut: userData.rut,
          fechaRegistro: userData.fechaRegistro
        }));

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();

        // Recargar para reflejar el login
        location.reload();
      } else {
        alert("No se encontraron los datos del usuario en Firestore.");
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Correo o contraseña incorrectos.");
    }
  });
});
