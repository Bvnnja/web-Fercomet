import { db } from "../../Servicios/firebaseConfig.js";
import { collection, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", badge: "badge-pendiente" },
  { value: "despachado", label: "Despachado", badge: "badge-despachado" },
  { value: "entregado", label: "Entregado", badge: "badge-entregado" },
  { value: "listo_retiro", label: "Listo para el Retiro", badge: "badge-primary" },
  { value: "en_preparacion", label: "En preparación", badge: "badge-secondary" },
  { value: "cancelado", label: "Cancelado", badge: "badge-danger" },
  { value: "otro", label: "Otro", badge: "badge-dark" }
];

// Generar un número de compra único basado en el ID de Firestore
function generarNumeroCompra(docId) {
  // Toma los últimos 6 caracteres del ID y los convierte a mayúsculas
  return "#" + docId.slice(-6).toUpperCase();
}

async function cargarCompras() {
  const container = document.getElementById("comprasAdminContainer");
  container.innerHTML = "<div class='text-center'>Cargando compras...</div>";

  try {
    const comprasSnapshot = await getDocs(collection(db, "compras"));
    if (comprasSnapshot.empty) {
      container.innerHTML = "<div class='alert alert-info text-center'>No hay compras registradas.</div>";
      return;
    }

    let html = "";
    comprasSnapshot.forEach((docu, idx) => {
      const compra = docu.data();
      const estadoActual = compra.estado || "pendiente";
      const badgeClass = ESTADOS.find(e => e.value === estadoActual)?.badge || "badge-pendiente";
      const numeroCompra = generarNumeroCompra(docu.id);
      html += `
        <div class="compra-card">
          <div class="compra-header d-flex justify-content-between align-items-center">
            <span><b>Compra ${numeroCompra}</b> - ${compra.fecha ? new Date(compra.fecha).toLocaleString() : "Sin fecha"}</span>
            <span class="badge ${badgeClass}" id="badge-estado-${docu.id}">${ESTADOS.find(e => e.value === estadoActual)?.label || "Pendiente"}</span>
          </div>
          <div class="compra-body">
            <div><b>Usuario:</b> ${compra.usuario?.nombre || "-"} ${compra.usuario?.apellido || ""} (${compra.usuario?.email || "-"})</div>
            <div><b>Total:</b> $${compra.total || 0}</div>
            <div><b>Productos:</b>
              <ul>
                ${
                  Array.isArray(compra.productos) && compra.productos.length > 0
                    ? compra.productos.map(prod => `
                      <li>
                        ${prod.nombre} - Cantidad: ${prod.cantidad} - Precio: $${prod.precio}
                      </li>
                    `).join("")
                    : "<li>No hay productos</li>"
                }
              </ul>
            </div>
            <div class="mt-2">
              <label for="estado-${docu.id}"><b>Estado:</b></label>
              <select class="form-select estado-select d-inline-block w-auto ms-2" id="estado-${docu.id}">
                ${ESTADOS.map(e => `<option value="${e.value}" ${e.value === estadoActual ? "selected" : ""}>${e.label}</option>`).join("")}
              </select>
              <button class="btn btn-sm btn-primary ms-2" data-id="${docu.id}" data-estado="${estadoActual}" data-uid="${compra.usuario?.uid || ''}" data-fecha="${compra.fecha || ''}">Actualizar</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Asignar eventos a los botones de actualizar estado
    document.querySelectorAll('.btn.btn-primary[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const compraId = btn.getAttribute("data-id");
        const select = document.getElementById(`estado-${compraId}`);
        const nuevoEstado = select.value;
        const usuarioUid = btn.getAttribute("data-uid");
        const fechaCompra = btn.getAttribute("data-fecha");
        try {
          // Actualizar estado en la colección global "compras"
          await updateDoc(doc(db, "compras", compraId), { estado: nuevoEstado });

          // Actualizar estado en el array de compras del usuario
          if (usuarioUid && fechaCompra) {
            const userDocRef = doc(db, "usuarios", usuarioUid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const comprasUsuario = userDoc.data().compras || [];
              const idxCompra = comprasUsuario.findIndex(c => c.fecha === fechaCompra);
              if (idxCompra !== -1) {
                comprasUsuario[idxCompra].estado = nuevoEstado;
                await updateDoc(userDocRef, { compras: comprasUsuario });

                // Guardar notificación pendiente para el usuario (solo si es el usuario logueado)
                const usuarioActual = JSON.parse(localStorage.getItem("Usuario"));
                if (usuarioActual && usuarioActual.uid === usuarioUid) {
                  // Mensaje personalizado según estado
                  const estados = {
                    pendiente: { label: "Pendiente", tipo: "info" },
                    despachado: { label: "Despachado", tipo: "warning" },
                    entregado: { label: "Entregado", tipo: "success" },
                    listo_retiro: { label: "Listo para el Retiro", tipo: "primary" },
                    cancelado: { label: "Cancelado", tipo: "danger" },
                    en_preparacion: { label: "En preparación", tipo: "secondary" },
                    otro: { label: "Otro", tipo: "dark" }
                  };
                  const estadoObj = estados[nuevoEstado] || { label: nuevoEstado, tipo: "info" };
                  const mensaje = `El estado de tu compra ha cambiado a: <b>${estadoObj.label}</b>`;
                  sessionStorage.setItem("notiEstadoCompraPendiente", JSON.stringify({ mensaje, tipo: estadoObj.tipo }));
                }
              }
            }
          }

          // Actualizar badge visualmente
          const badge = document.getElementById(`badge-estado-${compraId}`);
          const estadoObj = ESTADOS.find(e => e.value === nuevoEstado);
          badge.textContent = estadoObj.label;
          badge.className = `badge ${estadoObj.badge}`;
          btn.textContent = "Actualizado";
          btn.classList.remove("btn-primary");
          btn.classList.add("btn-success");
          setTimeout(() => {
            btn.textContent = "Actualizar";
            btn.classList.remove("btn-success");
            btn.classList.add("btn-primary");
          }, 1500);
        } catch (e) {
          alert("Error al actualizar el estado de la compra.");
        }
      });
    });
  } catch (e) {
    container.innerHTML = "<div class='alert alert-danger text-center'>Error al cargar las compras.</div>";
  }
}

document.addEventListener("DOMContentLoaded", cargarCompras);
