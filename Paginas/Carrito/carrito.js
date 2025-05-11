import { db } from "../../Servicios/firebaseConfig.js";

// Carrito global
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Validar datos del carrito
function validarCarrito() {
  cart = cart.filter(item => item.cantidad > 0 && item.price > 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Actualizar la interfaz del carrito
function updateCartUI() {
  const cartList = document.getElementById('cartList');
  const checkoutButton = document.getElementById('checkoutButton');
  const subtotalElement = document.getElementById('subtotal');
  const totalElement = document.getElementById('total');
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = "<li>El carrito está vacío</li>";
    checkoutButton.disabled = true;
    subtotalElement.textContent = "$0.00";
    totalElement.textContent = "$0.00";
    return;
  }

  checkoutButton.disabled = false;
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

// Aumentar cantidad de un producto en el carrito (con manejo de errores)
window.increaseQuantity = async function(index) {
  const item = cart[index];
  const productRef = doc(db, "Products", item.category, "items", item.productId);

  const docSnap = await safeGetDoc(productRef);
  if (docSnap && docSnap.exists()) {
    const productData = docSnap.data();
    if (item.cantidad < productData.cantidad) {
      cart[index].cantidad += 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartUI();
      actualizarContadorCarrito();
    } else {
      alert("No hay suficiente stock disponible.");
    }
  }
};

// Eliminar producto del carrito
window.removeFromCart = function(index) {
  if (index >= 0 && index < cart.length) {
    cart.splice(index, 1); // Eliminar el producto del carrito
    localStorage.setItem("cart", JSON.stringify(cart)); // Actualizar localStorage
    actualizarCarritoGlobal(); // Actualizar la interfaz y el contador
    window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
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

// Realizar la compra y actualizar las cantidades
window.checkout = async function () {
  if (cart.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  for (const item of cart) {
    const productRef = doc(db, "Products", item.category, "items", item.productId);
    const docSnap = await safeGetDoc(productRef);
    if (docSnap && docSnap.exists()) {
      const productData = docSnap.data();
      const newQuantity = productData.cantidad - item.cantidad;

      if (newQuantity < 0) {
        alert(`No hay suficiente stock de ${item.name}.`);
        return;
      }

      await updateDoc(productRef, {
        cantidad: newQuantity
      });
    }
  }

  alert("Compra realizada exitosamente.");
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  actualizarContadorCarrito();
}

// Sincronizar carrito entre pestañas
window.addEventListener("storage", () => {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  validarCarrito();
  updateCartUI();
  actualizarContadorCarrito();
});

// Escuchar evento personalizado para sincronizar el carrito
window.addEventListener("carritoActualizado", () => {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCartUI();
  actualizarContadorCarrito();
});

// Consolidar actualización global del carrito
function actualizarCarritoGlobal() {
  validarCarrito();
  updateCartUI();
  actualizarContadorCarrito();
}

// Cargar el carrito al inicio
document.addEventListener("DOMContentLoaded", actualizarCarritoGlobal);