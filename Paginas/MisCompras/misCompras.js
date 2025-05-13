import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// No import jsPDF, usa window.jspdf.jsPDF

// Función para mostrar notificaciones de estado de pedido
function mostrarNotificacionEstadoPedido(mensaje, tipo = "info") {
  // tipo: "info", "success", "warning", "danger"
  const colores = {
    info: "#32735B",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545"
  };
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.2)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const noti = document.createElement("div");
  noti.style.background = "#fff";
  noti.style.borderRadius = "14px";
  noti.style.boxShadow = "0 8px 32px rgba(50,115,91,0.18)";
  noti.style.padding = "28px 32px 22px 32px";
  noti.style.maxWidth = "350px";
  noti.style.width = "100%";
  noti.style.textAlign = "center";
  noti.style.border = `2px solid ${colores[tipo] || "#32735B"}`;
  noti.innerHTML = `
    <i class="bi bi-bell-fill" style="font-size:2rem;color:${colores[tipo]};margin-bottom:10px;"></i>
    <div style="font-size:1.08rem;color:${colores[tipo]};font-weight:600;">${mensaje}</div>
  `;

  overlay.appendChild(noti);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 3500);
}

async function cargarCompras() {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  const comprasContainer = document.getElementById("comprasContainer");
  comprasContainer.innerHTML = "<div class='text-center'>Cargando compras...</div>";

  if (!usuario || !usuario.uid) {
    comprasContainer.innerHTML = "<div class='alert alert-warning text-center'>Debes iniciar sesión para ver tus compras.</div>";
    return;
  }

  try {
    // Obtener compras desde la colección global "compras"
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const comprasGlobalSnapshot = await getDocs(collection(db, "compras"));
    // Filtrar solo las compras del usuario actual
    const comprasGlobalUsuario = [];
    comprasGlobalSnapshot.forEach(docu => {
      const compra = docu.data();
      if (compra.usuario && compra.usuario.uid === usuario.uid) {
        // Adjuntar el número de compra (últimos 6 caracteres del ID)
        compra.numeroCompra = "#" + docu.id.slice(-6).toUpperCase();
        comprasGlobalUsuario.push(compra);
      }
    });

    // Si no hay compras globales, mostrar mensaje
    if (comprasGlobalUsuario.length === 0) {
      comprasContainer.innerHTML = "<div class='alert alert-info text-center'>No tienes compras registradas.</div>";
      return;
    }

    // Mostrar las compras del usuario desde la colección global
    comprasContainer.innerHTML = comprasGlobalUsuario
      .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")) // Ordenar por fecha descendente
      .map((compra, idx) => {
        // Definir todos los posibles estados y sus estilos
        const estados = {
          pendiente: { label: "Pendiente", badge: "info" },
          despachado: { label: "Despachado", badge: "warning" },
          entregado: { label: "Entregado", badge: "success" },
          listo_retiro: { label: "Listo para el Retiro", badge: "primary" },
          cancelado: { label: "Cancelado", badge: "danger" },
          en_preparacion: { label: "En preparación", badge: "secondary" },
          otro: { label: "Otro", badge: "dark" }
        };
        const estadoKey = compra.estado || "pendiente";
        const estadoObj = estados[estadoKey] || { label: estadoKey.charAt(0).toUpperCase() + estadoKey.slice(1), badge: "secondary" };
        return `
        <div class="compra-card">
          <div class="compra-header">
            <span class="compra-num">Compra ${compra.numeroCompra || ""}</span>
            <span class="compra-fecha">${compra.fecha ? new Date(compra.fecha).toLocaleString() : "Sin fecha"}</span>
          </div>
          <div class="compra-body">
            <div class="compra-total">Total: $${compra.total || 0}</div>
            <div><b>Estado:</b> <span class="badge bg-${estadoObj.badge}">${estadoObj.label}</span></div>
            <div><b>Productos:</b></div>
            <ul class="compra-productos-list">
              ${
                Array.isArray(compra.productos) && compra.productos.length > 0
                  ? compra.productos.map(prod => `
                    <li class="compra-producto-item">
                      <span class="compra-producto-nombre">${prod.nombre}</span>
                      <span class="compra-producto-cantidad">x${prod.cantidad}</span>
                      <span class="compra-producto-precio">$${prod.precio}</span>
                    </li>
                  `).join("")
                  : "<li class='compra-producto-item'><span class='text-muted'>No hay productos</span></li>"
              }
            </ul>
            <div class="mt-3 d-flex gap-2 flex-wrap">
              <button class="btn btn-outline-success btn-sm descargar-boleta" data-idx="${idx}"><i class="bi bi-file-earmark-arrow-down"></i> Descargar boleta</button>
            </div>
          </div>
        </div>
        `;
      }).join("");

    // Botón Descargar Boleta (PDF tipo boleta)
    document.querySelectorAll('.descargar-boleta').forEach(btn => {
      btn.addEventListener('click', function() {
        const compra = comprasGlobalUsuario[btn.dataset.idx];
        if (!compra) return;
        const usuario = JSON.parse(localStorage.getItem("Usuario")) || {};
        const docPDF = new window.jspdf.jsPDF();

        // LOGO FERCOMET (ajusta la ruta si es necesario)
        const logoUrl = "/imagenes/Proyecto nuevo.png";
        const addLogoAndContinue = (logoDataUrl) => {
          // Encabezado con logo
          docPDF.addImage(logoDataUrl, "PNG", 15, 10, 35, 18);
          docPDF.setFontSize(18);
          docPDF.setTextColor(50, 115, 91);
          docPDF.text("FERCOMET", 105, 22, { align: "center" });
          docPDF.setFontSize(12);
          docPDF.setTextColor(60, 60, 60);
          docPDF.text("BOLETA DE COMPRA ELECTRÓNICA", 105, 30, { align: "center" });

          // Línea separadora
          docPDF.setDrawColor(50, 115, 91);
          docPDF.setLineWidth(0.7);
          docPDF.line(15, 34, 195, 34);

          // Datos del cliente y boleta
          docPDF.setFontSize(11);
          docPDF.setTextColor(0, 0, 0);
          docPDF.text(`Cliente:`, 15, 44);
          docPDF.text(`${usuario.nombre || ""} ${usuario.apellido || ""}`, 40, 44);
          docPDF.text(`RUT:`, 15, 50);
          docPDF.text(`${usuario.rut || "-"}`, 40, 50);
          docPDF.text(`Correo:`, 15, 56);
          docPDF.text(`${usuario.email || "-"}`, 40, 56);

          docPDF.text(`Fecha:`, 140, 44);
          docPDF.text(`${compra.fecha ? new Date(compra.fecha).toLocaleString() : "Sin fecha"}`, 160, 44);
          docPDF.text(`N° Boleta:`, 140, 50);
          docPDF.text(`${compra.numeroCompra || ""}`, 170, 50);

          // Segunda línea separadora
          docPDF.setDrawColor(200, 200, 200);
          docPDF.setLineWidth(0.3);
          docPDF.line(15, 60, 195, 60);

          // Tabla de productos
          let startY = 68;
          docPDF.setFontSize(12);
          docPDF.setTextColor(50, 115, 91);
          docPDF.text("Detalle de productos", 15, startY);
          startY += 7;

          // Encabezados tabla
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

          // Línea separadora antes del total
          startY += 2;
          docPDF.setDrawColor(200, 200, 200);
          docPDF.line(15, startY, 195, startY);
          startY += 8;

          // Total
          docPDF.setFont("helvetica", "bold");
          docPDF.setFontSize(13);
          docPDF.setTextColor(50, 115, 91);
          docPDF.text(`Total: $${compra.total || total}`, 180, startY, { align: "right" });

          // Pie de página
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
          // Si falla el logo, solo genera la boleta sin logo
          addLogoAndContinue("");
        };
        img.src = logoUrl;
      });
    });

  } catch (e) {
    comprasContainer.innerHTML = "<div class='alert alert-danger text-center'>Error al cargar tus compras.</div>";
  }
}

document.addEventListener("DOMContentLoaded", cargarCompras);
