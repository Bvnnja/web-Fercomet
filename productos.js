import { obtenerProductos } from './firebase.js';  // Importamos la función que obtiene los productos desde Firebase

// Función para mostrar los productos en tarjetas
async function mostrarProductos(subcategoria) {
  const productos = await obtenerProductos(subcategoria); // Obtenemos los productos desde Firestore
  const container = document.getElementById("productos-container");
  container.innerHTML = ''; // Limpiamos el contenedor antes de mostrar los nuevos productos

  // Verificamos si hay productos
  if (productos.length === 0) {
    container.innerHTML = '<p>No se encontraron productos en esta categoría.</p>';
    return;
  }

  // Iteramos sobre los productos y los mostramos
  productos.forEach(producto => {
    const card = document.createElement('div');
    card.classList.add('col-md-4', 'mb-4');

    card.innerHTML = `
      <div class="card">
        <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
        <div class="card-body">
          <h5 class="card-title">${producto.nombre}</h5>
          <p class="card-text">Unidad: ${producto.unidad}</p>
          <p class="card-text"><strong>Precio: $${producto.precio}</strong></p>
          <a href="#" class="btn btn-primary">Ver Producto</a>
        </div>
      </div>
    `;

    // Agrega la tarjeta al contenedor
    container.appendChild(card);
  });
}

// Llamar a la función para mostrar los productos de una categoría cuando el usuario hace clic en el botón
document.addEventListener('DOMContentLoaded', () => {
  // Asignar la acción a los botones
  const categorias = ['construccion', 'automotriz', 'electricidad', 'gasfiteria', 'griferia', 'herramientas', 'jardineria', 'pinturas', 'seguridad'];

  // Para cada categoría, asignar un evento al botón correspondiente
  categorias.forEach(categoria => {
    const btn = document.getElementById(categoria);  // El id de cada botón debe ser igual al nombre de la categoría
    if (btn) {
      btn.addEventListener('click', () => mostrarProductos(categoria));
    }
  });
});
