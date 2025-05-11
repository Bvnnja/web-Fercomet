import { db } from "../../Servicios/firebaseConfig.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let allProductsCache = []; // Cache para almacenar los productos

// Función para obtener productos aleatorios
function getRandomProducts(products, count) {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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
      mostrarMensajeExito(name);
      window.dispatchEvent(new Event("carritoActualizado"));
    });
  });
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

// Cargar productos al inicio
document.addEventListener("DOMContentLoaded", loadProductsCarousel);
