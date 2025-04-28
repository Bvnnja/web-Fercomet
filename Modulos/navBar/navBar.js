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

      // Mostrar botón de administración si el usuario es admin
      if (usuario.email === "adminFercomet@gmail.com") {
        const adminItem = document.createElement('li');
        adminItem.className = 'nav-item dropdown';
        adminItem.innerHTML = `
          <a class="nav-link dropdown-toggle text-dark" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Administración
          </a>
          <ul class="dropdown-menu" aria-labelledby="adminDropdown">
            <li><a class="dropdown-item" href="/Paginas/AgregarProducto/agregarProducto.html">Agregar Producto</a></li>
          </ul>
        `;
        navbar.prepend(adminItem);
      }

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

// Actualizar el contador del carrito
const actualizarContadorCarrito = () => {
  const contador = document.querySelector(".contador_carrito");
  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  if (contador) {
    contador.textContent = carrito.reduce((total, item) => total + item.cantidad, 0); // Sumar cantidades
    contador.style.display = carrito.length > 0 ? "inline-block" : "none"; // Mostrar solo si hay productos
  }
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
        <img src="${producto.imageUrl}" alt="${producto.name}" class="img-thumbnail me-3" style="width: 60px; height: 60px; object-fit: cover;">
        <div>
          <h6 class="mb-1">${producto.name}</h6>
          <small class="text-muted">${producto.descripcion || ""}</small>
          <div class="d-flex align-items-center mt-2">
            <button class="btn btn-sm btn-secondary disminuir-cantidad" data-index="${index}">-</button>
            <span class="mx-2">${producto.cantidad}</span>
            <button class="btn btn-sm btn-secondary aumentar-cantidad" data-index="${index}">+</button>
          </div>
        </div>
      </div>
      <div class="text-end">
        <span class="fw-bold d-block">$${(producto.price * producto.cantidad).toLocaleString('es-CL')}</span>
        <button class="btn btn-sm btn-danger eliminar-item mt-2" data-index="${index}"><i class="bi bi-trash"></i></button>
      </div>
    `;
    contenedor.appendChild(item);
  });

  totalElement.textContent = `Total: $${total.toLocaleString('es-CL')}`;
};

// Crear notificación centrada para confirmar vaciar carrito
const crearNotificacionCentrada = (mensaje, onConfirm) => {
  // Crear fondo oscuro
  const overlay = document.createElement("div");
  overlay.className = "notificacion-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.zIndex = "1060"; // Asegurar que esté por delante del modal del carrito

  // Crear contenedor de la notificación
  const notificacion = document.createElement("div");
  notificacion.className = "notificacion-centrada bg-light border rounded shadow p-4";
  notificacion.style.position = "fixed";
  notificacion.style.top = "50%";
  notificacion.style.left = "50%";
  notificacion.style.transform = "translate(-50%, -50%)";
  notificacion.style.zIndex = "1070"; // Asegurar que esté por delante del overlay
  notificacion.innerHTML = `
    <p class="mb-3">${mensaje}</p>
    <div class="d-flex justify-content-end">
      <button class="btn btn-sm btn-secondary me-2" id="cancelarNotificacion">Cancelar</button>
      <button class="btn btn-sm btn-danger" id="confirmarNotificacion">Vaciar</button>
    </div>
  `;

  // Agregar notificación y fondo al DOM
  document.body.appendChild(overlay);
  document.body.appendChild(notificacion);

  // Manejar eventos de los botones
  document.getElementById("cancelarNotificacion").onclick = () => {
    document.body.removeChild(notificacion);
    document.body.removeChild(overlay);
  };
  document.getElementById("confirmarNotificacion").onclick = () => {
    onConfirm();
    document.body.removeChild(notificacion);
    document.body.removeChild(overlay);
  };
};

// Escuchar eventos para aumentar, disminuir, eliminar productos y vaciar carrito
document.addEventListener("click", (e) => {
  const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  if (e.target.closest(".aumentar-cantidad")) {
    const index = parseInt(e.target.closest(".aumentar-cantidad").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      carrito[index].cantidad += 1;
      localStorage.setItem("cart", JSON.stringify(carrito));
      renderizarCarrito();
      actualizarContadorCarrito();
    }
  } else if (e.target.closest(".disminuir-cantidad")) {
    const index = parseInt(e.target.closest(".disminuir-cantidad").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      if (carrito[index].cantidad > 1) {
        carrito[index].cantidad -= 1;
        localStorage.setItem("cart", JSON.stringify(carrito));
        renderizarCarrito();
        actualizarContadorCarrito();
      }
    }
  } else if (e.target.closest(".eliminar-item")) {
    const index = parseInt(e.target.closest(".eliminar-item").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      const producto = carrito[index];
      crearNotificacionCentrada(`¿Estás seguro de que deseas eliminar "${producto.name}" del carrito?`, () => {
        carrito.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(carrito));
        renderizarCarrito();
        actualizarContadorCarrito();
      });
    }
  } else if (e.target.id === "vaciarCarrito") {
    if (carrito.length > 0) {
      crearNotificacionCentrada("¿Estás seguro de que deseas vaciar todo el carrito?", () => {
        localStorage.removeItem("cart");
        renderizarCarrito();
        actualizarContadorCarrito();
      });
    }
  }
});

// Precargar productos al abrir el modal
document.getElementById("modalCarrito")?.addEventListener("show.bs.modal", renderizarCarrito);

// Escuchar evento personalizado para actualizar el carrito
window.addEventListener("carritoActualizado", () => {
  actualizarContadorCarrito();
  renderizarCarrito();
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
