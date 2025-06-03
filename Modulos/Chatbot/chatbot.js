import { db, auth } from "../../Servicios/firebaseConfig.js";
import { collection, addDoc, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
      "Consultar estado de mis compras" // Restaurar esta opción aquí
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
    titulo: "Hablar con un ejecutivo", // Nueva categoría
    opciones: [
      "Conectar con un ejecutivo para asistencia personalizada."
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
  { 
    cat: 2, 
    sub: 3, 
    respuesta: "Déjame revisar el estado de tus compras. Por favor, espera un momento.", 
    accion: consultarEstadoCompras // Vincular la acción de consultar estado de compras
  },

  // Soporte de cuenta
  { cat: 3, sub: 1, respuesta: "Puedes recuperar tu contraseña desde la opción '¿Olvidaste tu contraseña?' en la página de inicio de sesión." },
  { cat: 3, sub: 2, respuesta: "Puedes actualizar tus datos personales en la sección 'Datos personales' de tu cuenta." },
  { cat: 3, sub: 3, respuesta: "Para eliminar tu cuenta, ve a 'Datos personales' y selecciona 'Eliminar cuenta'. Si necesitas ayuda, escríbenos." },
  
  // Hablar con un ejecutivo
  { 
    cat: 4, 
    sub: 1, 
    respuesta: `Un ejecutivo estará disponible para ayudarte pronto.<br>
                <button id="abrir-chat-ejecutivo" class="btn btn-primary mt-2">Abrir chat con ejecutivo</button>` 
  }
];

// Función para enviar mensajes al sistema administrativo de asistencia
async function enviarMensajeAdministrativo(mensaje) {
  const usuario = auth.currentUser;
  if (!usuario) {
    console.error("Usuario no autenticado. No se puede enviar el mensaje.");
    return;
  }

  try {
    await addDoc(collection(db, "asistenciaChatbot"), {
      uid: usuario.uid,
      mensaje,
      tipo: "user",
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al enviar el mensaje administrativo:", error);
  }
}

// Estado global del chatbot para manejar selección de categorías y subopciones
let estadoChatbot = { esperandoSubopcion: false, categoriaSeleccionada: null };

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
  estadoChatbot.subopcionSeleccionada = null; // Resetear subopción seleccionada
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

// Función para normalizar texto (eliminar acentos y convertir a minúsculas)
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
}

async function consultarDisponibilidadProducto(nombreProducto) {
  const normalizedQuery = normalizarTexto(nombreProducto);
  const categorias = ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];
  let encontrado = false;
  let mensaje = `<b>Resultados para "${nombreProducto}":</b><br>`;

  try {
    for (const categoria of categorias) {
      const productosRef = collection(db, "Products", categoria, "items"); // Subcolección 'items' dentro de cada categoría
      const querySnapshot = await getDocs(productosRef);

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const normalizedProductName = normalizarTexto(data.nombre);

        if (normalizedProductName.includes(normalizedQuery)) {
          encontrado = true;
          mensaje += data.cantidad > 0
            ? `El producto "<strong>${data.nombre}</strong>" está disponible con <strong>${data.cantidad}</strong> unidades en stock en la categoría "<strong>${categoria}</strong>".<br>`
            : `El producto "<strong>${data.nombre}</strong>" no tiene stock disponible actualmente en la categoría "<strong>${categoria}</strong>".<br>`;
        }
      });
    }

    if (encontrado) {
      agregarMensaje(mensaje, "bot");
    } else {
      agregarMensaje(`Lo siento, no encontré ningún producto con el nombre "<strong>${nombreProducto}</strong>".`, "bot");
    }
  } catch (error) {
    console.error("Error al consultar disponibilidad en Firebase:", error);
    agregarMensaje("Lo siento, hubo un problema al consultar la disponibilidad del producto.", "bot");
  }
}

async function buscarProductoPorNombreOCategoria(nombreProducto) {
  const normalizedQuery = normalizarTexto(nombreProducto);
  const categorias = ["automotriz", "construccion", "electricidad", "gasfiteria", "griferia", "herramientas", "jardineria", "pinturas", "seguridad"];
  let encontrado = false;
  let mensaje = `<b>Resultados para "${nombreProducto}":</b><br>`;

  try {
    for (const categoria of categorias) {
      const productosRef = collection(db, "Products", categoria, "items"); // Subcolección 'items' dentro de cada categoría
      const querySnapshot = await getDocs(productosRef);

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const normalizedProductName = normalizarTexto(data.nombre);

        if (normalizedProductName.includes(normalizedQuery)) {
          encontrado = true;
          const link = `/Paginas/Productos/productos.html?category=${categoria}&search=${encodeURIComponent(nombreProducto)}`;
          mensaje += `Producto "<strong>${data.nombre}</strong>" encontrado. <a href="${link}" target="_blank">Haz clic aquí para buscar</a>.<br>`;
        }
      });
    }

    if (encontrado) {
      agregarMensaje(mensaje, "bot");
    } else {
      agregarMensaje(`Lo siento, no encontré ningún producto con el nombre "<strong>${nombreProducto}</strong>".`, "bot");
    }
  } catch (error) {
    console.error("Error al buscar productos en Firebase:", error);
    agregarMensaje("Lo siento, hubo un problema al buscar el producto.", "bot");
  }
}

// Nueva función para consultar el estado de las compras del usuario logueado
async function consultarEstadoCompras() {
  const usuario = auth.currentUser;

  if (!usuario) {
    agregarMensaje("Debes iniciar sesión para consultar el estado de tus compras.", "bot");
    return;
  }

  try {
    const comprasRef = collection(db, "compras");
    const comprasSnapshot = await getDocs(comprasRef);

    const comprasUsuario = [];
    comprasSnapshot.forEach(doc => {
      const compra = doc.data();
      if (compra.usuario && compra.usuario.uid === usuario.uid) {
        compra.numeroCompra = "#" + doc.id.slice(-6).toUpperCase(); // Adjuntar número de compra
        comprasUsuario.push(compra);
      }
    });

    if (comprasUsuario.length === 0) {
      agregarMensaje("No tienes compras registradas.", "bot");
      return;
    }

    let mensaje = "<b>Estado de tus compras:</b><br><ul>";
    comprasUsuario.forEach(compra => {
      const estados = {
        pendiente: "Pendiente",
        pendiente_transferencia: "Pendiente Transferencia",
        transferencia_recibida: "Transferencia Recibida",
        despachado: "Despachado",
        entregado: "Entregado",
        listo_retiro: "Listo para el Retiro",
        en_preparacion: "En preparación",
        cancelado: "Cancelado",
        otro: "Otro"
      };
      const estado = estados[compra.estado] || compra.estado || "Pendiente";
      mensaje += `<li><strong>Compra ${compra.numeroCompra}:</strong> Estado: ${estado}</li>`;
    });
    mensaje += "</ul>";

    agregarMensaje(mensaje, "bot");
  } catch (error) {
    console.error("Error al consultar el estado de las compras:", error);
    agregarMensaje("Lo siento, hubo un problema al consultar el estado de tus compras.", "bot");
  }
}

// Función para abrir el segundo chatbot para hablar con un ejecutivo
function abrirChatEjecutivo() {
  const mensajes = document.getElementById("chatbot-messages");
  mensajes.innerHTML = ""; // Limpiar mensajes del chatbot original
  agregarMensaje("<b>¡Bienvenido al chat con un ejecutivo!</b><br>Escribe tu consulta y un ejecutivo te responderá.", "bot");

  const form = document.getElementById("chatbot-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById("chatbot-input");
    const mensaje = input.value.trim();
    if (!mensaje) return;

    agregarMensaje(mensaje, "user");
    input.value = "";

    const usuario = JSON.parse(localStorage.getItem("Usuario")); // Obtener datos del usuario desde localStorage
    if (!usuario || !usuario.uid) {
      agregarMensaje("Debes iniciar sesión para enviar mensajes al ejecutivo.", "bot");
      return;
    }

    try {
      await addDoc(collection(db, "asistenciaChatbot"), {
        uid: usuario.uid,
        nombre: usuario.nombre || "Usuario",
        mensaje,
        tipo: "user",
        fecha: new Date().toISOString(),
      });
      agregarMensaje("Tu mensaje ha sido enviado al ejecutivo. Por favor, espera una respuesta.", "bot");
    } catch (error) {
      console.error("Error al enviar el mensaje al ejecutivo:", error);
      agregarMensaje("Hubo un problema al enviar tu mensaje. Inténtalo nuevamente.", "bot");
    }
  };
}

// Modifica la función responder para manejar el botón de abrir el chat con el ejecutivo
function responder(pregunta) {
  const lower = pregunta.toLowerCase().trim();

  // Si está esperando subopción
  if (estadoChatbot.esperandoSubopcion && estadoChatbot.categoriaSeleccionada) {
    const subNum = parseInt(lower, 10);
    const cat = OPCIONES_CATEGORIAS[estadoChatbot.categoriaSeleccionada - 1];
    if (!isNaN(subNum)) {
      if (cat && subNum >= 1 && subNum <= cat.opciones.length) {
        const respuestaObj = RESPUESTAS_CAT_SUB.find(r => r.cat === estadoChatbot.categoriaSeleccionada && r.sub === subNum);
        if (respuestaObj) {
          agregarMensaje(respuestaObj.respuesta, "bot");
          if (respuestaObj.accion) {
            respuestaObj.accion(); // Ejecutar la acción vinculada
          }
          estadoChatbot.esperandoSubopcion = false;
          estadoChatbot.categoriaSeleccionada = null;
          return;
        }
        agregarMensaje("Déjame revisar eso para ti...", "bot"); // Mensaje intermedio
        setTimeout(() => {
          const respuesta = buscarRespuestaPorCatSub(estadoChatbot.categoriaSeleccionada, subNum);
          agregarMensaje(respuesta || "Lo siento, no encontré información sobre esa opción.", "bot");
          estadoChatbot.esperandoSubopcion = false;
          estadoChatbot.categoriaSeleccionada = null;
        }, 1000); // Simular tiempo de "pensar"
        return null;
      } else {
        agregarMensaje("Hmm, parece que esa opción no es válida. ¿Puedes intentarlo de nuevo?", "bot");
        return null;
      }
    }
    agregarMensaje("Por favor, ingresa un número válido o describe mejor lo que buscas.", "bot");
    return null;
  }

  // Si el usuario escribe un número de categoría
  const catNum = parseInt(lower, 10);
  if (!isNaN(catNum) && catNum >= 1 && catNum <= OPCIONES_CATEGORIAS.length) {
    agregarMensaje("¡Entendido! Aquí están las opciones disponibles:", "bot"); // Mensaje intermedio
    setTimeout(() => {
      mostrarSubopciones(catNum);
      estadoChatbot.esperandoSubopcion = true;
      estadoChatbot.categoriaSeleccionada = catNum;
    }, 800); // Simular tiempo de "pensar"
    return null;
  }

  agregarMensaje("¡Gracias por tu mensaje! Un asesor te responderá pronto o puedes escribir tu consulta más detallada.", "bot");
  return null; // No llamar a mostrarOpcionesChatbot automáticamente
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
  const resetBtn = document.getElementById("chatbot-reset-btn"); // Nuevo botón de reinicio

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

  form.onsubmit = (e) => {
    e.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;
    agregarMensaje(pregunta, "user");
    setTimeout(() => {
      const respuesta = responder(pregunta);
      if (respuesta) agregarMensaje(respuesta, "bot");
    }, 600);
    input.value = "";
  };

  resetBtn.onclick = () => {
    mensajes.innerHTML = ""; // Limpiar mensajes
    mostrarOpcionesChatbot(); // Mostrar mensaje inicial del chatbot
  };

  if (mensajes.childElementCount === 0) {
    mostrarOpcionesChatbot();
  }
}
