// Importar las funciones de Firebase
import { db } from "../../Servicios/firebaseConfig.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Verificar autenticación al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});

// Agregar producto
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const precio = document.getElementById('precio').value;
  const unidad = document.getElementById('unidad').value;
  const descripcion = document.getElementById('descripcion').value;
  const imagenUrl = document.getElementById('imagenUrl').value;
  const cantidad = document.getElementById('cantidad').value;  // Obtener cantidad
  const categoria = document.getElementById('categoria').value;  // Obtener la categoría seleccionada

  if (!categoria) {
    alert("Por favor, selecciona una categoría.");
    return;
  }

  if (!cantidad || cantidad <= 0) {
    alert("Por favor, ingresa una cantidad válida.");
    return;
  }

  // Mostrar notificación de confirmación personalizada
  const confirmed = await showConfirmation(`¿Estás seguro de que deseas agregar el producto "${nombre}"?`);
  if (!confirmed) {
    showNotification("Operación cancelada", "error");
    return;
  }

  try {
    // Guardar el producto dentro de la categoría seleccionada
    const categoriaRef = collection(db, "Products", categoria, "items");  // Usar la categoría como subcolección
    await addDoc(categoriaRef, {
      nombre,
      precio,
      unidad,
      descripcion,
      imagenUrl,
      cantidad // Agregar cantidad
    });

    // Mostrar notificación de éxito
    showNotification("¡Producto agregado con éxito!", "success");

    document.getElementById('productForm').reset();
    loadProducts();  // Actualizar la lista de productos
  } catch (error) {
    console.error("Error al agregar producto: ", error);
    showNotification("Error al agregar producto", "error");
  }
});

// Función para mostrar notificación
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = type === "success" ? "#467a6a" : "#dc3545"; // Verde para éxito, rojo para error
  notification.style.color = "#ffffff";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "8px";
  notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  notification.style.zIndex = "1000";
  document.body.appendChild(notification);

  // Ocultar la notificación después de 3 segundos
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Función para mostrar confirmación personalizada con fondo oscuro
function showConfirmation(message) {
  return new Promise((resolve) => {
    // Crear el fondo oscuro
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "999";
    document.body.appendChild(overlay);

    // Crear el cuadro de confirmación
    const confirmation = document.createElement("div");
    confirmation.style.position = "fixed";
    confirmation.style.top = "50%";
    confirmation.style.left = "50%";
    confirmation.style.transform = "translate(-50%, -50%)";
    confirmation.style.backgroundColor = "#ffffff";
    confirmation.style.color = "#000000";
    confirmation.style.padding = "20px";
    confirmation.style.borderRadius = "8px";
    confirmation.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.2)";
    confirmation.style.zIndex = "1000";
    confirmation.style.textAlign = "center";

    const text = document.createElement("p");
    text.textContent = message;
    text.style.marginBottom = "20px";

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "space-around";

    const yesButton = document.createElement("button");
    yesButton.textContent = "Sí";
    yesButton.style.backgroundColor = "#467a6a";
    yesButton.style.color = "#ffffff";
    yesButton.style.border = "none";
    yesButton.style.padding = "10px 20px";
    yesButton.style.borderRadius = "5px";
    yesButton.style.cursor = "pointer";

    const noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.style.backgroundColor = "#dc3545";
    noButton.style.color = "#ffffff";
    noButton.style.border = "none";
    noButton.style.padding = "10px 20px";
    noButton.style.borderRadius = "5px";
    noButton.style.cursor = "pointer";

    yesButton.addEventListener("click", () => {
      confirmation.remove();
      overlay.remove();
      resolve(true);
    });

    noButton.addEventListener("click", () => {
      confirmation.remove();
      overlay.remove();
      resolve(false);
    });

    buttons.appendChild(yesButton);
    buttons.appendChild(noButton);
    confirmation.appendChild(text);
    confirmation.appendChild(buttons);
    document.body.appendChild(confirmation);
  });
}

