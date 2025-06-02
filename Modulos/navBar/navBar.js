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
          <li><a class="dropdown-item" href="/Paginas/DatosPersonales/datosPersonales.html">Datos personales</a></li>
          <li><a class="dropdown-item" href="/Paginas/MisCompras/misCompras.html" id="mis-compras-link">Mis compras</a></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn">Cerrar sesión</a></li>
        </ul>
      `;
      navbar.prepend(usuarioItem);

      // Validar el rol del usuario directamente desde Firestore
      import("../../Servicios/firebaseConfig.js").then(({ db }) => {
        import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(({ doc, getDoc }) => {
          const userDocRef = doc(db, "usuarios", usuario.uid);
          getDoc(userDocRef).then(docSnapshot => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              const rolUsuario = userData.rol;

              // Mostrar opciones de administración según el rol del usuario
              if (rolUsuario === "administrativo") {
                const adminItem = document.createElement('li');
                adminItem.className = 'nav-item dropdown';
                adminItem.innerHTML = `
                  <a class="nav-link dropdown-toggle text-dark" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Administración
                  </a>
                  <ul class="dropdown-menu" aria-labelledby="adminDropdown">
                    <li><a class="dropdown-item" href="/Paginas/AgregarProducto/agregarProducto.html">Agregar Producto</a></li>
                    <li><a class="dropdown-item" href="/Paginas/AdminCompras/adminCompras.html">Gestionar Compras</a></li>
                    <li><a class="dropdown-item" href="/Paginas/Dashboard/dashboard.html">Dashboard</a></li>
                    <li><a class="dropdown-item" href="/Paginas/GestionRoles/GestionRoles.html">Gestion Roles</a></li>
                  </ul>
                `;
                navbar.prepend(adminItem);
              } else if (rolUsuario === "vendedor") {
                const vendedorItem = document.createElement('li');
                vendedorItem.className = 'nav-item dropdown';
                vendedorItem.innerHTML = `
                  <a class="nav-link dropdown-toggle text-dark" href="#" id="vendedorDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Administración
                  </a>
                  <ul class="dropdown-menu" aria-labelledby="vendedorDropdown">
                    <li><a class="dropdown-item" href="/Paginas/AgregarProducto/agregarProducto.html">Agregar Producto</a></li>
                    <li><a class="dropdown-item" href="/Paginas/AdminCompras/adminCompras.html">Gestionar Compras</a></li>
                  </ul>
                `;
                navbar.prepend(vendedorItem);
              }
            }
          });
        });
      });

      // Cerrar sesión
      document.getElementById('logoutBtn').addEventListener('click', function () {
        localStorage.removeItem('Usuario');
        localStorage.removeItem('NotificacionesFercomet'); // Limpiar notificaciones al cerrar sesión
        window.location.href = '/Paginas/Inicio/index.html';
      });
    }

    // Agregar campanilla de notificaciones al navbar si no existe
    function agregarCampanillaNotificaciones() {
      const navbar = document.querySelector('.navbar-nav.ms-auto');
      if (!navbar || document.getElementById("notificacionesDropdown")) return;

      const notiItem = document.createElement('li');
      notiItem.className = 'nav-item dropdown position-relative';
      notiItem.innerHTML = `
        <a class="nav-link" href="#" id="notificacionesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-bell-fill" style="font-size:1.5rem;"></i>
          <span id="contadorNotificaciones" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display:none;font-size:0.8rem;">0</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="notificacionesDropdown" id="listaNotificaciones" style="min-width:320px;max-width:400px;">
          <li class="dropdown-header text-center fw-bold">Notificaciones</li>
          <li><hr class="dropdown-divider"></li>
          <li class="text-center text-muted" id="sinNotificaciones">No tienes notificaciones nuevas</li>
        </ul>
      `;
      navbar.prepend(notiItem);
    }

    // Guardar y mostrar notificaciones en localStorage y en la campanilla
    function agregarNotificacion(mensaje, tipo = "info") {
      const notificaciones = JSON.parse(localStorage.getItem("NotificacionesFercomet") || "[]");
      notificaciones.unshift({
        mensaje,
        tipo,
        fecha: new Date().toISOString(),
        leida: false
      });
      localStorage.setItem("NotificacionesFercomet", JSON.stringify(notificaciones));
      actualizarCampanillaNotificaciones();
    }

    function actualizarCampanillaNotificaciones() {
      const notificaciones = JSON.parse(localStorage.getItem("NotificacionesFercomet") || "[]");
      const noLeidas = notificaciones.filter(n => !n.leida);
      const contador = document.getElementById("contadorNotificaciones");
      const lista = document.getElementById("listaNotificaciones");
      const sinNotificaciones = document.getElementById("sinNotificaciones");

      if (contador) {
        contador.textContent = noLeidas.length;
        contador.style.display = noLeidas.length > 0 ? "inline-block" : "none";
      }

      if (lista) {
        // Limpiar notificaciones antiguas (excepto header y divider)
        lista.querySelectorAll('.noti-fercomet-item').forEach(el => el.remove());
        // Eliminar el botón de borrar todas si ya existe
        const btnBorrarTodasExistente = document.getElementById("btnBorrarTodasNotificaciones");
        if (btnBorrarTodasExistente) btnBorrarTodasExistente.remove();

        if (notificaciones.length === 0 && sinNotificaciones) {
          sinNotificaciones.style.display = "block";
        } else if (sinNotificaciones) {
          sinNotificaciones.style.display = "none";
        }

        // Limitar visualización a 4 y permitir scroll
        lista.style.maxHeight = "320px";
        lista.style.overflowY = "auto";
        lista.style.minHeight = "0";

        notificaciones.slice(0, 20).forEach((noti, idx) => {
          const li = document.createElement("li");
          li.className = "noti-fercomet-item px-3 py-2 d-flex align-items-center justify-content-between";
          let mensajeMostrar = noti.mensaje;
          const btnCerrar = document.createElement("button");
          btnCerrar.innerHTML = "&times;";
          btnCerrar.style.background = "transparent";
          btnCerrar.style.border = "none";
          btnCerrar.style.fontSize = "1.2rem";
          btnCerrar.style.color = "#888";
          btnCerrar.style.cursor = "pointer";
          btnCerrar.style.marginLeft = "10px";
          btnCerrar.setAttribute("aria-label", "Eliminar notificación");
          btnCerrar.onclick = (e) => {
            e.stopPropagation();
            eliminarNotificacionPorIndice(idx);
          };

          const contenido = document.createElement("div");
          contenido.style.fontSize = "0.97rem";
          contenido.innerHTML = `
            <span class="me-2"><i class="bi bi-bell-fill" style="color:${noti.tipo === "success" ? "#28a745" : noti.tipo === "danger" ? "#dc3545" : noti.tipo === "warning" ? "#ffc107" : "#32735B"}"></i></span>
            ${mensajeMostrar}
          `;

          li.appendChild(contenido);
          li.appendChild(btnCerrar);
          lista.appendChild(li);
        });

        // --- Botón borrar todas FIJO al fondo del dropdown ---
        // Si ya existe, elimínalo antes de agregarlo de nuevo
        let btnFooter = document.getElementById("btnBorrarTodasNotificacionesFooter");
        if (btnFooter) btnFooter.parentNode.removeChild(btnFooter);

        if (notificaciones.length > 0) {
          // Crear el botón y un contenedor li
          const liFooter = document.createElement("li");
          liFooter.id = "btnBorrarTodasNotificacionesFooter";
          liFooter.className = "dropdown-footer text-center py-2";
          liFooter.style.position = "sticky";
          liFooter.style.bottom = "0";
          liFooter.style.background = "#fff";
          liFooter.style.zIndex = "2";
          liFooter.style.borderTop = "1px solid #eee";
          liFooter.style.margin = "0";
          liFooter.style.padding = "10px 0 5px 0";
          const btnBorrarTodas = document.createElement("button");
          btnBorrarTodas.className = "btn btn-sm btn-outline-danger";
          btnBorrarTodas.textContent = "Borrar Notificaciones";
          btnBorrarTodas.onclick = (e) => {
            e.stopPropagation();
            localStorage.removeItem("NotificacionesFercomet");
            actualizarCampanillaNotificaciones();
          };
          liFooter.appendChild(btnBorrarTodas);
          lista.appendChild(liFooter);
        }
      }
    }

    // Eliminar notificación por índice (en el array de notificaciones)
    function eliminarNotificacionPorIndice(idx) {
      let notificaciones = JSON.parse(localStorage.getItem("NotificacionesFercomet") || "[]");
      if (idx >= 0 && idx < notificaciones.length) {
        notificaciones.splice(idx, 1);
        localStorage.setItem("NotificacionesFercomet", JSON.stringify(notificaciones));
        actualizarCampanillaNotificaciones();
      }
    }

    // Marcar notificaciones como leídas al abrir el dropdown
    document.body.addEventListener("click", (e) => {
      if (e.target.closest("#notificacionesDropdown")) {
        let notificaciones = JSON.parse(localStorage.getItem("NotificacionesFercomet") || "[]");
        notificaciones = notificaciones.map(n => ({ ...n, leida: true }));
        localStorage.setItem("NotificacionesFercomet", JSON.stringify(notificaciones));
        setTimeout(actualizarCampanillaNotificaciones, 300);
      }
    });

    // Permite a otras páginas agregar notificaciones llamando a window.agregarNotificacionFercomet
    window.agregarNotificacionFercomet = agregarNotificacion;

    agregarCampanillaNotificaciones();
    actualizarCampanillaNotificaciones();
  })
  .catch(error => console.error('Error al cargar el navbar:', error));

// Cargar el Footer
fetch('../../Modulos/Footer/footer.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
  })
  .catch(error => console.error('Error al cargar el footer:', error));

// Guardar carrito en Firestore para el usuario autenticado
async function guardarCarritoUsuario(cart) {
  const usuario = JSON.parse(localStorage.getItem("Usuario"));
  if (usuario && usuario.uid) {
    try {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const { db } = await import("../../Servicios/firebaseConfig.js");
      const userDocRef = doc(db, "usuarios", usuario.uid);
      await updateDoc(userDocRef, { carrito: cart });
    } catch (e) {
      console.error("No se pudo actualizar el carrito en Firestore:", e);
    }
  }
}

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
document.addEventListener("click", async (e) => {
  let carrito = JSON.parse(localStorage.getItem("cart")) || [];
  let updated = false;

  if (e.target.closest(".aumentar-cantidad")) {
    const index = parseInt(e.target.closest(".aumentar-cantidad").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      carrito[index].cantidad += 1;
      localStorage.setItem("cart", JSON.stringify(carrito));
      updated = true;
    }
  } else if (e.target.closest(".disminuir-cantidad")) {
    const index = parseInt(e.target.closest(".disminuir-cantidad").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      if (carrito[index].cantidad > 1) {
        carrito[index].cantidad -= 1;
        localStorage.setItem("cart", JSON.stringify(carrito));
        updated = true;
      }
    }
  } else if (e.target.closest(".eliminar-item")) {
    const index = parseInt(e.target.closest(".eliminar-item").dataset.index, 10);
    if (!isNaN(index) && index >= 0 && index < carrito.length) {
      const producto = carrito[index];
      crearNotificacionCentrada(`¿Estás seguro de que deseas eliminar "${producto.name}" del carrito?`, () => {
        carrito.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(carrito));
        guardarCarritoUsuario(carrito);
        renderizarCarrito();
        actualizarContadorCarrito();
      });
      return; // El guardado se hace en el callback
    }
  } else if (e.target.id === "vaciarCarrito") {
    if (carrito.length > 0) {
      crearNotificacionCentrada("¿Estás seguro de que deseas vaciar todo el carrito?", () => {
        localStorage.removeItem("cart");
        guardarCarritoUsuario([]);
        renderizarCarrito();
        actualizarContadorCarrito();
      });
      return; // El guardado se hace en el callback
    }
  }

  if (updated) {
    guardarCarritoUsuario(carrito);
    renderizarCarrito();
    actualizarContadorCarrito();
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
