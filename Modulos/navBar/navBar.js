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
