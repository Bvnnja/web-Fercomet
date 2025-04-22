import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA50EDq4nAaqNx3HICdZJPAnGNMdOsyb1k",
  authDomain: "fercomet-32e92.firebaseapp.com",
  projectId: "fercomet-32e92",
  storageBucket: "fercomet-32e92.firebasestorage.app",
  messagingSenderId: "995994877980",
  appId: "1:995994877980:web:1239c3e358b596e562dfd9",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Carrito global
let cart = [];

let currentPage = 1;
const productsPerPage = 4;
let allProductsCache = []; // Cache para almacenar los productos

// Generar botones de categorías dinámicamente
document.addEventListener("DOMContentLoaded", () => {
  const categoryButtonsContainer = document.getElementById("categoryButtons");
  const categories = [
    { id: "", name: "Todos" },
    { id: "automotriz", name: "Automotriz" },
    { id: "construccion", name: "Construcción" },
    { id: "electricidad", name: "Electricidad" },
    { id: "gasfiteria", name: "Gasfitería" },
    { id: "griferia", name: "Grifería" },
    { id: "herramientas", name: "Herramientas" },
    { id: "jardineria", name: "Jardinería" },
    { id: "pinturas", name: "Pinturas" },
    { id: "seguridad", name: "Seguridad" },
  ];

  categories.forEach(category => {
    const button = document.createElement("button");
    button.textContent = category.name;
    button.dataset.category = category.id;
    button.addEventListener("click", async () => {
      await loadProductsForPurchase(category.id);
    });
    categoryButtonsContainer.appendChild(button);
  });
});

// Agregar filtro de categorías
document.addEventListener("DOMContentLoaded", () => {
  const categoryFilter = document.getElementById("categoryFilter");

  categoryFilter.addEventListener("change", async () => {
    const selectedCategory = categoryFilter.value;
    await loadProductsForPurchase(selectedCategory);
  });
});

// Cargar productos en tarjetas con paginación
async function loadProductsForPurchase(selectedCategory = null, page = 1) {
  currentPage = page;
  const productContainer = document.getElementById('productContainer');
  productContainer.innerHTML = "";

  if (allProductsCache.length === 0 || selectedCategory !== null) {
    allProductsCache = []; // Limpiar cache si se selecciona una nueva categoría
    const categories = selectedCategory
      ? [selectedCategory]
      : ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];

    for (const category of categories) {
      const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        allProductsCache.push({ ...data, category, id: docu.id });
      });
    }
  }

  const startIndex = (page - 1) * productsPerPage;
  const paginatedProducts = allProductsCache.slice(startIndex, startIndex + productsPerPage);

  paginatedProducts.forEach((product) => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${product.imagenUrl}" alt="${product.nombre}">
      <h3>${product.nombre}</h3>
      <p class="price">Precio: $${product.precio}</p>
      <p class="stock" style="color: ${product.cantidad > 0 ? '#6c757d' : 'red'};">
        ${product.cantidad > 0 ? `Disponibles: ${product.cantidad}` : 'Sin stock'}
      </p>
      <button class="add-to-cart" data-category="${product.category}" data-id="${product.id}" data-nombre="${product.nombre}" data-precio="${product.precio}" data-stock="${product.cantidad}" ${product.cantidad === 0 ? 'disabled' : ''}>
        Agregar al carrito
      </button>
    `;
    productContainer.appendChild(card);
  });

  // Añadir eventos a los botones
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      const productId = button.dataset.id;
      const name = button.dataset.nombre;
      const price = parseFloat(button.dataset.precio);
      const available = parseInt(button.dataset.stock);

      const cantidadCompra = parseInt(prompt(`¿Cuántos '${name}' quieres comprar?`, "1"));

      if (cantidadCompra > 0 && cantidadCompra <= available) {
        const existingProductIndex = cart.findIndex(item => item.productId === productId);

        if (existingProductIndex !== -1) {
          cart[existingProductIndex].cantidad += cantidadCompra;
        } else {
          cart.push({ category, productId, name, price, cantidad: cantidadCompra });
        }

        updateCartUI();
      } else {
        alert("Cantidad no válida o excede el stock.");
      }
    });
  });

  updatePagination(allProductsCache.length, selectedCategory);
}

// Actualizar la interfaz de paginación
function updatePagination(totalProducts, selectedCategory) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.add("pagination-button");
    if (i === currentPage) button.classList.add("active");
    button.addEventListener("click", () => loadProductsForPurchase(selectedCategory, i));
    paginationContainer.appendChild(button);
  }
}

// Filtrar productos mientras se escribe
document.getElementById("searchInput").addEventListener("input", async () => {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "";

  const categories = [
    "automotriz", "construccion", "electricidad", "gasfiteria", "griferia",
    "herramientas", "jardineria", "pinturas", "seguridad"
  ];

  for (const category of categories) {
    const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
    querySnapshot.forEach((docu) => {
      const data = docu.data();
      if (data.nombre.toLowerCase().includes(searchInput)) {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          <img src="${data.imagenUrl}" alt="${data.nombre}">
          <h3>${data.nombre}</h3>
          <p>Precio: $${data.precio}</p>
          <p>Disponibles: ${data.cantidad}</p>
          <button class="add-to-cart" data-category="${category}" data-id="${docu.id}" data-nombre="${data.nombre}" data-precio="${data.precio}" data-stock="${data.cantidad}">Agregar al carrito</button>
        `;
        productContainer.appendChild(card);
      }
    });
  }

  // Añadir eventos a los botones
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      const productId = button.dataset.id;
      const name = button.dataset.nombre;
      const price = parseFloat(button.dataset.precio);
      const available = parseInt(button.dataset.stock);

      const cantidadCompra = parseInt(prompt(`¿Cuántos '${name}' quieres comprar?`, "1"));

      if (cantidadCompra > 0 && cantidadCompra <= available) {
        const existingProductIndex = cart.findIndex(item => item.productId === productId);

        if (existingProductIndex !== -1) {
          cart[existingProductIndex].cantidad += cantidadCompra;
        } else {
          cart.push({ category, productId, name, price, cantidad: cantidadCompra });
        }

        updateCartUI();
      } else {
        alert("Cantidad no válida o excede el stock.");
      }
    });
  });
});

// Buscar productos por nombre
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "";

  if (!searchInput) {
    alert("Por favor, ingresa un nombre para buscar.");
    return;
  }

  const categories = [
    "automotriz", "construccion", "electricidad", "gasfiteria", "griferia",
    "herramientas", "jardineria", "pinturas", "seguridad"
  ];

  for (const category of categories) {
    const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
    querySnapshot.forEach((docu) => {
      const data = docu.data();
      if (data.nombre.toLowerCase().includes(searchInput)) {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
          <img src="${data.imagenUrl}" alt="${data.nombre}">
          <h3>${data.nombre}</h3>
          <p>Precio: $${data.precio}</p>
          <p>Disponibles: ${data.cantidad}</p>
          <button class="add-to-cart" data-category="${category}" data-id="${docu.id}" data-nombre="${data.nombre}" data-precio="${data.precio}" data-stock="${data.cantidad}">Agregar al carrito</button>
        `;
        productContainer.appendChild(card);
      }
    });
  }

  // Añadir eventos a los botones
  document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      const productId = button.dataset.id;
      const name = button.dataset.nombre;
      const price = parseFloat(button.dataset.precio);
      const available = parseInt(button.dataset.stock);

      const cantidadCompra = parseInt(prompt(`¿Cuántos '${name}' quieres comprar?`, "1"));

      if (cantidadCompra > 0 && cantidadCompra <= available) {
        const existingProductIndex = cart.findIndex(item => item.productId === productId);

        if (existingProductIndex !== -1) {
          cart[existingProductIndex].cantidad += cantidadCompra;
        } else {
          cart.push({ category, productId, name, price, cantidad: cantidadCompra });
        }

        updateCartUI();
      } else {
        alert("Cantidad no válida o excede el stock.");
      }
    });
  });
});

// Actualizar la interfaz del carrito
function updateCartUI() {
  const cartList = document.getElementById('cartList');
  cartList.innerHTML = "";

  if (cart.length === 0) {
    cartList.innerHTML = "<li>El carrito está vacío</li>";
    return;
  }

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} - $${item.price} x ${item.cantidad} 
      <button onclick="removeFromCart(${index})">Eliminar</button>
    `;
    cartList.appendChild(li);
  });
}

// Eliminar producto del carrito
window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCartUI();
}

// Realizar la compra y actualizar las cantidades
window.checkout = async function () {
  if (cart.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  for (const item of cart) {
    const productRef = doc(db, "Products", item.category, "items", item.productId);
    const docSnap = await getDoc(productRef);
    if (docSnap.exists()) {
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
  updateCartUI();
  loadProductsForPurchase(); // Actualizar el stock en pantalla
}

// Cargar productos al inicio
loadProductsForPurchase();
