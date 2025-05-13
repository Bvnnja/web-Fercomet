import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');
const category = urlParams.get('category');

async function loadProductDetail() {
  if (!productId || !category) {
    alert("Producto no encontrado.");
    return;
  }

  try {
    const productDoc = await getDoc(doc(db, "Products", category, "items", productId));
    if (!productDoc.exists()) {
      alert("Producto no encontrado.");
      return;
    }

    const product = productDoc.data();
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
        <p><strong>Precio:</strong> <span class="price">$${product.precio}</span></p>
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
      addToCart(productId, category, product.nombre, product.precio, product.cantidad, selectedQuantity);
    });
  } catch (error) {
    console.error("Error al cargar el detalle del producto:", error);
    alert("Ocurrió un error al cargar el producto.");
  }
}

// Modifica la función addToCart para aceptar la cantidad seleccionada y guardar en Firestore
async function addToCart(productId, category, name, price, available, quantity) {
  if (available <= 0) {
    mostrarMensajeNoStock(name);
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingProductIndex = cart.findIndex(item => item.productId === productId);

  if (existingProductIndex !== -1) {
    if (cart[existingProductIndex].cantidad + quantity <= available) {
      cart[existingProductIndex].cantidad += quantity;
    } else {
      mostrarMensajeNoStock(name);
      return;
    }
  } else {
    cart.push({ productId, category, name, price, cantidad: quantity });
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

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "../Compra/comprar.html";
});

loadProductDetail();
