import { db } from "../../Servicios/firebaseConfig.js";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProductsCache = []; // Cache para almacenar los productos

// Función para obtener productos aleatorios
function getRandomProducts(products, count) {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Notificación de estado de compra abajo a la derecha, llamativa y 4 segundos
function mostrarNotificacionEstadoCompra(mensaje, tipo = "info", identificador = "", compraUid = "", nombreProducto = "") {
  const colores = {
    info: "#32735B",
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    primary: "#0d6efd",
    secondary: "#6c757d",
    dark: "#212529"
  };
  const noti = document.createElement("div");
  noti.className = "noti-estado-compra-fercomet";
  noti.style.position = "fixed";
  noti.style.bottom = "30px";
  noti.style.right = "30px";
  noti.style.background = "#fff";
  noti.style.borderRadius = "14px";
  noti.style.boxShadow = "0 8px 32px rgba(50,115,91,0.18)";
  noti.style.padding = "22px 32px 18px 32px";
  noti.style.maxWidth = "350px";
  noti.style.width = "100%";
  noti.style.textAlign = "center";
  noti.style.border = `3px solid ${colores[tipo] || "#32735B"}`;
  noti.style.zIndex = "9999";
  noti.style.fontWeight = "bold";
  noti.style.fontSize = "1.08rem";
  noti.style.color = colores[tipo] || "#32735B";
  noti.style.display = "flex";
  noti.style.flexDirection = "column";
  noti.style.alignItems = "center";
  noti.style.animation = "fadeInOutFercomet 4s";

  // Formato: El estado de tu compra ha cambiado a: Entregado | LENTE SEGURIDAD FCL
  let mensajeFinal = mensaje;
  if (nombreProducto) {
    // Elimina cualquier texto "(Producto: ...)" o similar
    mensajeFinal = mensaje.replace(/\(Producto:.*?\)/gi, "").replace(/Producto:/gi, "").replace(/\s{2,}/g, " ").trim();
    // Si el mensaje ya contiene "ha cambiado a:" o "es:", agrega el producto después con "|"
    if (!mensajeFinal.includes('|')) {
      mensajeFinal += ` | ${nombreProducto}`;
    }
  }

  noti.innerHTML = `
    <i class="bi bi-bell-fill" style="font-size:2.2rem;color:${colores[tipo]};margin-bottom:10px;"></i>
    <div>
      ${mensajeFinal}
      ${identificador ? `<span class="badge bg-primary ms-2">${identificador}</span>` : ""}
      ${compraUid ? `<div style="font-size:0.95rem;margin-top:6px;"><b>UID:</b> <span style="color:#666">${compraUid}</span></div>` : ""}
    </div>
  `;

  document.body.appendChild(noti);

  setTimeout(() => {
    noti.remove();
  }, 4000);

  // En la campanilla solo el nombre del producto
  if (window.agregarNotificacionFercomet) {
    window.agregarNotificacionFercomet(
      mensajeFinal,
      tipo
    );
  }
}

// Animación CSS para la notificación (agrega esto solo una vez)
if (!document.getElementById("fercomet-noti-estado-css")) {
  const style = document.createElement("style");
  style.id = "fercomet-noti-estado-css";
  style.innerHTML = `
    @keyframes fadeInOutFercomet {
      0% { opacity: 0; transform: translateY(40px);}
      10%, 90% { opacity: 1; transform: translateY(0);}
      100% { opacity: 0; transform: translateY(40px);}
    }
    .noti-estado-compra-fercomet {
      animation: fadeInOutFercomet 4s;
    }
  `;
  document.head.appendChild(style);
}

// Cargar productos en un carrusel
async function loadProductsCarousel() {
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "";

  if (allProductsCache.length === 0) {
    const categories = ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];
    for (const category of categories) {
      const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        allProductsCache.push({ ...data, category, id: docu.id });
      });
    }
  }

  const carouselInner = document.createElement("div");
  carouselInner.classList.add("carousel-inner");

  const randomProducts = getRandomProducts(allProductsCache, allProductsCache.length);
  const productGroups = [];
  for (let i = 0; i < randomProducts.length; i += 3) {
    productGroups.push(randomProducts.slice(i, i + 3));
  }

  productGroups.forEach((group, index) => {
    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel-item");
    if (index === 0) carouselItem.classList.add("active");

    const groupContent = group
      .map(
        (product) => `
        <div class="col-md-4">
          <div class="card" style="cursor: pointer;">
            <div class="product-info" data-id="${product.id}" data-category="${product.category}">
              <img src="${product.imagenUrl}" class="card-img-top" alt="${product.nombre}">
              <div class="card-body text-center">
                <h5 class="card-title">${product.nombre}</h5>
                <p class="card-text">Precio: $${product.precio}</p>
                <p class="card-text" style="color: ${product.cantidad > 0 ? '#6c757d' : 'red'};">
                  ${product.cantidad > 0 ? `Disponibles: ${product.cantidad}` : 'Sin stock'}
                </p>
              </div>
            </div>
            <button class="btn btn-primary add-to-cart" data-category="${product.category}" data-id="${product.id}" data-nombre="${product.nombre}" data-precio="${product.precio}" data-stock="${product.cantidad}" ${product.cantidad === 0 ? 'disabled' : ''}>
              Agregar al carrito
            </button>
          </div>
        </div>
      `
      )
      .join("");

    carouselItem.innerHTML = `<div class="row justify-content-center">${groupContent}</div>`;
    carouselInner.appendChild(carouselItem);
  });

  const carousel = `
    <div id="productCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
      ${carouselInner.outerHTML}
      <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Anterior</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Siguiente</span>
      </button>
    </div>
  `;

  productContainer.innerHTML = carousel;

  // Añadir eventos para redirigir al detalle del producto
  document.querySelectorAll(".product-info").forEach((card) => {
    card.addEventListener("click", () => {
      const productId = card.dataset.id;
      const category = card.dataset.category;
      if (productId && category) {
        // Guardar el producto seleccionado en sessionStorage para el detalle
        const productoSeleccionado = allProductsCache.find(
          p => p.id === productId && p.category === category
        );
        if (productoSeleccionado) {
          sessionStorage.setItem("productoDetalle", JSON.stringify(productoSeleccionado));
        }
        const queryParams = new URLSearchParams({ id: productId, category }).toString();
        window.location.href = `/Paginas/DetalleProducto/productoDetalle.html?${queryParams}`;
      } else {
        console.error("Faltan datos del producto para redirigir al detalle.");
      }
    });
  });

  // Añadir eventos a los botones de agregar al carrito
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Evitar que el clic en el botón active el evento de la tarjeta
      const category = button.dataset.category;
      const productId = button.dataset.id;
      const name = button.dataset.nombre;
      const price = parseFloat(button.dataset.precio);
      const available = parseInt(button.dataset.stock);
      const imageUrl = button.closest(".card").querySelector("img").src; // Obtener la URL de la imagen

      if (available <= 0) {
        mostrarMensajeNoStock(name);
        return;
      }

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingProductIndex = cart.findIndex((item) => item.productId === productId);

      if (existingProductIndex !== -1) {
        if (cart[existingProductIndex].cantidad < available) {
          cart[existingProductIndex].cantidad += 1;
        } else {
          mostrarMensajeNoStock(name);
          return;
        }
      } else {
        cart.push({ category, productId, name, price, cantidad: 1, imageUrl }); // Incluir imagenUrl
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      guardarCarritoUsuario(cart); // Guardar también en Firestore
      mostrarMensajeExito(name);
      window.dispatchEvent(new Event("carritoActualizado"));
    });
  });
}

// Guardar carrito en Firestore para el usuario autenticado
async function guardarCarritoUsuario(cart) {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (usuario && usuario.uid) {
    try {
      const userDocRef = doc(db, "usuarios", usuario.uid);
      await updateDoc(userDocRef, { carrito: cart });
    } catch (e) {
      console.error("No se pudo actualizar el carrito en Firestore:", e);
    }
  }
}

// Función para mostrar el mensaje de éxito
function mostrarMensajeExito(nombreProducto) {
  const mensaje = document.createElement("div");
  mensaje.className = "mensaje-exito position-fixed bottom-0 end-0 m-3 p-3 bg-success text-white rounded shadow";
  mensaje.style.zIndex = "1050";
  mensaje.innerHTML = `<strong>¡Producto "${nombreProducto}" agregado al carrito con éxito!</strong>`;

  document.body.appendChild(mensaje);

  setTimeout(() => {
    mensaje.remove();
  }, 4000); // El mensaje desaparece después de 4 segundos
}

// Función para mostrar el mensaje de error (sin stock)
function mostrarMensajeNoStock(nombreProducto) {
  const mensaje = document.createElement("div");
  mensaje.className = "mensaje-error position-fixed bottom-0 end-0 m-3 p-3 bg-danger text-white rounded shadow";
  mensaje.style.zIndex = "1050";
  mensaje.innerHTML = `<strong>El producto "${nombreProducto}" no tiene stock disponible.</strong>`;

  document.body.appendChild(mensaje);

  setTimeout(() => {
    mensaje.remove();
  }, 4000); // El mensaje desaparece después de 4 segundos
}

// Mostrar notificación de estado de compra al cargar el index si el usuario tiene compras
document.addEventListener("DOMContentLoaded", async () => {
  await loadProductsCarousel();

  // Notificación por cambio de estado en tiempo real (solo si hay usuario)
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (usuario && usuario.uid) {
    const userDocRef = doc(db, "usuarios", usuario.uid);

    // Guardar último estado conocido de cada compra en memoria
    let ultimoEstadoPorCompra = {};

    // Inicializar con los estados actuales
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (Array.isArray(userData.compras)) {
        userData.compras.forEach(compra => {
          if (compra.fecha) {
            ultimoEstadoPorCompra[compra.fecha] = compra.estado || "pendiente";
          }
        });
      }
    }

    // Suscribirse a cambios en tiempo real
    onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (Array.isArray(userData.compras)) {
          userData.compras.forEach(compra => {
            if (compra.fecha) {
              const estadoAnterior = ultimoEstadoPorCompra[compra.fecha];
              const estadoActual = compra.estado || "pendiente";
              if (estadoAnterior && estadoAnterior !== estadoActual) {
                const estados = {
                  pendiente: { label: "Pendiente", tipo: "info" },
                  despachado: { label: "Despachado", tipo: "warning" },
                  entregado: { label: "Entregado", tipo: "success" },
                  listo_retiro: { label: "Listo para el Retiro", tipo: "primary" },
                  cancelado: { label: "Cancelado", tipo: "danger" },
                  en_preparacion: { label: "En preparación", tipo: "secondary" },
                  otro: { label: "Otro", tipo: "dark" }
                };
                const estadoObj = estados[estadoActual] || { label: estadoActual, tipo: "info" };
                const identificador = compra.numeroCompra ? compra.numeroCompra : "";
                const compraUid = compra.uid || compra.uidCompra || ""; // Ajusta según cómo guardes el UID de la compra
                const nombreProducto = Array.isArray(compra.productos) && compra.productos.length > 0
                  ? compra.productos.map(p => p.nombre).join(", ")
                  : "";
                mostrarNotificacionEstadoCompra(
                  `El estado de tu compra ha cambiado a: <b>${estadoObj.label}</b>`,
                  estadoObj.tipo,
                  identificador,
                  compraUid,
                  nombreProducto
                );
              }
              ultimoEstadoPorCompra[compra.fecha] = estadoActual;
            }
          });
        }
      }
    });
  }

  // Solo mostrar si hay una notificación pendiente en sessionStorage
  const notiCompra = sessionStorage.getItem("notiEstadoCompraPendiente");
  if (notiCompra) {
    try {
      const data = JSON.parse(notiCompra);
      if (data && data.mensaje && data.tipo) {
        let identificador = "";
        let nombreProducto = "";
        const match = data.mensaje.match(/#([A-Z0-9]{6,})/i);
        if (match) identificador = match[0];
        mostrarNotificacionEstadoCompra(data.mensaje, data.tipo, identificador, "", nombreProducto);
      }
    } catch {}
    sessionStorage.removeItem("notiEstadoCompraPendiente");
  }

  // Mostrar notificación de estado de compra SOLO si el usuario acaba de iniciar sesión
  if (usuario && usuario.uid && sessionStorage.getItem("mostrarNotiEstadoCompra") === "1") {
    try {
      const userDocRef = doc(db, "usuarios", usuario.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (Array.isArray(userData.compras) && userData.compras.length > 0) {
          const estados = {
            pendiente: { label: "Pendiente", tipo: "info" },
            despachado: { label: "Despachado", tipo: "warning" },
            entregado: { label: "Entregado", tipo: "success" },
            listo_retiro: { label: "Listo para el Retiro", tipo: "primary" },
            cancelado: { label: "Cancelado", tipo: "danger" },
            en_preparacion: { label: "En preparación", tipo: "secondary" },
            otro: { label: "Otro", tipo: "dark" }
          };
          userData.compras
            .slice()
            .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""))
            .slice(0, 3)
            .forEach(compra => {
              if (compra.estado) {
                const estadoKey = compra.estado;
                const estadoObj = estados[estadoKey] || { label: estadoKey, tipo: "info" };
                const identificador = compra.numeroCompra ? compra.numeroCompra : "";
                const nombreProducto = Array.isArray(compra.productos) && compra.productos.length > 0
                  ? compra.productos.map(p => p.nombre).join(", ")
                  : "";
                mostrarNotificacionEstadoCompra(
                  `El estado de tu compra es: <b>${estadoObj.label}</b>`,
                  estadoObj.tipo,
                  identificador,
                  "",
                  nombreProducto
                );
              }
            });
        }
      }
    } catch (e) {
      console.error("No se pudo obtener el estado de la compra:", e);
    }
    sessionStorage.removeItem("mostrarNotiEstadoCompra");
  }
});
