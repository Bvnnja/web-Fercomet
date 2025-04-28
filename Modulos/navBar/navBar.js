// Cargar el Navbar
fetch('../../Modulos/navBar/navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;

    // ----------------------------
    // 🔁 Mensajes rotativos del navbar (después de insertarlo en el DOM)
    // ----------------------------
    const messages = document.querySelectorAll('.er-navbar .messages p');
    let currentMessageIndex = 0;

    function showNextMessage() {
      messages.forEach((message) => {
        message.classList.remove('active');
      });
      currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      messages[currentMessageIndex].classList.add('active');
    }

    showNextMessage();
    setInterval(showNextMessage, 7000);

    // ----------------------------
    // 👤 Mostrar usuario desde localStorage
    // ----------------------------
    const usuario = JSON.parse(localStorage.getItem('Usuario'));

    if (usuario) {
      // Ocultar "Iniciar Sesión" y "Registrarse"
      const iniciarSesion = document.querySelector('.nav-link[href="/Paginas/Login/login.html"]');
      const registrarse = document.querySelector('.nav-link[href="/Paginas/RegistroUsuario/registroUsuario.html"]');
      if (iniciarSesion) iniciarSesion.style.display = 'none';
      if (registrarse) registrarse.style.display = 'none';

      // Crear el dropdown con el nombre del usuario
      const navbar = document.querySelector('.navbar-nav.ms-auto');
      const usuarioItem = document.createElement('li');
      usuarioItem.className = 'nav-item dropdown';
      usuarioItem.innerHTML = `
        <a class="nav-link dropdown-toggle text-dark" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle me-2"></i>${usuario.nombre}
        </a>
        <ul class="dropdown-menu" aria-labelledby="userDropdown">
          <li><a class="dropdown-item" href="/DatosPersonales.html">Datos personales</a></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn">Cerrar sesión</a></li>
        </ul>
      `;
      navbar.prepend(usuarioItem);

      // Cerrar sesión
      document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('Usuario');
        window.location.href = '/Paginas/Inicio/index.html';
      });
    }
  })
  .catch(error => console.error('Error al cargar el navbar:', error));

// Cargar el Footer
fetch('../../Modulos/Footer/footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
  })
  .catch(error => console.error('Error al cargar el footer:', error));

const actualizarContadorCarrito = () => {
  const contador = document.querySelector(".contador_carrito");
  if (!contador) return;

  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  contador.textContent = carrito.length;
};

// Renderizar el carrito
const renderizarCarrito = () => {
  const contenedor = document.getElementById("contenido-carrito");
  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  const totalElement = document.querySelector(".modal-footer .total");
  const botonIrAPagar = document.getElementById("botonIrAPagar");
  const botonVaciarCarrito = document.getElementById("vaciarCarrito");

  if (!contenedor || !totalElement || !botonIrAPagar || !botonVaciarCarrito) return;

  contenedor.innerHTML = ""; // Limpiar contenido previo

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p class='text-center'>Tu carrito está vacío 🛒</p>";
    totalElement.textContent = "Total: $0";
    botonIrAPagar.setAttribute("disabled", "true");
    botonVaciarCarrito.setAttribute("disabled", "true");
    return;
  }

  botonIrAPagar.removeAttribute("disabled");
  botonVaciarCarrito.removeAttribute("disabled");

  let total = 0;
  carrito.forEach((producto, index) => {
    total += producto.price * producto.cantidad;

    const item = document.createElement("div");
    item.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-3");
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${producto.imagen || '/imagenes/default-product.png'}" alt="${producto.name}" class="img-thumbnail me-3" style="width: 60px; height: 60px;">
        <div>
          <h6 class="mb-1">${producto.name}</h6>
          <div class="d-flex align-items-center mt-2">
            <button class="btn btn-sm btn-secondary disminuir-cantidad" data-index="${index}">-</button>
            <span class="mx-2">${producto.cantidad}</span>
            <button class="btn btn-sm btn-secondary aumentar-cantidad" data-index="${index}">+</button>
          </div>
        </div>
      </div>
      <div class="text-end">
        <span class="fw-bold d-block">$${(producto.price * producto.cantidad).toFixed(0)}</span>
        <button class="btn btn-sm btn-danger eliminar-item mt-2" data-index="${index}"><i class="bi bi-trash"></i></button>
      </div>
    `;
    contenedor.appendChild(item);
  });

  totalElement.textContent = `Total: $${total.toFixed(0)}`;
};

// Escuchar eventos para aumentar, disminuir y eliminar productos
document.addEventListener("click", (e) => {
  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  if (e.target.classList.contains("aumentar-cantidad")) {
    const index = parseInt(e.target.dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      carrito[index].cantidad += 1;
      localStorage.setItem("cart", JSON.stringify(carrito));
      renderizarCarrito();
      actualizarContadorCarrito();
      window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
    }
  } else if (e.target.classList.contains("disminuir-cantidad")) {
    const index = parseInt(e.target.dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      if (carrito[index].cantidad > 1) {
        carrito[index].cantidad -= 1;
        localStorage.setItem("cart", JSON.stringify(carrito));
        renderizarCarrito();
        actualizarContadorCarrito();
        window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
      }
    }
  } else if (e.target.classList.contains("eliminar-item")) {
    const index = parseInt(e.target.dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      carrito.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(carrito));
      renderizarCarrito();
      actualizarContadorCarrito();
      window.dispatchEvent(new Event("carritoActualizado")); // Notificar actualización global
    }
  }
});

// Precargar productos al abrir el modal
document.getElementById("modalCarrito")?.addEventListener("show.bs.modal", renderizarCarrito);

// Escuchar evento personalizado para actualizar el carrito
window.addEventListener("carritoActualizado", () => {
  renderizarCarrito();
  actualizarContadorCarrito();
});

// Escuchar cambios en el localStorage
window.addEventListener("storage", () => {
  actualizarContadorCarrito();
  renderizarCarrito();
});

// Mostrar número de productos y renderizar el carrito al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  actualizarContadorCarrito();
  renderizarCarrito();
});

// Actualizar carrito al cambiar de pestaña
window.addEventListener("pageshow", () => {
  actualizarContadorCarrito();
  renderizarCarrito();
});
