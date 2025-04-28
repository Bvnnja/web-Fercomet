import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentPage = 1;
const productsPerPage = 4;
let allProductsCache = []; // Cache para almacenar los productos

// Generar botones de categorías dinámicamente
document.addEventListener("DOMContentLoaded", async () => {
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

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search");

  if (searchQuery) {
    document.getElementById("searchInput").value = searchQuery; // Rellenar el campo de búsqueda
    await searchProductsByName(searchQuery); // Buscar directamente por el término
  } else {
    await loadProductsForPurchase(); // Cargar todos los productos si no hay búsqueda
  }
});

// Nueva función para buscar productos por nombre
async function searchProductsByName(query) {
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "<p>Cargando productos...</p>";

  if (allProductsCache.length === 0) {
    // Cargar todos los productos en caché si aún no están cargados
    await loadProductsForPurchase();
  }

  const filteredProducts = allProductsCache.filter(product =>
    product.nombre.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = "<p>No se encontraron productos.</p>";
    document.getElementById("paginationContainer").innerHTML = ""; // Limpiar paginación
    return;
  }

  displayFilteredProducts(filteredProducts); // Mostrar productos filtrados
}

// Cargar productos en tarjetas con paginación
async function loadProductsForPurchase(selectedCategory = null, page = 1) {
  currentPage = page;
  const productContainer = document.getElementById('productContainer');
  productContainer.innerHTML = "";

  if (selectedCategory !== null) {
    // Filtrar productos por categoría
    const filteredProducts = allProductsCache.filter(product => product.category === selectedCategory);
    displayFilteredProducts(filteredProducts);
    return;
  }

  if (allProductsCache.length === 0) {
    // Cargar todos los productos en caché si aún no están cargados
    const categories = ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];
    for (const category of categories) {
      const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        if (!allProductsCache.some(product => product.id === docu.id && product.category === category)) {
          allProductsCache.push({ ...data, category, id: docu.id });
        }
      });
    }
  }

  const startIndex = (page - 1) * productsPerPage;
  const paginatedProducts = allProductsCache.slice(startIndex, startIndex + productsPerPage);
  displayFilteredProducts(paginatedProducts);
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

// Actualizar la interfaz de paginación
function updatePagination(totalProducts, selectedCategory, filteredProducts = null) {
  const paginationContainer = document.getElementById('paginationContainer');
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.add("pagination-button");
    if (i === currentPage) button.classList.add("active");
    button.addEventListener("click", () => {
      if (filteredProducts) {
        displayFilteredProducts(filteredProducts, i); // Mostrar productos filtrados
      } else {
        loadProductsForPurchase(selectedCategory, i); // Mostrar productos normales
      }
    });
    paginationContainer.appendChild(button);
  }
}

// Mostrar productos filtrados con paginación
function displayFilteredProducts(products, page = 1) {
  currentPage = page;
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "";

  const startIndex = (page - 1) * productsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + productsPerPage);

  paginatedProducts.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${product.imagenUrl}" alt="${product.nombre}">
      <h3>${product.nombre}</h3>
      <p class="price">Precio: $${product.precio}</p>
      <p class="stock" style="color: ${product.cantidad > 0 ? '#6c757d' : 'red'};">
        ${product.cantidad > 0 ? `Disponibles: ${product.cantidad}` : 'Sin stock'}
      </p>
    `;
    productContainer.appendChild(card);
  });

  updatePagination(products.length, null, products); // Actualizar paginación para productos filtrados
}

// Buscar productos por nombre al presionar el botón
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const productContainer = document.getElementById("productContainer");
  productContainer.innerHTML = "";

  if (!searchInput) {
    alert("Por favor, ingresa un nombre para buscar.");
    return;
  }

  const filteredProducts = allProductsCache.filter(product =>
    product.nombre.toLowerCase().includes(searchInput)
  );

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = "<p>No se encontraron productos.</p>";
    document.getElementById("paginationContainer").innerHTML = ""; // Limpiar paginación
    return;
  }

  displayFilteredProducts(filteredProducts); // Mostrar productos filtrados
});

// Aplicar filtros
document.getElementById("applyFiltersButton").addEventListener("click", () => {
  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
  const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  const availabilityFilter = document.getElementById("availabilityFilter").value;

  const filteredProducts = allProductsCache.filter(product => {
    const matchesPrice = product.precio >= minPrice && product.precio <= maxPrice;
    const matchesAvailability =
      availabilityFilter === "available" ? product.cantidad > 0 :
      availabilityFilter === "unavailable" ? product.cantidad === 0 :
      true;

    return matchesPrice && matchesAvailability;
  });

  displayFilteredProducts(filteredProducts);
});

// Reiniciar filtros
document.getElementById("resetFiltersButton").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("minPrice").value = "";
  document.getElementById("maxPrice").value = "";
  document.getElementById("availabilityFilter").value = "";

  loadProductsForPurchase(); // Recargar todos los productos
});

// Cargar productos al inicio
loadProductsForPurchase();
