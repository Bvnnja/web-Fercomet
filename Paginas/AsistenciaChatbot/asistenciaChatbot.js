import { db } from "../../Servicios/firebaseConfig.js";
import { collection, query, orderBy, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const chatsContainer = document.getElementById("chatsContainer");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

let chatActivoUID = null;

// Cargar chats activos
function cargarChatsActivos() {
  const chatsRef = collection(db, "asistenciaChatbot");
  const q = query(chatsRef, orderBy("fecha", "desc"));

  onSnapshot(q, (snapshot) => {
    chatsContainer.innerHTML = "";
    if (snapshot.empty) {
      chatsContainer.innerHTML = `<div class="alert alert-info text-center">No hay chats activos.</div>`;
      return;
    }

    const chatsPorUsuario = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!chatsPorUsuario[data.uid]) {
        chatsPorUsuario[data.uid] = [];
      }
      chatsPorUsuario[data.uid].push(data);
    });

    Object.keys(chatsPorUsuario).forEach((uid) => {
      const mensajes = chatsPorUsuario[uid];
      const nombreUsuario = mensajes[0].nombre || "Usuario";
      const fechaUltimoMensaje = new Date(mensajes[mensajes.length - 1].fecha).toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      });

      const chatCard = document.createElement("div");
      chatCard.className = "col-md-4 mb-4";
      chatCard.innerHTML = `
        <div class="card shadow-sm">
          <div class="card-body">
            <h5 class="card-title">Usuario: ${nombreUsuario}</h5>
            <p class="card-text">Último mensaje: ${mensajes[mensajes.length - 1].mensaje}</p>
            <p class="text-muted" style="font-size:0.9rem;">Última actividad: ${fechaUltimoMensaje}</p>
            <button class="btn btn-primary btn-sm abrir-chat" data-uid="${uid}">Abrir chat</button>
          </div>
        </div>
      `;
      chatsContainer.appendChild(chatCard);
    });

    // Asignar eventos a los botones de abrir chat
    document.querySelectorAll(".abrir-chat").forEach((button) => {
      button.addEventListener("click", () => {
        const uid = button.dataset.uid;
        abrirChatConUsuario(uid);
      });
    });
  });
}

// Abrir chat con un usuario específico
function abrirChatConUsuario(uid) {
  chatActivoUID = uid;
  chatMessages.innerHTML = `<div class="alert alert-info text-center">Cargando mensajes...</div>`;

  const mensajesRef = collection(db, "asistenciaChatbot");
  const q = query(mensajesRef, orderBy("fecha", "asc"));

  onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.uid === uid) {
        const div = document.createElement("div");
        div.className = `chat-message ${data.tipo}`;
        div.textContent = data.mensaje;
        chatMessages.appendChild(div);
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// Enviar mensaje al usuario
async function enviarMensaje(mensaje) {
  if (!chatActivoUID) {
    alert("Selecciona un chat activo para enviar mensajes.");
    return;
  }

  try {
    await addDoc(collection(db, "asistenciaChatbot"), {
      uid: chatActivoUID,
      mensaje,
      tipo: "ejecutivo",
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const mensaje = chatInput.value.trim();
  if (!mensaje) return;
  enviarMensaje(mensaje);
  chatInput.value = "";
});

document.addEventListener("DOMContentLoaded", cargarChatsActivos);
