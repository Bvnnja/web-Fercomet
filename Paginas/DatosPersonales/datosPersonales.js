import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const container = document.getElementById("datosPersonalesContainer");

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
          <div class="col-sm-7">
            <input type="text" class="form-control" id="nombre" value="${datos.nombre || ""}" disabled>
          </div>
          <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-link editar-btn" data-field="nombre"><i class="bi bi-pencil"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">Apellido</label>
          <div class="col-sm-7">
            <input type="text" class="form-control" id="apellido" value="${datos.apellido || ""}" disabled>
          </div>
          <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-link editar-btn" data-field="apellido"><i class="bi bi-pencil"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">RUT</label>
          <div class="col-sm-7">
            <input type="text" class="form-control" id="rut" value="${datos.rut || ""}" disabled>
          </div>
          <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-link editar-btn" data-field="rut"><i class="bi bi-pencil"></i></button>
          </div>
        </div>
        <div class="mb-3 row align-items-center">
          <label class="col-sm-3 col-form-label">Correo</label>
          <div class="col-sm-7">
            <input type="email" class="form-control" id="email" value="${datos.email || ""}" disabled>
          </div>
          <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-link editar-btn" data-field="email"><i class="bi bi-pencil"></i></button>
          </div>
        </div>
        <div class="text-center">
          <button type="submit" class="btn btn-success" id="guardarCambiosBtn" style="display:none;">Guardar cambios</button>
        </div>
      </form>
      <div id="mensajeDatos" class="mt-3"></div>
    `;

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

    // Guardar cambios
    document.getElementById("formDatosPersonales").addEventListener("submit", async function(e) {
      e.preventDefault();
      const nombre = document.getElementById("nombre").value.trim();
      const apellido = document.getElementById("apellido").value.trim();
      const rut = document.getElementById("rut").value.trim();
      const email = document.getElementById("email").value.trim();

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
