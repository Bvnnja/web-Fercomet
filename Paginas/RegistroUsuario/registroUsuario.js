import { auth, db } from "../../Servicios/firebase.js";
import { createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  validarNombre,
  validarApellido,
  validarRut,
  validarEmail,
  validarCoincidenciaContraseñas
} from './validacionesFormularioRegistro.js';

const form = document.getElementById('registerForm');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmar = document.getElementById('confirmar');
const nombre = document.getElementById('nombre');
const apellido = document.getElementById('apellido');
const rut = document.getElementById('rut');
const mostrarPass = document.getElementById('mostrarPass');
const passwordStrength = document.getElementById('passwordStrength');

// Verificar si hay una sesión activa y redirigir si es necesario
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`Sesión activa: ${user.email}`); // Mostrar en consola el correo del usuario autenticado
    // Si el usuario ya está autenticado, redirigir al inicio
  } else {
    console.log("No hay sesión activa."); // Mostrar en consola si no hay sesión activa
  }
});

// Función para validar un campo en tiempo real
function validarCampo(campo, validacion, mensaje) {
  const valor = campo.value.trim();
  const esValido = validacion(valor);

  // Elimina mensajes previos del mismo campo
  const errorPrevio = campo.parentNode.querySelector('.text-danger');
  if (errorPrevio) {
    errorPrevio.remove();
  }

  // Si no es válido, muestra el mensaje de error
  if (!esValido) {
    const error = document.createElement('div');
    error.className = 'text-danger small mt-1';
    error.textContent = mensaje;
    campo.parentNode.appendChild(error);
  }
}

// Eventos de validación en tiempo real
nombre.addEventListener('input', () => {
  validarCampo(nombre, validarNombre, "El nombre solo puede contener letras y debe tener entre 2 y 50 caracteres.");
});

apellido.addEventListener('input', () => {
  validarCampo(apellido, validarApellido, "El apellido solo puede contener letras y debe tener entre 2 y 50 caracteres.");
});

rut.addEventListener('input', () => {
  const valorFormateado = formatearRut(rut.value);
  rut.value = valorFormateado;
  validarCampo(rut, validarRut, "El RUT debe contener solo números, puntos y un guion, y el dígito verificador puede ser 'K'.");
});

email.addEventListener('input', () => {
  validarCampo(email, validarEmail, "El correo electrónico no es válido.");
});

password.addEventListener('input', () => {
  const fuerza = evaluarFuerzaPassword(password.value);
  passwordStrength.innerHTML = `Fuerza de la contraseña: <span class="${fuerza.color}">${fuerza.nivel}</span>`;
});

confirmar.addEventListener('input', () => {
  validarCampo(confirmar, (value) => validarCoincidenciaContraseñas(password.value, value), "Las contraseñas no coinciden.");
});

// Evento para enviar el formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  limpiarMensajes();
  let esValido = true;

  if (!validarNombre(nombre.value)) {
    mostrarMensajeError(nombre, "El nombre solo puede contener letras y debe tener entre 2 y 50 caracteres.");
    esValido = false;
  }

  if (!validarApellido(apellido.value)) {
    mostrarMensajeError(apellido, "El apellido solo puede contener letras y debe tener entre 2 y 50 caracteres.");
    esValido = false;
  }

  if (!validarRut(rut.value)) {
    mostrarMensajeError(rut, "El RUT debe contener solo números, puntos y un guion, y el dígito verificador puede ser 'K'.");
    esValido = false;
  }

  if (!validarEmail(email.value)) {
    mostrarMensajeError(email, "El correo electrónico no es válido.");
    esValido = false;
  }

  if (!validarCoincidenciaContraseñas(password.value, confirmar.value)) {
    mostrarMensajeError(confirmar, "Las contraseñas no coinciden.");
    esValido = false;
  }

  if (!esValido) return;

  try {
    // Crear usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
  
    // Guardar información adicional del usuario en Firestore
    const usuarioData = {
      uid: user.uid, // Agregar UID del usuario
      nombre: nombre.value,
      apellido: apellido.value,
      rut: rut.value,
      email: email.value,
      fechaRegistro: new Date()
    };
  
    await setDoc(doc(db, "usuarios", user.uid), usuarioData);
  
    // Guardar los datos del usuario en localStorage
    localStorage.setItem('Usuario', JSON.stringify(usuarioData));
  
    form.reset();
  
    // Mostrar mensaje de registro completado
    mostrarMensajeRegistroCompletado();
  
    // Redirigir al inicio
    setTimeout(() => {
      window.location.href = '/Paginas/Inicio/index.html';
    }, 2000);
  } catch (error) {
    console.error(error);
    alert("Error al registrar usuario: " + error.message);
  }
});

// Mostrar mensaje de registro completado
function mostrarMensajeRegistroCompletado() {
  const mensajeContenedor = document.createElement('div');
  mensajeContenedor.className = 'mensaje-registro';
  const mensaje = document.createElement('div');
  mensaje.className = 'mensaje-registro-texto';
  mensaje.textContent = '¡Registro completado! Bienvenido a Fercomet';

  mensajeContenedor.appendChild(mensaje);
  document.body.appendChild(mensajeContenedor);

  setTimeout(() => {
    mensajeContenedor.remove();
  }, 4000);
}



mostrarPass.addEventListener('change', () => {
  const tipo = mostrarPass.checked ? 'text' : 'password';
  password.type = tipo;
  confirmar.type = tipo;
});

function evaluarFuerzaPassword(password) {
  if (password.length < 6) {
    return { nivel: "Insegura", color: "text-danger" };
  }

  const tieneMayusculas = /[A-Z]/.test(password);
  const tieneMinusculas = /[a-z]/.test(password);
  const tieneNumeros = /[0-9]/.test(password);
  const tieneEspeciales = /[\W_]/.test(password);

  if (tieneMayusculas && tieneMinusculas && tieneNumeros && tieneEspeciales) {
    return { nivel: "Segura", color: "text-success" };
  }

  if ((tieneMayusculas || tieneMinusculas) && tieneNumeros) {
    return { nivel: "Poco segura", color: "text-warning" };
  }

  return { nivel: "Insegura", color: "text-danger" };
}

function formatearRut(rut) {
  rut = rut.replace(/[^0-9kK]/g, '');
  rut = rut.slice(0, 9);
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return cuerpoFormateado + (dv ? '-' + dv : '');
}

function limpiarMensajes() {
  const errores = document.querySelectorAll('.text-danger');
  errores.forEach((error) => error.remove());
}

function mostrarMensajeError(campo, mensaje) {
  const error = document.createElement('div');
  error.className = 'text-danger small mt-1';
  error.textContent = mensaje;
  campo.parentNode.appendChild(error);
}