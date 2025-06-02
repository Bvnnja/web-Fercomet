// Agrupa las opciones en categorías para reducir la cantidad de números
const OPCIONES_CATEGORIAS = [
  {
    titulo: "Preguntas frecuentes",
    opciones: [
      "¿Cuál es el horario de atención?",
      "¿Dónde están ubicados?",
      "¿Cómo puedo hacer una compra?",
      "¿Qué métodos de pago aceptan?",
      "¿Tienen despacho a domicilio? ¿Cuánto cuesta?",
      "¿Tienen garantía los productos?"
    ]
  },
  {
    titulo: "Ayuda sobre productos",
    opciones: [
      "Buscar productos por nombre o categoría.",
      "Consultar disponibilidad de stock.",
      "Solicitar ficha técnica o detalles de un producto."
    ]
  },
  {
    titulo: "Soporte de cuenta",
    opciones: [
      "¿Cómo recupero mi contraseña?",
      "¿Cómo actualizo mis datos personales?",
      "¿Cómo elimino mi cuenta?"
    ]
  },
  {
    titulo: "Asistencia y seguimiento",
    opciones: [
      "Contacto directo con un asesor humano.",
      "Consultar estado de una compra ingresando el número de pedido.",
      "Ver historial de compras."
    ]
  },
  {
    titulo: "Otros",
    opciones: [
      "Informar sobre ofertas actuales.",
      "Dejar sugerencias o comentarios sobre la tienda.",
      "Ayuda con problemas de acceso, errores en la web.",
      "Mostrar el carrito actual."
    ]
  }
];

// Mapear cada opción a un código de categoría y subopción
const OPCION_MAP = [];
let num = 1;
OPCIONES_CATEGORIAS.forEach((cat, i) => {
  cat.opciones.forEach((op, j) => {
    OPCION_MAP.push({ cat: i + 1, sub: j + 1, texto: op, global: num });
    num++;
  });
});

// RESPUESTAS: ahora usa el número de categoría y subopción, no el número global
const RESPUESTAS_CAT_SUB = [
  // Preguntas frecuentes
  { cat: 1, sub: 1, respuesta: "Nuestro horario es de lunes a viernes de 8:30 a 18:30 y sábados de 9:00 a 14:00." },
  { cat: 1, sub: 2, respuesta: "Estamos ubicados en Av. Principal 1234, Santiago. Puedes ver el mapa en la sección 'Nuestras tiendas'." },
  { cat: 1, sub: 3, respuesta: "Para comprar, agrega productos al carrito y sigue los pasos de pago. Si necesitas ayuda, dime el producto que buscas." },
  { cat: 1, sub: 4, respuesta: "Aceptamos pagos con tarjeta de crédito/débito, transferencia bancaria y efectivo en tienda." },
  { cat: 1, sub: 5, respuesta: "Realizamos envíos a todo Chile. El costo y tiempo de despacho depende de tu ubicación y se calcula al finalizar la compra." },
  { cat: 1, sub: 6, respuesta: "Todos nuestros productos cuentan con garantía legal. Si tienes dudas sobre la garantía de un producto específico, dime el nombre del producto." },

  // Ayuda sobre productos
  { cat: 2, sub: 1, respuesta: "¿Qué producto buscas? Escribe el nombre o la categoría y te ayudo a encontrarlo." },
  { cat: 2, sub: 2, respuesta: "Puedes consultar el stock actualizado en cada producto. Si tienes dudas, dime el nombre del producto y reviso su disponibilidad." },
  { cat: 2, sub: 3, respuesta: "Indícame el nombre del producto y te envío su ficha técnica o detalles." },

  // Soporte de cuenta
  { cat: 3, sub: 1, respuesta: "Puedes recuperar tu contraseña desde la opción '¿Olvidaste tu contraseña?' en la página de inicio de sesión." },
  { cat: 3, sub: 2, respuesta: "Puedes actualizar tus datos personales en la sección 'Datos personales' de tu cuenta." },
  { cat: 3, sub: 3, respuesta: "Para eliminar tu cuenta, ve a 'Datos personales' y selecciona 'Eliminar cuenta'. Si necesitas ayuda, escríbenos." },

  // Asistencia y seguimiento
  { cat: 4, sub: 1, respuesta: "¿Quieres que un asesor te contacte? Déjanos tu correo o teléfono y te llamaremos. También puedes escribirnos a contacto@fercomet.cl o al WhatsApp +56 9 1234 5678." },
  { cat: 4, sub: 2, respuesta: "Si tienes el número de tu compra, escríbelo aquí y te ayudo a revisar el estado. Los estados pueden ser: pendiente, despachado, entregado, listo para retiro, cancelado, en preparación." },
  { cat: 4, sub: 3, respuesta: () => {
      const usuario = JSON.parse(localStorage.getItem("Usuario") || "null");
      if (!usuario) return "Debes iniciar sesión para ver tu historial de compras.";
      return "Puedes ver tu historial de compras en la sección 'Mis compras' de tu cuenta.";
    }
  },

  // Otros
  { cat: 5, sub: 1, respuesta: "¡Tenemos ofertas y novedades! Visita la sección de productos destacados o pregunta por una categoría para ver promociones actuales." },
  { cat: 5, sub: 2, respuesta: "¡Tu opinión es importante! Escribe aquí tu sugerencia o comentario y lo enviaremos a nuestro equipo." },
  { cat: 5, sub: 3, respuesta: "¿Tienes problemas técnicos? Describe el error y nuestro equipo técnico te ayudará lo antes posible." },
  { cat: 5, sub: 4, respuesta: () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!cart.length) return "Tu carrito está vacío.";
      return "Tienes " + cart.length + " producto(s) en tu carrito.";
    }
  }
];

// Mostrar menú agrupado
function mostrarOpcionesChatbot() {
  let lista = "<b>¡Hola! Soy el asistente virtual de Fercomet. Selecciona una categoría escribiendo el número:</b><br><ol style='padding-left:18px;'>";
  OPCIONES_CATEGORIAS.forEach((cat, i) => {
    lista += `<li>${cat.titulo}</li>`;
  });
  lista += "</ol><span style='font-size:0.97rem;color:#888;'>O escribe tu pregunta directamente.</span>";
  agregarMensaje(lista, "bot");
}

// Mostrar subopciones de una categoría
function mostrarSubopciones(catNum) {
  const cat = OPCIONES_CATEGORIAS[catNum - 1];
  if (!cat) return;
  let lista = `<b>${cat.titulo}:</b><br>Elige una opción escribiendo el número:<br><ol style='padding-left:18px;'>`;
  cat.opciones.forEach((op, j) => {
    lista += `<li>${op}</li>`;
  });
  lista += "</ol><span style='font-size:0.97rem;color:#888;'>O escribe tu pregunta directamente.</span>";
  agregarMensaje(lista, "bot");
  // Mostrar el botón volver solo en la subcategoría
  setTimeout(agregarBotonVolverMenu, 100);
}

// Buscar respuesta por categoría y subopción
function buscarRespuestaPorCatSub(catNum, subNum) {
  const obj = RESPUESTAS_CAT_SUB.find(r => r.cat === catNum && r.sub === subNum);
  if (!obj) return null;
  if (typeof obj.respuesta === "function") return obj.respuesta();
  return obj.respuesta;
}

// Preguntas/respuestas frecuentes básicas
const OPCIONES = [
  "¿Cuál es el horario de atención?",
  "¿Dónde están ubicados?",
  "¿Cómo puedo hacer una compra?",
  "¿Qué métodos de pago aceptan?",
  "¿Cómo puedo hacer seguimiento a mi pedido?",
  "¿Tienen despacho a domicilio? ¿Cuánto cuesta?",
  "¿Cómo solicito una cotización?",
  "¿Qué hago si tengo problemas con mi compra?",
  "¿Cómo puedo devolver un producto?",
  "¿Tienen garantía los productos?",
  "Buscar productos por nombre o categoría.",
  "Consultar disponibilidad de stock.",
  "Solicitar ficha técnica o detalles de un producto.",
  "¿Cómo recupero mi contraseña?",
  "¿Cómo actualizo mis datos personales?",
  "¿Cómo elimino mi cuenta?",
  "Contacto directo con un asesor humano.",
  "Consultar estado de una compra ingresando el número de pedido.",
  "Informar sobre ofertas actuales.",
  "Dejar sugerencias o comentarios sobre la tienda.",
  "Ayuda con problemas de acceso, errores en la web.",
  "Mostrar el carrito actual.",
  "Ver historial de compras."
];

function agregarMensaje(texto, tipo = "bot") {
  const mensajes = document.getElementById("chatbot-messages");
  const msgDiv = document.createElement("div");
  msgDiv.className = `chatbot-msg ${tipo}`;
  msgDiv.innerHTML = `<div class="msg-bubble">${texto}</div>`;
  mensajes.appendChild(msgDiv);
  mensajes.scrollTop = mensajes.scrollHeight;
}


// Modifica la función responder para soportar categorías y subopciones
// Estado global del chatbot para manejar selección de categorías y subopciones
let estadoChatbot = { esperandoSubopcion: false, categoriaSeleccionada: null };

function responder(pregunta) {
  const lower = pregunta.toLowerCase().trim();

  // Si está esperando subopción
  if (estadoChatbot.esperandoSubopcion && estadoChatbot.categoriaSeleccionada) {
    const subNum = parseInt(lower, 10);
    const cat = OPCIONES_CATEGORIAS[estadoChatbot.categoriaSeleccionada - 1];
    if (!isNaN(subNum)) {
      if (cat && subNum >= 1 && subNum <= cat.opciones.length) {
        const respuesta = buscarRespuestaPorCatSub(estadoChatbot.categoriaSeleccionada, subNum);
        // Mostrar respuesta y botón para reiniciar el chat
        agregarMensaje(respuesta || "Opción no válida. Por favor, selecciona un número de la lista.", "bot");
        agregarBotonVolverMenu();
        estadoChatbot.esperandoSubopcion = false;
        estadoChatbot.categoriaSeleccionada = null;
        return null;
      } else if (subNum >= 1 && subNum <= OPCIONES_CATEGORIAS.length) {
        // Si el usuario ingresa otro número de categoría, mostrar subopciones de esa categoría
        mostrarSubopciones(subNum);
        estadoChatbot.esperandoSubopcion = true;
        estadoChatbot.categoriaSeleccionada = subNum;
        return null;
      } else {
        estadoChatbot.esperandoSubopcion = false;
        estadoChatbot.categoriaSeleccionada = null;
        agregarBotonVolverMenu();
        return "Opción no válida. Por favor, selecciona un número de la lista.";
      }
    } else {
      estadoChatbot.esperandoSubopcion = false;
      estadoChatbot.categoriaSeleccionada = null;
      agregarBotonVolverMenu();
      return responder(lower);
    }
  }

  // Si el usuario escribe un número de categoría
  const catNum = parseInt(lower, 10);
  if (!isNaN(catNum) && catNum >= 1 && catNum <= OPCIONES_CATEGORIAS.length) {
    mostrarSubopciones(catNum);
    estadoChatbot.esperandoSubopcion = true;
    estadoChatbot.categoriaSeleccionada = catNum;
    return null;
  }

  // Si el usuario escribe un número global (opción directa)
  for (const { pregunta: regex, respuesta } of RESPUESTAS) {
    if (regex instanceof RegExp && regex.test(lower)) {
      if (typeof respuesta === "function") return respuesta();
      return respuesta;
    }
  }

  return "¡Gracias por tu mensaje! Un asesor te responderá pronto o puedes escribir tu consulta más detallada.";
}

document.addEventListener("DOMContentLoaded", () => {
  // Insertar el HTML del chatbot si no está ya en el DOM
  if (!document.getElementById("fercomet-chatbot-widget")) {
    fetch("/Modulos/Chatbot/chatbot.html")
      .then(r => r.text())
      .then(html => {
        document.body.insertAdjacentHTML("beforeend", html);
        inicializarChatbot();
      });
  } else {
    inicializarChatbot();
  }
});

function inicializarChatbot() {
  const widget = document.getElementById("fercomet-chatbot-widget");
  const toggleBtn = document.getElementById("chatbot-toggle-btn");
  const windowDiv = document.getElementById("chatbot-window");
  const closeBtn = document.getElementById("chatbot-close-btn");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");
  const mensajes = document.getElementById("chatbot-messages");

  // Mostrar/ocultar ventana
  toggleBtn.onclick = () => {
    windowDiv.style.display = "flex";
    mensajes.scrollTop = mensajes.scrollHeight;
    if (mensajes.childElementCount === 0) {
      mostrarOpcionesChatbot();
    }
  };
  closeBtn.onclick = () => {
    windowDiv.style.display = "none";
  };

  // Botón para volver al menú principal
  function agregarBotonVolverMenu() {
    // Evita duplicados
    if (document.getElementById("chatbot-volver-menu-btn")) return;
    const mensajesDiv = document.getElementById("chatbot-messages");
    const volverDiv = document.createElement("div");
    volverDiv.style.textAlign = "center";
    volverDiv.style.margin = "10px 0";
    volverDiv.innerHTML = `
      <button id="chatbot-volver-menu-btn" style="background:#32735B;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:600;cursor:pointer;margin-top:8px;">
        <i class="bi bi-arrow-repeat"></i> Volver al menú principal
      </button>
    `;
    mensajesDiv.appendChild(volverDiv);
    mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
    document.getElementById("chatbot-volver-menu-btn").onclick = () => {
      mensajesDiv.innerHTML = "";
      mostrarOpcionesChatbot();
    };
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;
    agregarMensaje(pregunta, "user");
    setTimeout(() => {
      const respuesta = responder(pregunta);
      if (respuesta) agregarMensaje(respuesta, "bot");
      // Solo agregar el botón si NO estamos esperando subopción (es decir, después de una respuesta final o menú principal)
      // Ya no se agrega aquí, sino en mostrarSubopciones
    }, 600);
    input.value = "";
  };
  if (mensajes.childElementCount === 0) {
    mostrarOpcionesChatbot();
    // No agregar el botón aquí
  }
}
