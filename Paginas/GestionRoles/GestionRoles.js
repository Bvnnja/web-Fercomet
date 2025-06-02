import { db } from "../../Servicios/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuariosCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  await cargarUsuarios();
  agregarFiltros();
});

async function cargarUsuarios() {
  const tbody = document.querySelector("#personasTable tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="text-center">Cargando usuarios...</td></tr>`;

  try {
    const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
    if (usuariosSnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay usuarios registrados.</td></tr>`;
      usuariosCache = [];
      return;
    }

    usuariosCache = [];
    usuariosSnapshot.forEach((docu) => {
      const usuario = docu.data();
      const uid = docu.id;
      usuariosCache.push({ ...usuario, uid });
    });

    renderUsuarios(usuariosCache);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar los usuarios.</td></tr>`;
  }
}

function renderUsuarios(usuarios) {
  const tbody = document.querySelector("#personasTable tbody");
  if (!tbody) return;
  if (!usuarios || usuarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">No hay usuarios que coincidan con la búsqueda.</td></tr>`;
    return;
  }

  let html = "";
  usuarios.forEach((usuario) => {
    const rolActual = usuario.rol || "usuario";
    html += `
      <tr>
        <td>${usuario.nombre || ""} ${usuario.apellido || ""}</td>
        <td>${usuario.email || ""}</td>
        <td>${usuario.rut || ""}</td>
        <td>
          <select class="rol-select" data-uid="${usuario.uid}">
            <option value="usuario" ${rolActual === "usuario" ? "selected" : ""}>Usuario</option>
            <option value="vendedor" ${rolActual === "vendedor" ? "selected" : ""}>Vendedor</option>
            <option value="administrativo" ${rolActual === "administrativo" ? "selected" : ""}>Administrativo</option>
          </select>
        </td>
        <td>
          <button class="btn-actualizar-rol" data-uid="${usuario.uid}">Actualizar</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Actualización individual
  tbody.querySelectorAll(".btn-actualizar-rol").forEach(btn => {
    btn.addEventListener("click", async () => {
      const uid = btn.dataset.uid;
      const select = tbody.querySelector(`.rol-select[data-uid="${uid}"]`);
      const nuevoRol = select.value;
      try {
        await updateDoc(doc(db, "usuarios", uid), { rol: nuevoRol });
        alert("Rol actualizado correctamente.");
      } catch (e) {
        alert("Error al actualizar el rol del usuario.");
      }
    });
  });
}

function agregarFiltros() {
  const tabla = document.getElementById("personasTable");
  if (!tabla) return;

  // Si ya existe el contenedor de filtros, no lo agregues de nuevo
  if (document.getElementById("filtrosUsuariosContainer")) return;

  const container = document.createElement("div");
  container.id = "filtrosUsuariosContainer";
  container.style.margin = "18px 0";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "12px";
  container.innerHTML = `
    <input type="text" id="filtroBusqueda" placeholder="Buscar por nombre, apellido, email o RUT" style="padding:6px 12px;border-radius:6px;width:260px;">
    <select id="filtroRol" style="padding:6px 12px;border-radius:6px;">
      <option value="">Todos los roles</option>
      <option value="usuario">Usuario</option>
      <option value="vendedor">Vendedor</option>
      <option value="administrativo">Administrativo</option>
    </select>
    <button id="btnReiniciarFiltros" style="padding:8px 14px;border-radius:6px;background:#aaa;color:#fff;font-weight:600;border:none;">Reiniciar filtros</button>
  `;

  tabla.parentNode.insertBefore(container, tabla);

  // Filtro en tiempo real
  document.getElementById("filtroBusqueda").addEventListener("input", aplicarFiltrosUsuarios);
  document.getElementById("filtroRol").addEventListener("change", aplicarFiltrosUsuarios);

  // Reiniciar filtros
  document.getElementById("btnReiniciarFiltros").addEventListener("click", () => {
    document.getElementById("filtroBusqueda").value = "";
    document.getElementById("filtroRol").value = "";
    renderUsuarios(usuariosCache);
  });
}

function aplicarFiltrosUsuarios() {
  const busqueda = document.getElementById("filtroBusqueda").value.trim().toLowerCase();
  const rol = document.getElementById("filtroRol").value;

  let filtrados = usuariosCache.filter(u => {
    let coincide = true;
    // Considerar "usuario" si el campo rol está vacío o no existe
    const rolUsuario = u.rol ? u.rol : "usuario";
    if (busqueda) {
      coincide = (
        (u.nombre && u.nombre.toLowerCase().includes(busqueda)) ||
        (u.apellido && u.apellido.toLowerCase().includes(busqueda)) ||
        (u.email && u.email.toLowerCase().includes(busqueda)) ||
        (u.rut && u.rut.toLowerCase().includes(busqueda))
      );
    }
    if (rol) {
      coincide = coincide && rolUsuario === rol;
    }
    return coincide;
  });

  renderUsuarios(filtrados);
}
