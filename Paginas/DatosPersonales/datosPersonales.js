import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const container = document.getElementById("datosPersonalesContainer");

// Validaciones
function validarNombre(nombre) {
  // Solo letras y espacios, sin caracteres especiales, 2-50 caracteres
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
  return regex.test(nombre.trim());
}
function validarApellido(apellido) {
  // Solo letras y espacios, sin caracteres especiales, 2-50 caracteres
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
  return regex.test(apellido.trim());
}
function formatearRut(rut) {
  // Elimina todo excepto números y K/k
  rut = rut.replace(/[^0-9kK]/g, '');
  // Máximo 9 caracteres (8 dígitos + 1 verificador)
  rut = rut.slice(0, 9);
  let cuerpo = rut.slice(0, -1);
  let dv = rut.slice(-1);
  // Formatea con puntos cada 3 dígitos desde la derecha
  cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  // Si hay dígito verificador, agrégalo después del guion
  return cuerpo + (dv ? '-' + dv.toUpperCase() : '');
}
function validarRut(rut) {
  // Elimina puntos y guion
  rut = rut.replace(/\./g, '').replace(/-/g, '');
  // Debe tener 8 o 9 caracteres (7 u 8 dígitos + 1 verificador)
  if (rut.length < 8 || rut.length > 9) return false;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1).toUpperCase();
  // Solo números en el cuerpo
  if (!/^\d{7,8}$/.test(cuerpo)) return false;
  // Dígito verificador: número o K
  if (!/^[0-9K]$/.test(dv)) return false;
  // Validación algoritmo
  let suma = 0, multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dvEsperado = 11 - (suma % 11);
  let dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dv === dvCalc;
}
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

function mostrarErrorInput(input, mensaje) {
  let error = input.parentNode.querySelector('.text-danger');
  if (!error) {
    error = document.createElement('div');
    error.className = 'text-danger small mt-1';
    input.parentNode.appendChild(error);
  }
  error.textContent = mensaje;
}
function limpiarErrorInput(input) {
  const error = input.parentNode.querySelector('.text-danger');
  if (error) error.remove();
}

async function cargarDatos() {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (!usuario || !usuario.uid) {
    container.innerHTML = `<div class="alert alert-warning text-center">Debes iniciar sesión para ver tus datos.</div>`;
    return;
  }

  try {
    const userDocRef = doc(db, "usuarios", usuario.uid);
    const userDoc = await getDoc(userDocRef);
    const datos = userDoc.exists() ? userDoc.data() : usuario;

    container.innerHTML = `
      <form id="formDatosPersonales" class="datos-form">
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">Nombre</label>
          <div class="col-sm-7 position-relative">
            <input type="text" class="form-control" id="nombre" value="${datos.nombre || ""}" disabled data-original="${datos.nombre || ""}">
          </div>
          <div class="col-sm-2 d-flex align-items-center justify-content-end gap-1">
            <button type="button" class="btn btn-link editar-btn" data-field="nombre"><i class="bi bi-pencil"></i></button>
            <button type="button" class="btn btn-link btn-restaurar" id="restaurar-nombre" style="display:none;" title="Restaurar valor original"><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">Apellido</label>
          <div class="col-sm-7 position-relative">
            <input type="text" class="form-control" id="apellido" value="${datos.apellido || ""}" disabled data-original="${datos.apellido || ""}">
          </div>
          <div class="col-sm-2 d-flex align-items-center justify-content-end gap-1">
            <button type="button" class="btn btn-link editar-btn" data-field="apellido"><i class="bi bi-pencil"></i></button>
            <button type="button" class="btn btn-link btn-restaurar" id="restaurar-apellido" style="display:none;" title="Restaurar valor original"><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">RUT</label>
          <div class="col-sm-7 position-relative">
            <input type="text" class="form-control" id="rut" value="${datos.rut || ""}" disabled data-original="${datos.rut || ""}">
          </div>
          <div class="col-sm-2 d-flex align-items-center justify-content-end gap-1">
            <button type="button" class="btn btn-link editar-btn" data-field="rut"><i class="bi bi-pencil"></i></button>
            <button type="button" class="btn btn-link btn-restaurar" id="restaurar-rut" style="display:none;" title="Restaurar valor original"><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">Correo</label>
          <div class="col-sm-7 position-relative">
            <input type="email" class="form-control" id="email" value="${datos.email || ""}" disabled data-original="${datos.email || ""}">
          </div>
          <div class="col-sm-2 d-flex align-items-center justify-content-end gap-1">
            <button type="button" class="btn btn-link editar-btn" data-field="email"><i class="bi bi-pencil"></i></button>
            <button type="button" class="btn btn-link btn-restaurar" id="restaurar-email" style="display:none;" title="Restaurar valor original"><i class="bi bi-arrow-counterclockwise"></i></button>
          </div>
        </div>
        <div class="text-center">
          <button type="submit" class="btn btn-success" id="guardarCambiosBtn" style="display:none;">Guardar cambios</button>
        </div>
      </form>
      <div id="mensajeDatos" class="mt-3"></div>
    `;

    const nombreInput = document.getElementById("nombre");
    const apellidoInput = document.getElementById("apellido");
    const rutInput = document.getElementById("rut");
    const emailInput = document.getElementById("email");

    // Restaurar botones
    const restaurarNombreBtn = document.getElementById("restaurar-nombre");
    const restaurarApellidoBtn = document.getElementById("restaurar-apellido");
    const restaurarRutBtn = document.getElementById("restaurar-rut");
    const restaurarEmailBtn = document.getElementById("restaurar-email");

    // Mostrar/ocultar botón restaurar si el valor cambia
    function toggleRestaurarBtn(input, btn) {
      if (input.value !== input.getAttribute("data-original")) {
        btn.style.display = "";
      } else {
        btn.style.display = "none";
      }
    }

    // Bloquear números y caracteres especiales en nombre y apellido
    function soloLetras(e) {
      const key = e.key;
      if (
        !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key) &&
        key !== "Backspace" &&
        key !== "ArrowLeft" &&
        key !== "ArrowRight" &&
        key !== "Tab"
      ) {
        e.preventDefault();
      }
    }
    nombreInput.addEventListener("keydown", soloLetras);
    apellidoInput.addEventListener("keydown", soloLetras);

    // Validación y formateo en tiempo real para nombre y apellido
    nombreInput.addEventListener("input", () => {
      limpiarErrorInput(nombreInput);
      if (!validarNombre(nombreInput.value)) {
        mostrarErrorInput(nombreInput, "El nombre debe tener entre 2 y 50 letras, sin caracteres especiales.");
      }
      toggleRestaurarBtn(nombreInput, restaurarNombreBtn);
    });
    apellidoInput.addEventListener("input", () => {
      limpiarErrorInput(apellidoInput);
      if (!validarApellido(apellidoInput.value)) {
        mostrarErrorInput(apellidoInput, "El apellido debe tener entre 2 y 50 letras, sin caracteres especiales.");
      }
      toggleRestaurarBtn(apellidoInput, restaurarApellidoBtn);
    });

    // RUT: solo números y K/k como dígito verificador, máximo 8 dígitos antes del guion, formateo automático
    rutInput.addEventListener("keydown", function (e) {
      const key = e.key;
      const valorSinFormato = rutInput.value.replace(/[^0-9kK]/g, '');
      // Permitir navegación y edición básica
      if (
        /^[0-9.\-]$/.test(key) ||
        key === "Backspace" ||
        key === "Tab" ||
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "Delete" ||
        key === "Home" ||
        key === "End"
      ) {
        // Limitar a 9 caracteres (8 dígitos + 1 verificador)
        if (
          !["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End"].includes(key) &&
          valorSinFormato.length >= 9 &&
          rutInput.selectionStart === rutInput.selectionEnd
        ) {
          e.preventDefault();
        }
        return;
      }
      // Permitir K/k solo si es el último carácter y no hay ya una K/k como DV
      if (key === "k" || key === "K") {
        // Solo permitir si aún no hay DV K/k y estamos al final
        if (
          valorSinFormato.length === 8 &&
          rutInput.selectionStart === rutInput.value.length
        ) {
          return;
        }
        e.preventDefault();
        return;
      }
      e.preventDefault();
    });

    rutInput.addEventListener("input", () => {
      // Formatear RUT automáticamente
      let valor = rutInput.value.replace(/[^0-9kK]/g, '');
      valor = valor.slice(0, 9);
      rutInput.value = formatearRut(valor);

      limpiarErrorInput(rutInput);
      if (!validarRut(rutInput.value)) {
        mostrarErrorInput(rutInput, "El RUT debe tener 7 u 8 dígitos, estar bien formateado y ser válido. El dígito verificador puede ser K.");
      }
      toggleRestaurarBtn(rutInput, restaurarRutBtn);
    });

    emailInput.addEventListener("input", () => {
      limpiarErrorInput(emailInput);
      if (!validarEmail(emailInput.value)) {
        mostrarErrorInput(emailInput, "El correo electrónico no es válido.");
      }
      toggleRestaurarBtn(emailInput, restaurarEmailBtn);
    });

    // Acción de restaurar valor original
    restaurarNombreBtn.addEventListener("click", () => {
      nombreInput.value = nombreInput.getAttribute("data-original");
      nombreInput.dispatchEvent(new Event("input"));
    });
    restaurarApellidoBtn.addEventListener("click", () => {
      apellidoInput.value = apellidoInput.getAttribute("data-original");
      apellidoInput.dispatchEvent(new Event("input"));
    });
    restaurarRutBtn.addEventListener("click", () => {
      rutInput.value = rutInput.getAttribute("data-original");
      rutInput.dispatchEvent(new Event("input"));
    });
    restaurarEmailBtn.addEventListener("click", () => {
      emailInput.value = emailInput.getAttribute("data-original");
      emailInput.dispatchEvent(new Event("input"));
    });

    // Habilitar edición al hacer click en el lápiz
    document.querySelectorAll('.editar-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const field = this.dataset.field;
        const input = document.getElementById(field);
        input.disabled = false;
        input.focus();
        document.getElementById("guardarCambiosBtn").style.display = "inline-block";
      });
    });

    // Guardar cambios con validación
    document.getElementById("formDatosPersonales").addEventListener("submit", async function(e) {
      e.preventDefault();
      let valido = true;

      limpiarErrorInput(nombreInput);
      limpiarErrorInput(apellidoInput);
      limpiarErrorInput(rutInput);
      limpiarErrorInput(emailInput);

      if (!validarNombre(nombreInput.value)) {
        mostrarErrorInput(nombreInput, "El nombre debe tener entre 2 y 50 letras, sin caracteres especiales.");
        valido = false;
      }
      if (!validarApellido(apellidoInput.value)) {
        mostrarErrorInput(apellidoInput, "El apellido debe tener entre 2 y 50 letras, sin caracteres especiales.");
        valido = false;
      }
      if (!validarRut(rutInput.value)) {
        mostrarErrorInput(rutInput, "El RUT debe tener máximo 8 dígitos, estar bien formateado y ser válido.");
        valido = false;
      }
      if (!validarEmail(emailInput.value)) {
        mostrarErrorInput(emailInput, "El correo electrónico no es válido.");
        valido = false;
      }
      if (!valido) return;

      const nombre = nombreInput.value.trim();
      const apellido = apellidoInput.value.trim();
      const rut = rutInput.value.trim();
      const email = emailInput.value.trim();

      try {
        await updateDoc(doc(db, "usuarios", usuario.uid), {
          nombre, apellido, rut, email
        });
        // Actualizar localStorage
        const actualizado = { ...usuario, nombre, apellido, rut, email };
        localStorage.setItem("Usuario", JSON.stringify(actualizado));
        document.getElementById("mensajeDatos").innerHTML = `<div class="alert alert-success text-center">Datos actualizados correctamente.</div>`;
        // Deshabilitar inputs
        ["nombre", "apellido", "rut", "email"].forEach(id => document.getElementById(id).disabled = true);
        document.getElementById("guardarCambiosBtn").style.display = "none";
      } catch (err) {
        document.getElementById("mensajeDatos").innerHTML = `<div class="alert alert-danger text-center">Error al actualizar los datos.</div>`;
      }
    });
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger text-center">Error al cargar los datos personales.</div>`;
  }
}

function mostrarModalEliminarCuenta(onConfirm) {
  // Crear overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  // Crear modal
  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.borderRadius = "16px";
  modal.style.boxShadow = "0 8px 32px rgba(50,115,91,0.18)";
  modal.style.padding = "36px 32px 28px 32px";
  modal.style.maxWidth = "350px";
  modal.style.width = "100%";
  modal.style.textAlign = "center";
  modal.style.position = "relative";

  modal.innerHTML = `
    <h5 style="color:#b30000;font-weight:700;margin-bottom:18px;">Eliminar cuenta</h5>
    <p class="mb-3" style="font-size:1.05rem;">Para eliminar tu cuenta, ingresa tu contraseña.<br><span style="color:#b30000;font-size:0.98rem;">Esta acción no se puede deshacer.</span></p>
    <input type="password" id="passwordEliminar" class="form-control mb-2" placeholder="Contraseña actual" autocomplete="current-password" style="text-align:center;">
    <div id="errorEliminarCuenta" class="text-danger mb-2" style="display:none;font-size:0.95rem;"></div>
    <button id="btnEliminarCuentaConfirm" class="btn btn-danger w-100" disabled>Eliminar cuenta</button>
    <button id="btnCancelarEliminarCuenta" class="btn btn-secondary w-100 mt-2">Cancelar</button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const passwordInput = modal.querySelector("#passwordEliminar");
  const btnEliminar = modal.querySelector("#btnEliminarCuentaConfirm");
  const btnCancelar = modal.querySelector("#btnCancelarEliminarCuenta");
  const errorDiv = modal.querySelector("#errorEliminarCuenta");

  passwordInput.addEventListener("input", () => {
    btnEliminar.disabled = passwordInput.value.length < 6;
    errorDiv.style.display = "none";
  });

  btnCancelar.onclick = () => {
    document.body.removeChild(overlay);
  };

  btnEliminar.onclick = async () => {
    btnEliminar.disabled = true;
    errorDiv.style.display = "none";
    await onConfirm(passwordInput.value, errorDiv, () => {
      document.body.removeChild(overlay);
    });
    btnEliminar.disabled = false;
  };
}

function mostrarNotificacionEliminado() {
  // Crear overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  // Crear notificación centrada
  const noti = document.createElement("div");
  noti.style.background = "#fff";
  noti.style.borderRadius = "16px";
  noti.style.boxShadow = "0 8px 32px rgba(50,115,91,0.18)";
  noti.style.padding = "36px 32px 28px 32px";
  noti.style.maxWidth = "350px";
  noti.style.width = "100%";
  noti.style.textAlign = "center";
  noti.innerHTML = `
    <h5 style="color:#32735B;font-weight:700;margin-bottom:18px;">Cuenta eliminada</h5>
    <p style="font-size:1.08rem;">Tu cuenta ha sido eliminada correctamente.<br><span style="color:#b30000;">Te extrañaremos...</span></p>
  `;

  overlay.appendChild(noti);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
    window.location.href = "/Paginas/Inicio/index.html";
  }, 3500);
}

async function eliminarCuenta() {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (!usuario || !usuario.uid) return;

  mostrarModalEliminarCuenta(async (password, errorDiv, closeModal) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        errorDiv.textContent = "Debes volver a iniciar sesión.";
        errorDiv.style.display = "block";
        return;
      }
      // Reautenticación
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Eliminar documento de Firestore
      await deleteDoc(doc(db, "usuarios", usuario.uid));
      // Eliminar usuario de autenticación
      await deleteUser(user);

      localStorage.removeItem("Usuario");
      localStorage.removeItem("cart");
      closeModal();
      mostrarNotificacionEliminado();
    } catch (e) {
      let msg = "Error al eliminar la cuenta. ";
      if (e.code === "auth/wrong-password") {
        msg = "Contraseña incorrecta.";
      } else if (e.code === "auth/too-many-requests") {
        msg = "Demasiados intentos. Intenta más tarde.";
      }
      errorDiv.textContent = msg;
      errorDiv.style.display = "block";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  document.getElementById("eliminarCuentaBtn").onclick = eliminarCuenta;
});
