import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const resumenLista = document.getElementById('resumenLista');
  const subtotal = document.getElementById('subtotal');
  const envioCosto = document.getElementById('envioCosto');
  const total = document.getElementById('total');

  // Cargar productos del carrito desde localStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  let subtotalValue = 0;

  if (cart.length === 0) {
    resumenLista.innerHTML = "<li>Tu carrito está vacío.</li>";
    subtotal.textContent = "$0.00";
    envioCosto.textContent = "Por calcular";
    total.textContent = "$0.00";
    return;
  }

  cart.forEach(item => {
    const li = document.createElement('li');
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.marginBottom = "12px";

    // Imagen del producto
    const img = document.createElement('img');
    img.src = item.imageUrl || '/imagenes/default-product.png'; // URL de la imagen o imagen predeterminada
    img.alt = item.name;
    img.style.width = "50px";
    img.style.height = "50px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.style.marginRight = "12px";

    // Detalles del producto
    const details = document.createElement('span');
    details.textContent = `${item.name} x ${item.cantidad}`;
    details.style.flex = "1";

    // Precio del producto
    const price = document.createElement('span');
    price.textContent = `$${(item.price * item.cantidad).toFixed(2)}`;
    price.style.fontWeight = "bold";

    li.appendChild(img);
    li.appendChild(details);
    li.appendChild(price);
    resumenLista.appendChild(li);

    subtotalValue += item.price * item.cantidad;
  });

  subtotal.textContent = `$${subtotalValue.toFixed(2)}`;
  envioCosto.textContent = "Por calcular";
  total.textContent = `$${subtotalValue.toFixed(2)}`;

  // Validaciones personalizadas
  const validateName = (name) => /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name);
  const validateRut = (rut) => /^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/.test(rut); // Solo números y "K" como dígito verificador
  const validatePhone = (phone) => /^\+569\d{8}$/.test(phone);

  // Formatear y validar RUT automáticamente mientras se escribe
  const formatAndValidateRut = (rut) => {
    // Eliminar caracteres no válidos
    rut = rut.replace(/[^0-9Kk]/g, "");

    // Asegurar que la "K" solo esté al final
    if (rut.includes("K") || rut.includes("k")) {
      rut = rut.replace(/K|k/g, ""); // Eliminar todas las "K"
      rut += "K"; // Agregar una sola "K" al final
    }

    // Aplicar formato de puntos y guion
    if (rut.length > 1) {
      rut = rut.replace(/^(\d{1,2})(\d{3})/, "$1.$2"); // Agregar el primer punto
    }
    if (rut.length > 6) {
      rut = rut.replace(/^(\d{1,2}\.\d{3})(\d{3})/, "$1.$2"); // Agregar el segundo punto
    }
    if (rut.length > 9) {
      rut = rut.replace(/^(\d{1,2}\.\d{3}\.\d{3})([\dkK])/, "$1-$2"); // Agregar el guion
    }

    // Validar largo máximo
    if (rut.length > 12) {
      rut = rut.slice(0, 12);
    }

    return rut;
  };

  const validateRutOnInput = (input) => {
    input.addEventListener("input", () => {
      const formattedRut = formatAndValidateRut(input.value);
      input.value = formattedRut;
    });
  };

  const nombreEnvio = document.getElementById("nombreEnvio");
  const apellidoEnvio = document.getElementById("apellidoEnvio");
  const nombreRetiro = document.getElementById("nombre");
  const apellidoRetiro = document.getElementById("apellido");
  const rutEnvio = document.getElementById("rutEnvio");
  const rutRetiro = document.getElementById("rut");
  const rutOtraPersona = document.getElementById("rutOtraPersona");

  // Validar en tiempo real los campos de nombre y apellido
  const preventInvalidCharacters = (input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, ""); // Permitir solo letras y espacios
    });
  };

  if (nombreEnvio) preventInvalidCharacters(nombreEnvio);
  if (apellidoEnvio) preventInvalidCharacters(apellidoEnvio);
  if (nombreRetiro) preventInvalidCharacters(nombreRetiro);
  if (apellidoRetiro) preventInvalidCharacters(apellidoRetiro);
  if (rutEnvio) validateRutOnInput(rutEnvio);
  if (rutRetiro) validateRutOnInput(rutRetiro);
  if (rutOtraPersona) validateRutOnInput(rutOtraPersona);

  // Formatear y validar el teléfono automáticamente
  const formatPhone = (phone) => {
    phone = phone.replace(/[^0-9+]/g, ""); // Permitir números y el símbolo "+"
    return phone.slice(0, 12); // Limitar a 12 caracteres
  };

  const validatePhoneOnInput = (input) => {
    input.addEventListener("input", () => {
      const formattedPhone = formatPhone(input.value);
      input.value = formattedPhone;
    });
  };

  const telefonoEnvio = document.getElementById("telefonoEnvio");
  const telefonoRetiro = document.getElementById("telefono");

  if (telefonoEnvio) {
    validatePhoneOnInput(telefonoEnvio);
  }

  if (telefonoRetiro) {
    validatePhoneOnInput(telefonoRetiro);
  }

  // Mostrar mensaje de error en el formulario
  const showError = (message) => {
    const errorContainer = document.getElementById("formError");
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
    }
  };

  // Ocultar mensaje de error
  const hideError = () => {
    const errorContainer = document.getElementById("formError");
    if (errorContainer) {
      errorContainer.style.display = "none";
    }
  };

  // Manejar envío del formulario
  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
      e.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
      hideError();

      const formData = new FormData(this);
      const userDetails = Object.fromEntries(formData.entries());

      // Determinar el tipo de entrega seleccionado
      const tipoEntrega = userDetails.entrega; // "envio" o "retiro"

      // Validar solo los campos del formulario correspondiente
      if (tipoEntrega === "envio") {
        if (!validateName(userDetails.nombreEnvio)) {
          showError("El nombre solo puede contener letras y espacios.");
          return;
        }
        if (!validateName(userDetails.apellidoEnvio)) {
          showError("El apellido solo puede contener letras y espacios.");
          return;
        }
        if (!validateRut(userDetails.rutEnvio)) {
          showError("El RUT debe tener el formato válido: 11.111.111-1 (el dígito verificador puede ser un número o K).");
          return;
        }
        if (!validatePhone(userDetails.telefonoEnvio)) {
          showError("El teléfono debe ser un número válido de Chile (+569 seguido de 8 dígitos).");
          return;
        }
        if (!userDetails.direccion || !userDetails.comuna || !userDetails.region) {
          showError("Todos los campos de dirección son obligatorios.");
          return;
        }
      } else if (tipoEntrega === "retiro") {
        if (!validateName(userDetails.nombre)) {
          showError("El nombre solo puede contener letras y espacios.");
          return;
        }
        if (!validateName(userDetails.apellido)) {
          showError("El apellido solo puede contener letras y espacios.");
          return;
        }
        if (!validateRut(userDetails.rut)) {
          showError("El RUT debe tener el formato válido: 11.111.111-1 (el dígito verificador puede ser un número o K).");
          return;
        }
        if (!validatePhone(userDetails.telefono)) {
          showError("El teléfono debe ser un número válido de Chile (+569 seguido de 8 dígitos).");
          return;
        }
        if (userDetails.retira === "otraPersona") {
          if (!validateRut(userDetails.rutOtraPersona)) {
            showError("El RUT de la persona que retira debe tener el formato válido: 11.111.111-1.");
            return;
          }
          if (!validateName(userDetails.nombreOtraPersona)) {
            showError("El nombre completo de la persona que retira solo puede contener letras y espacios.");
            return;
          }
        }
      }

      // Guardar datos en Firebase
      try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const total = cart.reduce((sum, item) => sum + item.price * item.cantidad, 0);

        // Solo agrega retiraOtraPersona si corresponde y los campos tienen valor
        let retiraOtraPersona = null;
        if (
          userDetails.retira === "otraPersona" &&
          userDetails.rutOtraPersona &&
          userDetails.nombreOtraPersona
        ) {
          retiraOtraPersona = {
            rut: userDetails.rutOtraPersona || "",
            nombreCompleto: userDetails.nombreOtraPersona || ""
          };
        }

        // Elimina campos undefined de usuario y direccion
        const usuario =
          tipoEntrega === "envio"
            ? {
                nombre: userDetails.nombreEnvio || "",
                apellido: userDetails.apellidoEnvio || "",
                rut: userDetails.rutEnvio || "",
                telefono: userDetails.telefonoEnvio || ""
              }
            : {
                nombre: userDetails.nombre || "",
                apellido: userDetails.apellido || "",
                rut: userDetails.rut || "",
                telefono: userDetails.telefono || ""
              };

        const direccion =
          tipoEntrega === "envio"
            ? {
                direccion: userDetails.direccion || "",
                comuna: userDetails.comuna || "",
                region: userDetails.region || ""
              }
            : null;

        const productos = cart.map(item => ({
          id: item.id || "",
          nombre: item.name || "",
          cantidad: item.cantidad || 0,
          precio: item.price || 0
        }));

        const orderData = {
          tipoEntrega: tipoEntrega || "",
          usuario,
          direccion,
          retiraOtraPersona: retiraOtraPersona ? retiraOtraPersona : null,
          productos,
          total,
          fecha: new Date().toISOString(),
          estado: "pendiente"
        };

        // Elimina cualquier campo undefined del objeto final (por seguridad extra)
        Object.keys(orderData).forEach(
          key => orderData[key] === undefined && delete orderData[key]
        );

        await addDoc(collection(db, "ordenes"), orderData);
        console.log("Orden guardada en Firebase:", orderData);

        // Redirigir a la pasarela de pago
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        window.location.href = "/Paginas/PasarelaPago/pasarelaPago.html";
      } catch (error) {
        console.error("Error al guardar la orden en Firebase:", error);
        showError("Ocurrió un error al procesar tu orden. Intenta nuevamente.");
      }
    });
  }

  const envioSection = document.getElementById("envioSection");
  const retiroSection = document.getElementById("retiroSection");
  const envioRadio = document.getElementById("envio");
  const retiroRadio = document.getElementById("retiro");
  const retiraSelect = document.getElementById("retira");
  const otraPersonaSection = document.getElementById("otraPersonaSection");

  // Alternar entre las secciones de envío y retiro
  envioRadio.addEventListener("change", () => {
    if (envioRadio.checked) {
      envioSection.style.display = "block";
      retiroSection.style.display = "none";
    }
  });

  retiroRadio.addEventListener("change", () => {
    if (retiroRadio.checked) {
      envioSection.style.display = "none";
      retiroSection.style.display = "block";
    }
  });

  // Mostrar u ocultar campos adicionales si retira otra persona
  retiraSelect.addEventListener("change", () => {
    if (retiraSelect.value === "otraPersona") {
      otraPersonaSection.style.display = "block";
    } else {
      otraPersonaSection.style.display = "none";
    }
  });

  // Manejar cancelación
  document.getElementById('cancelarFormulario').addEventListener('click', function () {
    window.location.href = "/Paginas/Carrito/carrito.html";
  });
});

  // Manejar cancelación
  document.getElementById('cancelarFormulario').addEventListener('click', function () {
    window.location.href = "/Paginas/Carrito/carrito.html";
  });

  const envioSection = document.getElementById("envioSection");
  const retiroSection = document.getElementById("retiroSection");
  const otraPersonaSection = document.getElementById("otraPersonaSection");
  const envioRadio = document.getElementById("envio");
  const retiroRadio = document.getElementById("retiro");
  const retiraSelect = document.getElementById("retira");

  // Alternar entre las secciones de envío y retiro
  envioRadio.addEventListener("change", () => {
    if (envioRadio.checked) {
      envioSection.style.display = "block";
      retiroSection.style.display = "none";
    }
  });

  retiroRadio.addEventListener("change", () => {
    if (retiroRadio.checked) {
      envioSection.style.display = "none";
      retiroSection.style.display = "block";
    }
  });

  // Mostrar u ocultar campos adicionales si retira otra persona
  retiraSelect.addEventListener("change", () => {
    if (retiraSelect.value === "otraPersona") {
      otraPersonaSection.style.display = "block";
    } else {
      otraPersonaSection.style.display = "none";
    }
  });
;

