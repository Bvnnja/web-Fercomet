import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, updateDoc as updateFirestoreDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const category = urlParams.get('category');

// Detectar desde dónde llegó el usuario (index o productos)
const referrer = document.referrer;
let volverDestino = "/Paginas/Productos/productos.html";
if (referrer.includes("/Paginas/Inicio/index.html")) {
  volverDestino = "/Paginas/Inicio/index.html";
}

// Formatear número con puntos de miles
function formatearCLP(num) {
  return Number(num).toLocaleString('es-CL');
}

async function loadProductDetail() {
  if (!productId || !category) {
    alert("Producto no encontrado.");
    return;
  }

  // Intentar obtener el producto desde sessionStorage (si viene del index)
  let product = null;
  const productoSession = sessionStorage.getItem("productoDetalle");
  if (productoSession) {
    const prod = JSON.parse(productoSession);
    if (prod && prod.id === productId && prod.category === category) {
      product = prod;
    }
  }

  try {
    if (!product) {
      // Si no está en sessionStorage, cargar desde Firestore
      const productDoc = await getDoc(doc(db, "Products", category, "items", productId));
      if (!productDoc.exists()) {
        alert("Producto no encontrado.");
        return;
      }
      product = productDoc.data();
    }

    const productDetailContainer = document.getElementById("productDetail");
    const descriptionTab = document.getElementById("description");

    // Actualizar la descripción en la pestaña "Descripción"
    descriptionTab.innerHTML = `<p class="mt-3">${product.descripcion || "No disponible"}</p>`;

    productDetailContainer.innerHTML = `
      <div class="col-md-6">
        <img src="${product.imagenUrl}" alt="${product.nombre}" class="img-fluid">
      </div>
      <div class="col-md-6">
        <h1>${product.nombre}</h1>
        <p><strong>Precio:</strong> <span class="price">$${formatearCLP(product.precio)}</span></p>
        <p><strong>Disponibilidad:</strong> ${product.cantidad > 0 ? `En stock (${product.cantidad})` : "Sin stock"}</p>
        <div class="quantity-selector mt-3">
          <button id="decreaseQuantity" class="btn btn-outline-secondary" ${product.cantidad === 0 ? 'disabled' : ''}>-</button>
          <span id="quantity" class="mx-2">1</span>
          <button id="increaseQuantity" class="btn btn-outline-secondary" ${product.cantidad === 0 ? 'disabled' : ''}>+</button>
        </div>
        <button id="addToCartButton" class="btn btn-primary mt-3" ${product.cantidad === 0 ? 'disabled' : ''}>
          Agregar al carrito
        </button>
      </div>
    `;

    const quantityElement = document.getElementById("quantity");
    const decreaseButton = document.getElementById("decreaseQuantity");
    const increaseButton = document.getElementById("increaseQuantity");
    const addToCartButton = document.getElementById("addToCartButton");

    let selectedQuantity = 1;

    decreaseButton.addEventListener("click", () => {
      if (selectedQuantity > 1) {
        selectedQuantity--;
        quantityElement.textContent = selectedQuantity;
        addToCartButton.disabled = false;
      }
    });

    increaseButton.addEventListener("click", () => {
      if (selectedQuantity < product.cantidad) {
        selectedQuantity++;
        quantityElement.textContent = selectedQuantity;
      }
      if (selectedQuantity === product.cantidad) {
        increaseButton.disabled = true;
      }
      decreaseButton.disabled = false;
    });

    addToCartButton.addEventListener("click", () => {
      addToCart(productId, category, product.nombre, product.precio, product.cantidad, selectedQuantity, product.imagenUrl);
    });

    // Mostrar comentarios y formulario si corresponde
    mostrarComentarios(productId, category);
  } catch (error) {
    console.error("Error al cargar el detalle del producto:", error);
    alert("Ocurrió un error al cargar el producto.");
  }
}

// Modifica la función addToCart para aceptar la cantidad seleccionada y guardar en Firestore
async function addToCart(productId, category, name, price, available, quantity, imageUrl) {
  if (available <= 0) {
    mostrarMensajeNoStock(name);
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  // Cambia productId por id para unificar con productos.html
  const existingProductIndex = cart.findIndex(item => item.id === productId);

  if (existingProductIndex !== -1) {
    if (cart[existingProductIndex].cantidad + quantity <= available) {
      cart[existingProductIndex].cantidad += quantity;
    } else {
      mostrarMensajeNoStock(name);
      return;
    }
  } else {
    cart.push({ id: productId, category, name, price, cantidad: quantity, imageUrl }); // Agrega imageUrl aquí
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  await guardarCarritoUsuario(cart); // Guardar en Firestore
  mostrarMensajeExito(name);
  window.dispatchEvent(new Event("carritoActualizado"));
}

// Guardar carrito en Firestore para el usuario autenticado
async function guardarCarritoUsuario(cart) {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (usuario && usuario.uid) {
    try {
      const userDocRef = doc(db, "usuarios", usuario.uid);
      await updateDoc(userDocRef, { carrito: cart });
    } catch (e) {
      // No bloquear la experiencia si falla, solo loguear
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

// --- COMENTARIOS ---
function mostrarComentarios(productId, category) {
  const comentariosLista = document.getElementById("comentarios-lista");
  const formContainer = document.getElementById("comentario-form-container");
  const usuario = JSON.parse(localStorage.getItem("Usuario"));

  // Mostrar formulario solo si hay usuario autenticado
  if (usuario && usuario.uid) {
    formContainer.style.display = "";
    const form = document.getElementById("comentario-form");
    const textarea = document.getElementById("comentario-texto");
    const mensaje = document.getElementById("comentario-mensaje");

    // Agregar estrellas de valoración al formulario si no existen
    let estrellasDiv = document.getElementById("comentario-estrellas");
    if (!estrellasDiv) {
      estrellasDiv = document.createElement("div");
      estrellasDiv.id = "comentario-estrellas";
      estrellasDiv.className = "mb-2";
      estrellasDiv.innerHTML = `
        <span class="me-2" style="font-weight:500;">Valoración:</span>
        <span id="estrellas-form">
          ${[1,2,3,4,5].map(i => `<i class="bi bi-star estrella-form" data-value="${i}" style="font-size:1.5rem;cursor:pointer;color:#ccc;"></i>`).join('')}
        </span>
        <span id="valoracion-num" class="ms-2 text-success"></span>
      `;
      form.insertBefore(estrellasDiv, textarea.parentNode);
    }
    let valoracion = 0;
    const estrellas = estrellasDiv.querySelectorAll(".estrella-form");
    const valoracionNum = estrellasDiv.querySelector("#valoracion-num");
    estrellas.forEach(estrella => {
      estrella.addEventListener("mouseenter", function() {
        const val = parseInt(this.dataset.value);
        estrellas.forEach(e => {
          e.style.color = parseInt(e.dataset.value) <= val ? "#FFD600" : "#ccc";
        });
      });
      estrella.addEventListener("mouseleave", function() {
        estrellas.forEach(e => {
          e.style.color = parseInt(e.dataset.value) <= valoracion ? "#FFD600" : "#ccc";
        });
      });
      estrella.addEventListener("click", function() {
        valoracion = parseInt(this.dataset.value);
        valoracionNum.textContent = valoracion + " estrella" + (valoracion > 1 ? "s" : "");
        estrellas.forEach(e => {
          e.style.color = parseInt(e.dataset.value) <= valoracion ? "#FFD600" : "#ccc";
        });
      });
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      mensaje.textContent = "";
      const texto = textarea.value.trim();
      if (!texto) {
        mensaje.textContent = "El comentario no puede estar vacío.";
        mensaje.style.color = "red";
        return;
      }
      if (valoracion < 1 || valoracion > 5) {
        mensaje.textContent = "Debes seleccionar una valoración de 1 a 5 estrellas.";
        mensaje.style.color = "red";
        return;
      }
      try {
        await addDoc(
          collection(db, "Products", category, "items", productId, "comentarios"),
          {
            uid: usuario.uid,
            nombre: usuario.nombre || "Usuario",
            comentario: texto,
            valoracion,
            fecha: new Date().toISOString()
          }
        );
        mensaje.textContent = "¡Comentario publicado!";
        mensaje.style.color = "green";
        textarea.value = "";
        valoracion = 0;
        estrellas.forEach(e => e.style.color = "#ccc");
        valoracionNum.textContent = "";
      } catch {
        mensaje.textContent = "Error al publicar el comentario.";
        mensaje.style.color = "red";
      }
    };
  } else {
    formContainer.style.display = "none";
  }

  // Mostrar comentarios en tiempo real
  const comentariosRef = collection(db, "Products", category, "items", productId, "comentarios");
  const q = query(comentariosRef, orderBy("fecha", "desc"));
  onSnapshot(q, (snapshot) => {
    comentariosLista.innerHTML = "";
    if (snapshot.empty) {
      comentariosLista.innerHTML = `<div class="text-muted mb-2">Aún no hay comentarios.</div>`;
      return;
    }
    snapshot.forEach(docu => {
      const data = docu.data();
      const fecha = new Date(data.fecha).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
      const esPropio = usuario && usuario.uid === data.uid;
      const comentarioId = docu.id;
      // Mostrar estrellas de valoración
      const estrellasHtml = `<span style="color:#FFD600;font-size:1.2rem;">${
        data.valoracion ? "★".repeat(data.valoracion) + "☆".repeat(5 - data.valoracion) : ""
      }</span>`;

      comentariosLista.innerHTML += `
        <div class="border rounded p-2 mb-2 bg-light position-relative" id="comentario-${comentarioId}">
          <div class="fw-bold" style="color:#32735B;">${data.nombre || "Usuario"}</div>
          <div>${estrellasHtml}</div>
          <div style="font-size:0.97rem;" id="comentario-texto-${comentarioId}">${data.comentario}</div>
          <div class="text-muted" style="font-size:0.85rem;">${fecha}</div>
          ${esPropio ? `
            <div class="comentario-acciones" style="position:absolute;top:8px;right:8px;display:flex;gap:6px;">
              <button class="btn btn-sm btn-outline-danger eliminar-comentario" data-id="${comentarioId}" title="Eliminar"><i class="bi bi-trash"></i></button>
              <button class="btn btn-sm btn-outline-primary editar-comentario" data-id="${comentarioId}" title="Editar"><i class="bi bi-pencil"></i></button>
            </div>
          ` : ""}
        </div>
      `;
    });

    // Asignar eventos a los botones de eliminar
    comentariosLista.querySelectorAll(".eliminar-comentario").forEach(btn => {
      btn.onclick = async function() {
        mostrarConfirmacionEliminar(async () => {
          await deleteDoc(doc(db, "Products", category, "items", productId, "comentarios", btn.dataset.id));
        });
      };
    });

    // Asignar eventos a los botones de editar
    comentariosLista.querySelectorAll(".editar-comentario").forEach(btn => {
      btn.onclick = function() {
        const comentarioId = btn.dataset.id;
        const textoDiv = document.getElementById(`comentario-texto-${comentarioId}`);
        if (!textoDiv) return;
        const textoOriginal = textoDiv.textContent;
        // Obtener la valoración original
        const comentarioDoc = snapshot.docs.find(d => d.id === comentarioId);
        const valoracionOriginal = comentarioDoc?.data().valoracion || 0;
        // Reemplazar por un textarea editable y estrellas editables
        textoDiv.innerHTML = `
          <textarea class="form-control form-control-sm" id="editar-textarea-${comentarioId}" rows="2" maxlength="300">${textoOriginal}</textarea>
          <div class="mt-1 mb-1" id="editar-estrellas-${comentarioId}">
            ${[1,2,3,4,5].map(i => `<i class="bi bi-star estrella-editar" data-value="${i}" style="font-size:1.3rem;cursor:pointer;color:${i<=valoracionOriginal?'#FFD600':'#ccc'};"></i>`).join('')}
            <span id="editar-valoracion-num-${comentarioId}" class="ms-2 text-success">${valoracionOriginal ? valoracionOriginal + " estrella" + (valoracionOriginal > 1 ? "s" : "") : ""}</span>
          </div>
          <div>
            <button class="btn btn-success btn-sm" id="guardar-edicion-${comentarioId}">Guardar</button>
            <button class="btn btn-secondary btn-sm" id="cancelar-edicion-${comentarioId}">Cancelar</button>
          </div>
        `;
        // Lógica de estrellas editables
        let valoracionEdit = valoracionOriginal;
        const estrellasEdit = textoDiv.querySelectorAll(".estrella-editar");
        const valoracionNumEdit = textoDiv.querySelector(`#editar-valoracion-num-${comentarioId}`);
        estrellasEdit.forEach(estrella => {
          estrella.addEventListener("mouseenter", function() {
            const val = parseInt(this.dataset.value);
            estrellasEdit.forEach(e => {
              e.style.color = parseInt(e.dataset.value) <= val ? "#FFD600" : "#ccc";
            });
          });
          estrella.addEventListener("mouseleave", function() {
            estrellasEdit.forEach(e => {
              e.style.color = parseInt(e.dataset.value) <= valoracionEdit ? "#FFD600" : "#ccc";
            });
          });
          estrella.addEventListener("click", function() {
            valoracionEdit = parseInt(this.dataset.value);
            valoracionNumEdit.textContent = valoracionEdit + " estrella" + (valoracionEdit > 1 ? "s" : "");
            estrellasEdit.forEach(e => {
              e.style.color = parseInt(e.dataset.value) <= valoracionEdit ? "#FFD600" : "#ccc";
            });
          });
        });
        // Guardar edición
        document.getElementById(`guardar-edicion-${comentarioId}`).onclick = async () => {
          const nuevoTexto = document.getElementById(`editar-textarea-${comentarioId}`).value.trim();
          if (!nuevoTexto) {
            alert("El comentario no puede estar vacío.");
            return;
          }
          if (valoracionEdit < 1 || valoracionEdit > 5) {
            alert("Debes seleccionar una valoración de 1 a 5 estrellas.");
            return;
          }
          await updateFirestoreDoc(doc(db, "Products", category, "items", productId, "comentarios", comentarioId), {
            comentario: nuevoTexto,
            valoracion: valoracionEdit
          });
        };
        // Cancelar edición
        document.getElementById(`cancelar-edicion-${comentarioId}`).onclick = () => {
          textoDiv.textContent = textoOriginal;
        };
      };
    });
  });
}

// Notificación emergente personalizada para confirmar eliminación
function mostrarConfirmacionEliminar(onConfirm) {
  // Si ya existe, no crear otra
  if (document.getElementById("confirmacion-eliminar")) return;

  const overlay = document.createElement("div");
  overlay.id = "confirmacion-eliminar";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.3)";
  overlay.style.zIndex = "2000";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  const modal = document.createElement("div");
  modal.className = "bg-white rounded shadow p-4";
  modal.style.minWidth = "320px";
  modal.style.maxWidth = "90vw";
  modal.innerHTML = `
    <div class="mb-3" style="font-size:1.15rem;">
      <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
      ¿Seguro que deseas eliminar este comentario?
    </div>
    <div class="d-flex justify-content-end gap-2">
      <button class="btn btn-danger" id="confirmar-eliminar-btn">Eliminar</button>
      <button class="btn btn-secondary" id="cancelar-eliminar-btn">Cancelar</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.getElementById("confirmar-eliminar-btn").onclick = () => {
    document.body.removeChild(overlay);
    onConfirm();
  };
  document.getElementById("cancelar-eliminar-btn").onclick = () => {
    document.body.removeChild(overlay);
  };
}

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = volverDestino;
});

loadProductDetail();
