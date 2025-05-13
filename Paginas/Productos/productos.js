import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { db } from "../../Servicios/firebaseConfig.js";

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
  const categoryQuery = urlParams.get("category"); // Leer categoría de la URL

  // Asegurarnos de que los productos estén cargados en el caché
  if (allProductsCache.length === 0) {
    await loadProductsForPurchase();
  }

  let filteredProducts = allProductsCache;

  if (categoryQuery) {
    filteredProducts = filteredProducts.filter(product => product.category === categoryQuery); // Filtrar por categoría
  }

  if (searchQuery) {
    document.getElementById("searchInput").value = searchQuery; // Rellenar el campo de búsqueda
    filteredProducts = filteredProducts.filter(product =>
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    ); // Filtrar por término de búsqueda
  }

  if (filteredProducts.length === 0) {
    const productContainer = document.getElementById("productContainer");
    productContainer.innerHTML = "<p>No se encontraron productos.</p>";
    document.getElementById("paginationContainer").innerHTML = ""; // Limpiar paginación
    return;
  }

  displayFilteredProducts(filteredProducts); // Mostrar productos filtrados
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

  if (allProductsCache.length === 0) {
    // Cargar todos los productos en caché si aún no están cargados
    const categories = ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];
    for (const category of categories) {
      const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        if (!allProductsCache.some(product => product.id === docu.id && product.category === category)) {
          allProductsCache.push({ 
            ...data, 
            category, 
            id: docu.id, 
            imagenUrl: data.imagenUrl || "/imagenes/default.png" // Asegurarse de incluir imagenUrl o un valor predeterminado
          });
        }
      });
    }
  }

  let filteredProducts = allProductsCache;

  if (selectedCategory && selectedCategory !== "") {
    // Filtrar productos por categoría si se selecciona una específica
    filteredProducts = allProductsCache.filter(product => product.category === selectedCategory);
  }

  if (filteredProducts.length === 0) {
    productContainer.innerHTML = "<p>No se encontraron productos.</p>";
    document.getElementById("paginationContainer").innerHTML = ""; // Limpiar paginación
    return;
  }

  const startIndex = (page - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);
  displayFilteredProducts(paginatedProducts);

  updatePagination(filteredProducts.length, selectedCategory); // Actualizar paginación
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

// Función para agregar un producto al carrito
function addToCart(productId, category, name, price, stock, quantity, imageUrl) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existingProductIndex = cart.findIndex(item => item.id === productId);

  if (existingProductIndex !== -1) {
    if (cart[existingProductIndex].cantidad + quantity <= stock) {
      cart[existingProductIndex].cantidad += quantity;
    } else {
      mostrarMensajeNoStock(name);
      return;
    }
  } else {
    cart.push({ 
      id: productId, 
      category, 
      name, 
      price, 
      cantidad: quantity, 
      imageUrl 
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart)); // Guardar el carrito actualizado en localStorage
  guardarCarritoUsuario(cart); // Guardar también en Firestore
  mostrarMensajeExito(name);

  // Actualizar el contador del carrito en el navBar
  window.dispatchEvent(new Event("carritoActualizado"));
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

    // Resaltar el botón de la página actual
    if (i === currentPage) {
      button.classList.add("active");
    }

    button.addEventListener("click", async () => {
      // Actualizar la página actual
      currentPage = i;

      // Eliminar la clase 'active' de todos los botones
      document.querySelectorAll(".pagination-button").forEach(btn => btn.classList.remove("active"));

      // Agregar la clase 'active' al botón actual
      button.classList.add("active");

      // Recargar los productos para la página seleccionada
      if (filteredProducts) {
        displayFilteredProducts(filteredProducts, i);
      } else {
        await loadProductsForPurchase(selectedCategory, i);
      }
    });

    paginationContainer.appendChild(button);
  }
}

// Función para asignar eventos a los botones de agregar al carrito
function assignAddToCartEvents() {
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation(); // Evitar que el clic en el botón active otros eventos
      const category = button.dataset.category;
      const productId = button.dataset.id;
      const name = button.dataset.name;
      const price = parseFloat(button.dataset.price);
      const available = parseInt(button.dataset.stock);
      const imageUrl = button.dataset.image; // Obtener la URL de la imagen

      if (available <= 0) {
        mostrarMensajeNoStock(name);
        return;
      }

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existingProductIndex = cart.findIndex((item) => item.id === productId);

      if (existingProductIndex !== -1) {
        if (cart[existingProductIndex].cantidad < available) {
          cart[existingProductIndex].cantidad += 1;
        } else {
          mostrarMensajeNoStock(name);
          return;
        }
      } else {
        cart.push({ category, id: productId, name, price, cantidad: 1, imageUrl }); // Incluir imagenUrl
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      guardarCarritoUsuario(cart); // Guardar también en Firestore
      mostrarMensajeExito(name);
      window.dispatchEvent(new Event("carritoActualizado"));
    });
  });
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
      <a href="/Paginas/DetalleProducto/productoDetalle.html?id=${product.id}&category=${product.category}" style="text-decoration: none; color: inherit;">
        <img src="${product.imagenUrl}" alt="${product.nombre}">
        <h3>${product.nombre}</h3>
        <p class="price">Precio: $${product.precio}</p>
        <p class="stock" style="color: ${product.cantidad > 0 ? '#6c757d' : 'red'};">
          ${product.cantidad > 0 ? `Disponibles: ${product.cantidad}` : 'Sin stock'}
        </p>
      </a>
      <button class="btn btn-primary mt-2 add-to-cart" ${product.cantidad === 0 ? 'disabled' : ''} data-id="${product.id}" data-category="${product.category}" data-name="${product.nombre}" data-price="${product.precio}" data-stock="${product.cantidad}" data-image="${product.imagenUrl}">
        Agregar al carrito
      </button>
    `;
    productContainer.appendChild(card);
  });

  assignAddToCartEvents(); // Asignar eventos a los botones después de renderizar
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
