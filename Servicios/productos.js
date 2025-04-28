import { obtenerProductos } from './firebase.js';  // Obtenemos productos desde Firebase

// Función para mostrar los productos en tarjetas
async function mostrarProductos(subcategoria) {
  const productos = await obtenerProductos(subcategoria);
  const container = document.getElementById("productos-container");
  container.innerHTML = '';

  if (!productos || productos.length === 0) {
    container.innerHTML = '<p>No se encontraron productos en esta categoría.</p>';
    return;
  }

  productos.forEach(producto => {
    const card = document.createElement('div');
    card.classList.add('col-md-4', 'mb-4');

    card.innerHTML = `
      <div class="card h-100">
        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}" style="height: 200px; object-fit: contain;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${producto.nombre}</h5>
          <p class="card-text mb-1">Unidad: ${producto.unidad}</p>
          <p class="card-text mb-2"><strong>Precio: $${producto.precio}</strong></p>
          <div class="mt-auto">
            <button class="btn btn-success w-100 agregar-carrito">Agregar al Carrito</button>
          </div>
        </div>
      </div>
    `;


    

    

    // Agregar evento al botón de agregar al carrito
    card.querySelector(".agregar-carrito").addEventListener("click", () => {
      if (typeof agregarAlCarrito === "function") {
        agregarAlCarrito({
          nombre: producto.nombre,
          precio: producto.precio,
          descripcion: producto.descripcion || "",
          imagen: producto.imagen,
          unidad: producto.unidad
        });
      } else {
        console.warn("La función agregarAlCarrito no está definida.");
      }
    });

    container.appendChild(card);
  });
}

// Inicializar eventos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const categorias = ['construccion', 'automotriz', 'electricidad', 'gasfiteria', 'griferia', 'herramientas', 'jardineria', 'pinturas', 'seguridad'];

  categorias.forEach(categoria => {
    const btn = document.getElementById(categoria);
    if (btn) {
      btn.addEventListener('click', () => mostrarProductos(categoria));
    }
  });
});
