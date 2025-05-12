import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Carrito global
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Validar datos del carrito
function validarCarrito() {
  cart = cart.filter(item => item.cantidad > 0 && item.price > 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Verifica si la key 'cart' del localStorage tiene datos válidos
function carritoTieneDatos() {
  const carritoLS = localStorage.getItem("cart");
  if (!carritoLS) return false;
  try {
    const arr = JSON.parse(carritoLS);
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}

// Actualizar la interfaz del carrito
function updateCartUI() {
  // Sincroniza siempre con localStorage
  cart = JSON.parse(localStorage.getItem("cart")) || [];

  const cartList = document.getElementById('cartList');
  const checkoutButton = document.getElementById('checkoutButton');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total');
  cartList.innerHTML = "";

  // Si el carrito está vacío, muestra mensaje y deshabilita el botón
  if (!cart || cart.length === 0) {
    cartList.innerHTML = "<li>El carrito está vacío</li>";
    if (checkoutButton) checkoutButton.disabled = true;
    subtotalElement.textContent = "$0.00";
    totalElement.textContent = "$0.00";
    return;
  }

  if (checkoutButton) checkoutButton.disabled = false;
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price * item.cantidad;

    const li = document.createElement('li');
    li.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-3");
    li.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: auto; margin-right: 15px;">
      <div class="product-info">
        <h6>${item.name}</h6>
        <p>Precio: $${item.price}</p>
        <div class="quantity-controls">
          <button onclick="decreaseQuantity(${index})">-</button>
          <span>${item.cantidad}</span>
          <button onclick="increaseQuantity(${index})">+</button>
        </div>
      </div>
      <button class="remove-item" onclick="removeFromCart(${index})">Eliminar</button>
    `;
    cartList.appendChild(li);
  });

  subtotalElement.textContent = `$${total.toFixed(2)}`;
  totalElement.textContent = `$${total.toFixed(2)}`;
}

// Actualizar el contador global del carrito
function actualizarContadorCarrito() {
  const contador = document.querySelector(".contador_carrito");
  if (!contador) return;

  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  contador.textContent = carrito.length;
}

// Disminuir cantidad de un producto en el carrito
window.decreaseQuantity = function(index) {
  if (cart[index].cantidad > 1) {
    cart[index].cantidad -= 1;
  } else {
    cart.splice(index, 1);
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  actualizarContadorCarrito();
}

// Manejo de errores en Firebase
async function safeGetDoc(ref) {
  try {
    return await getDoc(ref);
  } catch (error) {
    console.error("Error al obtener el documento:", error);
    alert("Hubo un problema al obtener los datos del producto. Inténtalo de nuevo.");
    return null;
  }
}

// Mostrar mensaje de stock agotado
function mostrarMensajeStockAgotado() {
  const msg = document.getElementById('stockMessage');
  if (msg) {
    msg.style.display = "flex";
    setTimeout(() => {
      msg.style.display = "none";
    }, 4000);
  }
}

// Aumentar cantidad de un producto en el carrito (con manejo de errores)
window.increaseQuantity = async function(index) {
  const item = cart[index];
  const categoria = item.category || item.subcategoria;
  const productoId = item.productId || item.id;

  if (!categoria || !productoId) {
    alert("No se puede aumentar la cantidad porque faltan datos del producto.");
    console.error("Datos del producto faltantes:", item);
    return;
  }

  const productRef = doc(db, "Products", categoria, "items", productoId);

  const docSnap = await safeGetDoc(productRef);
  if (docSnap && docSnap.exists()) {
    const productData = docSnap.data();
    let cantidadDisponible = undefined;
    if (typeof productData.cantidad === "number") {
      cantidadDisponible = productData.cantidad;
    } else if (typeof productData.cantidad === "string" && !isNaN(Number(productData.cantidad))) {
      cantidadDisponible = Number(productData.cantidad);
    } else if (typeof productData.stock === "number") {
      cantidadDisponible = productData.stock;
    } else if (typeof productData.stock === "string" && !isNaN(Number(productData.stock))) {
      cantidadDisponible = Number(productData.stock);
    }
    if (item.cantidad < cantidadDisponible) {
      cart[index].cantidad += 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartUI();
      actualizarContadorCarrito();
    } else {
      mostrarMensajeStockAgotado();
    }
  }
};

// Modal de confirmación reutilizable
function mostrarConfirmacionEliminacion(nombreProducto, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const texto = document.getElementById('confirmModalText');
  const btnSi = document.getElementById('confirmYes');
  const btnNo = document.getElementById('confirmNo');
  texto.textContent = `¿Estás seguro que deseas eliminar ${nombreProducto} del carrito de compras?`;
  modal.style.display = "flex";

  // Limpiar listeners previos
  btnSi.onclick = null;
  btnNo.onclick = null;

  btnSi.onclick = () => {
    modal.style.display = "none";
    onConfirm();
  };
  btnNo.onclick = () => {
    modal.style.display = "none";
  };
}

// Eliminar producto del carrito
window.removeFromCart = function(index) {
  if (index >= 0 && index < cart.length) {
    const producto = cart[index];
    const nombre = producto.name || producto.nombre || "este producto";
    mostrarConfirmacionEliminacion(nombre, () => {
      cart.splice(index, 1); // Eliminar el producto del carrito
      localStorage.setItem("cart", JSON.stringify(cart)); // Actualizar localStorage
      actualizarCarritoGlobal(); // Actualizar la interfaz y el contador
      window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
    });
  } else {
    console.error("Índice inválido para eliminar producto del carrito:", index);
  }
};

// Escuchar eventos para eliminar productos
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("eliminar-item")) {
    const index = parseInt(e.target.dataset.index, 10); // Asegurar que el índice sea un número
    if (!isNaN(index)) {
      removeFromCart(index); // Llamar a la función de eliminar producto
    }
  }
});

// Vaciar carrito
window.vaciarCarrito = function() {
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  actualizarCarritoGlobal();
  window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
};

// Escuchar evento para vaciar carrito
document.addEventListener("click", (e) => {
  if (e.target.id === "vaciarCarrito") {
    if (confirm("¿Estás seguro de que deseas vaciar el carrito?")) {
      vaciarCarrito();
    }
  }
});

// Redirigir a la pasarela de pago al hacer clic en "Ir a pagar"
window.checkout = function () {
  if (cart.length === 0) {
    alert("El carrito está vacío.");
    return;
  }
  // Redirige a la pasarela de pago
  window.location.href = "/Paginas/PasarelaPago/pasarelaPago.html";
}

// Sincronizar carrito entre pestañas
window.addEventListener("storage", () => {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCartUI();
  actualizarContadorCarrito();
});

// Escuchar evento personalizado para sincronizar el carrito
window.addEventListener("carritoActualizado", () => {
  actualizarCarritoGlobal();
});

// Consolidar actualización global del carrito
function actualizarCarritoGlobal() {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCartUI();
  actualizarContadorCarrito();
  validarCarrito();
}

// Cargar el carrito al inicio
document.addEventListener("DOMContentLoaded", actualizarCarritoGlobal);