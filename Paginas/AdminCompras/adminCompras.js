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
  return "#" + docId.slice(-6).toUpperCase();
}

let comprasGlobal = [];

function filtrarCompras(filtroEstado = "", numeroCompra = "", usuarioFiltro = "", fechaDesde = "", fechaHasta = "") {
  let comprasFiltradas = comprasGlobal;

  if (filtroEstado) {
    comprasFiltradas = comprasFiltradas.filter(c => (c.estado || "pendiente") === filtroEstado);
  }
  if (numeroCompra) {
    const num = numeroCompra.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    comprasFiltradas = comprasFiltradas.filter(c => {
      const numCompra = generarNumeroCompra(c._docId).replace("#", "").toUpperCase();
      return numCompra.includes(num);
    });
  }
  if (usuarioFiltro) {
    const usuarioLower = usuarioFiltro.toLowerCase();
    comprasFiltradas = comprasFiltradas.filter(c =>
      (c.usuario?.nombre || "").toLowerCase().includes(usuarioLower) ||
      (c.usuario?.apellido || "").toLowerCase().includes(usuarioLower) ||
      (c.usuario?.email || "").toLowerCase().includes(usuarioLower)
    );
  }
  if (fechaDesde) {
    const desde = new Date(fechaDesde);
    comprasFiltradas = comprasFiltradas.filter(c => c.fecha && c.fecha >= desde);
  }
  if (fechaHasta) {
    const hasta = new Date(fechaHasta);
    comprasFiltradas = comprasFiltradas.filter(c => c.fecha && c.fecha <= hasta);
  }
  return comprasFiltradas;
}

async function cargarCompras(filtroEstado = "", numeroCompra = "", usuarioFiltro = "", fechaDesde = "", fechaHasta = "") {
  const container = document.getElementById("comprasAdminContainer");
  container.innerHTML = "<div class='text-center'>Cargando compras...</div>";

  try {
    const comprasSnapshot = await getDocs(collection(db, "compras"));
    if (comprasSnapshot.empty) {
      container.innerHTML = "<div class='alert alert-info text-center'>No hay compras registradas.</div>";
      return;
    }

    comprasGlobal = [];
    comprasSnapshot.forEach((docu) => {
      const compra = docu.data();
      // Forzar fecha a tipo Date para el sort y filtrar correctamente
      let fechaCompra = null;
      if (compra.fecha instanceof Date) {
        fechaCompra = compra.fecha;
      } else if (typeof compra.fecha === "string" || typeof compra.fecha === "number") {
        const f = new Date(compra.fecha);
        fechaCompra = isNaN(f.getTime()) ? null : f;
      }
      comprasGlobal.push({
        ...compra,
        _docId: docu.id,
        fecha: fechaCompra
      });
    });

    // Ordenar por fecha descendente (más reciente primero)
    comprasGlobal.sort((a, b) => {
      const fechaA = a.fecha ? a.fecha.getTime() : 0;
      const fechaB = b.fecha ? b.fecha.getTime() : 0;
      return fechaB - fechaA;
    });

    // Filtrar por estado, número, usuario y fechas
    let comprasFiltradas = filtrarCompras(filtroEstado, numeroCompra, usuarioFiltro, fechaDesde, fechaHasta);

    let html = "";
    comprasFiltradas.forEach((compra) => {
      const estadoActual = compra.estado || "pendiente";
      const badgeClass = ESTADOS.find(e => e.value === estadoActual)?.badge || "badge-pendiente";
      const numeroCompra = generarNumeroCompra(compra._docId);
      html += `
        <div class="compra-card">
          <div class="compra-header d-flex justify-content-between align-items-center">
            <span><b>Compra ${numeroCompra}</b> - ${compra.fecha ? compra.fecha.toLocaleString() : "Sin fecha"}</span>
            <span class="badge ${badgeClass}" id="badge-estado-${compra._docId}">${ESTADOS.find(e => e.value === estadoActual)?.label || "Pendiente"}</span>
          </div>
          <div class="compra-body">
            <div>
              <b>Usuario:</b>
              <a href="/Paginas/AdminUsuarios/adminUsuarioDetalle.html?uid=${compra.usuario?.uid || ""}" target="_blank" style="text-decoration:underline;">
                ${compra.usuario?.nombre || "-"} ${compra.usuario?.apellido || ""} (${compra.usuario?.email || "-"})
              </a>
            </div>
            <div><b>RUT:</b> ${compra.usuario?.rut || "-"}</div>
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
            <div class="mt-2 d-flex flex-wrap gap-2 align-items-center">
              <label for="estado-${compra._docId}"><b>Estado:</b></label>
              <select class="form-select estado-select d-inline-block w-auto ms-2" id="estado-${compra._docId}">
                ${ESTADOS.map(e => `<option value="${e.value}" ${e.value === estadoActual ? "selected" : ""}>${e.label}</option>`).join("")}
              </select>
              <button class="btn btn-sm btn-primary ms-2" data-id="${compra._docId}" data-estado="${estadoActual}" data-uid="${compra.usuario?.uid || ''}" data-fecha="${compra.fecha ? compra.fecha.toISOString() : ''}">Actualizar</button>
              <button class="btn btn-outline-success btn-sm ms-2 descargar-boleta" data-id="${compra._docId}"><i class="bi bi-file-earmark-arrow-down"></i> Boleta</button>
            </div>
            <div class="mt-3">
              <label><b>Notas internas:</b></label>
              <textarea class="form-control nota-interna" data-id="${compra._docId}" rows="2" placeholder="Agregar nota interna...">${compra.notaInterna || ""}</textarea>
              <button class="btn btn-outline-secondary btn-sm mt-1 guardar-nota" data-id="${compra._docId}">Guardar nota</button>
            </div>
            ${estadoActual === "cancelado" ? `
              <div class="mt-3">
                <label><b>Motivo de cancelación:</b></label>
                <textarea class="form-control motivo-cancelacion" data-id="${compra._docId}" rows="2" placeholder="Motivo de cancelación...">${compra.motivoCancelacion || ""}</textarea>
                <button class="btn btn-outline-danger btn-sm mt-1 guardar-motivo-cancelacion" data-id="${compra._docId}">Guardar motivo</button>
                <button class="btn btn-outline-warning btn-sm mt-1 reponer-stock" data-id="${compra._docId}" ${compra.stockRepuesto ? 'disabled' : ''}>Reponer stock</button>
                ${compra.stockRepuesto ? `<span class="badge bg-success ms-2">Stock repuesto</span>` : ""}
              </div>
            ` : ""}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Guardar nota interna
    document.querySelectorAll('.guardar-nota').forEach(btn => {
      btn.onclick = async () => {
        const compraId = btn.dataset.id;
        const nota = container.querySelector(`.nota-interna[data-id="${compraId}"]`).value;
        await updateDoc(doc(db, "compras", compraId), { notaInterna: nota });
        btn.textContent = "Guardado";
        setTimeout(() => { btn.textContent = "Guardar nota"; }, 1200);
      };
    });

    // Guardar motivo de cancelación
    document.querySelectorAll('.guardar-motivo-cancelacion').forEach(btn => {
      btn.onclick = async () => {
        const compraId = btn.dataset.id;
        const motivo = container.querySelector(`.motivo-cancelacion[data-id="${compraId}"]`).value;
        await updateDoc(doc(db, "compras", compraId), { motivoCancelacion: motivo });
        btn.textContent = "Guardado";
        setTimeout(() => { btn.textContent = "Guardar motivo"; }, 1200);
      };
    });

    // Botón para reponer stock de productos cancelados
    document.querySelectorAll('.reponer-stock').forEach(btn => {
      // Si ya está deshabilitado (stockRepuesto), no asignar evento
      if (btn.disabled) return;
      btn.onclick = async () => {
        if (btn.disabled) return;
        btn.disabled = true;

        const compraId = btn.dataset.id;
        const compra = comprasGlobal.find(c => c._docId === compraId);
        if (!compra || !Array.isArray(compra.productos)) {
          alert("No se pudo encontrar la compra o los productos.");
          btn.disabled = false;
          return;
        }

        // Verificar si ya se repuso el stock (flag en la compra, actualizado en Firestore)
        if (compra.stockRepuesto) {
          btn.textContent = "Stock ya repuesto";
          btn.classList.remove("btn-outline-warning");
          btn.classList.add("btn-secondary");
          btn.disabled = true;
          return;
        }

        let errores = [];
        for (const prod of compra.productos) {
          try {
            let categoria = prod.categoria || prod.category;
            let idProd = prod.id;

            if (!categoria || !idProd) {
              const categorias = [
                "automotriz", "construccion", "electricidad", "gasfiteria", "griferia",
                "herramientas", "jardineria", "pinturas", "seguridad"
              ];
              let encontrado = false;
              for (const cat of categorias) {
                const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const itemsSnap = await getDocs(collection(db, "Products", cat, "items"));
                itemsSnap.forEach(docu => {
                  const data = docu.data();
                  if (
                    data.nombre === prod.nombre &&
                    (typeof data.precio === "number" ? data.precio : String(data.precio)) == prod.precio
                  ) {
                    categoria = cat;
                    idProd = docu.id;
                    encontrado = true;
                  }
                });
                if (encontrado) break;
              }
            }

            if (!categoria || !idProd) {
              errores.push(prod.nombre || prod.id || "Producto sin datos");
              continue;
            }

            const prodRef = doc(db, "Products", categoria, "items", idProd);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const prodData = prodSnap.data();
              let cantidadActual = typeof prodData.cantidad === "number"
                ? prodData.cantidad
                : (typeof prodData.cantidad === "string" && !isNaN(Number(prodData.cantidad)) ? Number(prodData.cantidad) : 0);
              await updateDoc(prodRef, { cantidad: cantidadActual + (prod.cantidad || 0) });
            } else {
              errores.push(prod.nombre || prod.id);
            }
          } catch (e) {
            errores.push(prod.nombre || prod.id);
          }
        }
        if (errores.length === 0) {
          // Marcar la compra como stock repuesto para evitar doble reposición
          await updateDoc(doc(db, "compras", compraId), { stockRepuesto: true });
          btn.textContent = "Stock repuesto";
          btn.classList.remove("btn-outline-warning");
          btn.classList.add("btn-success");
          btn.disabled = true;
          // Mostrar el mensaje visual tipo badge en la parte inferior central de la tarjeta
          mostrarBadgeStockRepuestoEnTarjeta(btn);
        } else {
          btn.disabled = false;
          alert("No se pudo reponer el stock de: " + errores.join(", "));
        }
      };
    });

    // Mostrar badge de stock repuesto en la parte inferior central de la tarjeta
    function mostrarBadgeStockRepuestoEnTarjeta(btn) {
      const compraCard = btn.closest('.compra-card');
      if (!compraCard) return;

      // Elimina badges previos si existen
      const prev = compraCard.querySelector(".stock-repuesto-badge-fercomet");
      if (prev) prev.remove();

      // Crear el badge
      const badge = document.createElement("div");
      badge.className = "stock-repuesto-badge-fercomet";
      badge.innerHTML = `<span>Stock repuesto</span>`;

      // Posicionar absolutamente en la parte inferior central de la tarjeta
      badge.style.position = "absolute";
      badge.style.left = "50%";
      badge.style.bottom = "18px";
      badge.style.transform = "translateX(-50%)";
      badge.style.background = "#28a745";
      badge.style.color = "#fff";
      badge.style.fontWeight = "bold";
      badge.style.fontSize = "1.08rem";
      badge.style.padding = "10px 32px";
      badge.style.borderRadius = "14px";
      badge.style.boxShadow = "0 4px 18px rgba(50,115,91,0.18)";
      badge.style.zIndex = "10";
      badge.style.textAlign = "center";
      badge.style.display = "inline-block";
      badge.style.animation = "fadeInStockRepuestoBadge 0.7s";

      // Asegurarse que la tarjeta tenga position: relative
      compraCard.style.position = "relative";
      compraCard.appendChild(badge);

      // Badge permanente, no se elimina automáticamente

      // Agregar animación CSS solo una vez
      if (!document.getElementById("fercomet-stock-repuesto-badge-css")) {
        const style = document.createElement("style");
        style.id = "fercomet-stock-repuesto-badge-css";
        style.innerHTML = `
          .stock-repuesto-badge-fercomet {
            pointer-events: none;
            background: #28a745;
            color: #fff;
            font-weight: bold;
            font-size: 1.08rem;
            padding: 10px 32px;
            border-radius: 14px;
            box-shadow: 0 4px 18px rgba(50,115,91,0.18);
            text-align: center;
            display: inline-block;
            min-width: 120px;
            letter-spacing: 0.5px;
            animation: fadeInStockRepuestoBadge 0.7s;
          }
          @keyframes fadeInStockRepuestoBadge {
            0% { opacity: 0; transform: translateX(-50%) scale(0.8);}
            100% { opacity: 1; transform: translateX(-50%) scale(1);}
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Asignar eventos a los botones de actualizar estado
    document.querySelectorAll('.btn.btn-primary[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const compraId = btn.getAttribute("data-id");
        const select = document.getElementById(`estado-${compraId}`);
        const nuevoEstado = select.value;
        const usuarioUid = btn.getAttribute("data-uid");
        const fechaCompra = btn.getAttribute("data-fecha");
        try {
          await updateDoc(doc(db, "compras", compraId), { estado: nuevoEstado });

          if (usuarioUid && fechaCompra) {
            const userDocRef = doc(db, "usuarios", usuarioUid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const comprasUsuario = userDoc.data().compras || [];
              const idxCompra = comprasUsuario.findIndex(c => c.fecha === fechaCompra);
              if (idxCompra !== -1) {
                comprasUsuario[idxCompra].estado = nuevoEstado;
                await updateDoc(userDocRef, { compras: comprasUsuario });

                const usuarioActual = JSON.parse(localStorage.getItem("Usuario"));
                if (usuarioActual && usuarioActual.uid === usuarioUid) {
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

    // Descargar boleta PDF (descarga la boleta correcta según el id de la compra)
    document.querySelectorAll('.descargar-boleta').forEach(btn => {
      btn.addEventListener('click', async function() {
        const compraId = btn.dataset.id;
        // Buscar la compra en el array global
        const compra = comprasGlobal.find(c => c._docId === compraId);
        if (!compra) return;

        // Cargar jsPDF si no está presente
        if (!window.jspdf || !window.jspdf.jsPDF) {
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
          script.onload = () => generarBoleta(compra);
          document.body.appendChild(script);
        } else {
          generarBoleta(compra);
        }

        function generarBoleta(compra) {
          const docPDF = new window.jspdf.jsPDF();

          // LOGO FERCOMET (ajusta la ruta si es necesario)
          const logoUrl = "/imagenes/Proyecto nuevo.png";
          const addLogoAndContinue = (logoDataUrl) => {
            if (logoDataUrl) {
              docPDF.addImage(logoDataUrl, "PNG", 15, 10, 35, 18);
            }
            docPDF.setFontSize(18);
            docPDF.setTextColor(50, 115, 91);
            docPDF.text("FERCOMET", 105, 22, { align: "center" });
            docPDF.setFontSize(12);
            docPDF.setTextColor(60, 60, 60);
            docPDF.text("BOLETA DE COMPRA ELECTRÓNICA", 105, 30, { align: "center" });

            docPDF.setDrawColor(50, 115, 91);
            docPDF.setLineWidth(0.7);
            docPDF.line(15, 34, 195, 34);

            docPDF.setFontSize(11);
            docPDF.setTextColor(0, 0, 0);
            docPDF.text(`Cliente:`, 15, 44);
            docPDF.text(`${compra.usuario?.nombre || ""} ${compra.usuario?.apellido || ""}`, 40, 44);
            docPDF.text(`RUT:`, 15, 50);
            docPDF.text(`${compra.usuario?.rut || "-"}`, 40, 50);
            docPDF.text(`Correo:`, 15, 56);
            docPDF.text(`${compra.usuario?.email || "-"}`, 40, 56);

            docPDF.text(`Fecha:`, 140, 44);
            docPDF.text(`${compra.fecha ? new Date(compra.fecha).toLocaleString() : "Sin fecha"}`, 160, 44);
            docPDF.text(`N° Boleta:`, 140, 50);
            docPDF.text(`${generarNumeroCompra(compra._docId)}`, 170, 50);

            docPDF.setDrawColor(200, 200, 200);
            docPDF.setLineWidth(0.3);
            docPDF.line(15, 60, 195, 60);

            let startY = 68;
            docPDF.setFontSize(12);
            docPDF.setTextColor(50, 115, 91);
            docPDF.text("Detalle de productos", 15, startY);
            startY += 7;

            docPDF.setFont("helvetica", "bold");
            docPDF.setFontSize(11);
            docPDF.setTextColor(0, 0, 0);
            docPDF.text("Producto", 15, startY);
            docPDF.text("Cantidad", 90, startY, { align: "right" });
            docPDF.text("Precio", 130, startY, { align: "right" });
            docPDF.text("Subtotal", 180, startY, { align: "right" });
            docPDF.setFont("helvetica", "normal");
            startY += 6;

            let total = 0;
            (compra.productos || []).forEach(prod => {
              const subtotal = prod.precio * prod.cantidad;
              total += subtotal;
              docPDF.text(String(prod.nombre), 15, startY);
              docPDF.text(String(prod.cantidad), 95, startY, { align: "right" });
              docPDF.text(`$${prod.precio}`, 130, startY, { align: "right" });
              docPDF.text(`$${subtotal}`, 180, startY, { align: "right" });
              startY += 7;
            });

            startY += 2;
            docPDF.setDrawColor(200, 200, 200);
            docPDF.line(15, startY, 195, startY);
            startY += 8;

            docPDF.setFont("helvetica", "bold");
            docPDF.setFontSize(13);
            docPDF.setTextColor(50, 115, 91);
            docPDF.text(`Total: $${compra.total || total}`, 180, startY, { align: "right" });

            docPDF.setFontSize(10);
            docPDF.setFont("helvetica", "normal");
            docPDF.setTextColor(120, 120, 120);
            docPDF.text("Gracias por tu compra en Fercomet", 105, 285, { align: "center" });

            docPDF.save(`boleta-fercomet-${compra.fecha ? new Date(compra.fecha).getTime() : Date.now()}.pdf`);
          };

          // Cargar logo como base64 y continuar
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            addLogoAndContinue(dataURL);
          };
          img.onerror = function() {
            addLogoAndContinue("");
          };
          img.src = logoUrl;
        }
      });
    });

    // Exportar compras a CSV
    document.getElementById("btnExportarCompras").onclick = () => {
      let csv = "N°Compra,Fecha,Usuario,Email,RUT,Total,Estado,Productos,Notas\n";
      comprasFiltradas.forEach(c => {
        const productos = (c.productos || []).map(p => `${p.nombre} x${p.cantidad}`).join(" | ");
        csv += `"${generarNumeroCompra(c._docId)}","${c.fecha ? c.fecha.toLocaleString() : ""}","${c.usuario?.nombre || ""} ${c.usuario?.apellido || ""}","${c.usuario?.email || ""}","${c.usuario?.rut || ""}","${c.total || 0}","${c.estado || ""}","${productos}","${(c.notaInterna || "").replace(/"/g, "'")}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compras-fercomet.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

  } catch (e) {
    container.innerHTML = "<div class='alert alert-danger text-center'>Error al cargar las compras.</div>";
  }
}

// Evento para el filtro de estado y búsqueda por número de compra
document.addEventListener("DOMContentLoaded", () => {
  cargarCompras();

  const filtroEstado = document.getElementById("filtroEstado");
  const busquedaNumeroCompra = document.getElementById("busquedaNumeroCompra");
  const busquedaUsuario = document.getElementById("busquedaUsuario");
  const filtroFechaDesde = document.getElementById("filtroFechaDesde");
  const filtroFechaHasta = document.getElementById("filtroFechaHasta");
  const btnBuscarNumeroCompra = document.getElementById("btnBuscarNumeroCompra");
  const btnLimpiarBusqueda = document.getElementById("btnLimpiarBusqueda");

  function aplicarFiltros() {
    cargarCompras(
      filtroEstado.value,
      busquedaNumeroCompra.value,
      busquedaUsuario.value,
      filtroFechaDesde.value,
      filtroFechaHasta.value
    );
  }

  if (filtroEstado) filtroEstado.addEventListener("change", aplicarFiltros);
  if (busquedaNumeroCompra) busquedaNumeroCompra.addEventListener("input", aplicarFiltros);
  if (busquedaUsuario) busquedaUsuario.addEventListener("input", aplicarFiltros);
  if (filtroFechaDesde) filtroFechaDesde.addEventListener("change", aplicarFiltros);
  if (filtroFechaHasta) filtroFechaHasta.addEventListener("change", aplicarFiltros);
  if (btnBuscarNumeroCompra) btnBuscarNumeroCompra.addEventListener("click", aplicarFiltros);
  if (btnLimpiarBusqueda) btnLimpiarBusqueda.addEventListener("click", () => {
    busquedaNumeroCompra.value = "";
    busquedaUsuario.value = "";
    filtroFechaDesde.value = "";
    filtroFechaHasta.value = "";
    filtroEstado.value = "";
    cargarCompras();
  });
});
