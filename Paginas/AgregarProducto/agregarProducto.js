// Importar las funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA50EDq4nAaqNx3HICdZJPAnGNMdOsyb1k",
  authDomain: "fercomet-32e92.firebaseapp.com",
  projectId: "fercomet-32e92",
  storageBucket: "fercomet-32e92.firebasestorage.app",
  messagingSenderId: "995994877980",
  appId: "1:995994877980:web:1239c3e358b596e562dfd9",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

// Leer productos con filtros
async function loadProducts() {
  const productList = document.getElementById('productList');
  const filterCategory = document.getElementById('filterCategory').value;
  const searchProduct = document.getElementById('searchProduct').value.toLowerCase();
  productList.innerHTML = ""; // Limpiar la lista antes de cargarla

  const categories = [
    "automotriz", "construccion", "electricidad", "gasfiteria", "griferia",
    "herramientas", "jardineria", "pinturas", "seguridad"
  ];

  const filteredCategories = filterCategory ? [filterCategory] : categories;

  for (const category of filteredCategories) {
    const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nombre.toLowerCase().includes(searchProduct)) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <img src="${data.imagenUrl}" alt="${data.nombre}">
          <div class="card-body">
            <h5>${data.nombre}</h5>
            <p>${data.descripcion}</p>
            <p class="price">$${data.precio}</p>
            <p>Cantidad: ${data.cantidad}</p>
            <button class="edit" onclick="editProduct('${category}', '${doc.id}')">Editar</button>
            <button class="delete" onclick="confirmDelete('${category}', '${doc.id}')">Eliminar</button>
          </div>
        `;
        productList.appendChild(card);
      }
    });
  }
}

// Agregar eventos para filtros y búsqueda
document.getElementById('filterCategory').addEventListener('change', loadProducts);
document.getElementById('searchButton').addEventListener('click', loadProducts);

// Confirmar eliminación
async function confirmDelete(category, id) {
  try {
    const docRef = doc(db, "Products", category, "items", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const confirmed = await showConfirmation(
        `¿Estás seguro de que deseas eliminar el producto "${data.nombre}" con la descripción "${data.descripcion}"?`
      );
      if (confirmed) {
        await deleteProduct(category, id);
        showNotification("Producto eliminado correctamente", "success");
      } else {
        showNotification("Operación cancelada", "error");
      }
    } else {
      showNotification("El producto no existe o ya ha sido eliminado.", "error");
    }
  } catch (error) {
    console.error("Error al consultar el producto:", error);
    showNotification("Error al consultar el producto", "error");
  }
}

// Hacer que confirmDelete esté disponible globalmente
window.confirmDelete = confirmDelete;

// Eliminar producto
async function deleteProduct(category, id) {
  try {
    await deleteDoc(doc(db, "Products", category, "items", id));
    loadProducts(); // Recargar la lista de productos
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    showNotification("Error al eliminar producto", "error");
  }
}

// Editar producto
function editProduct(category, id) {
  // Redirigir a la página de edición con los datos del producto en la URL
  window.location.href = `/Paginas/EditarProducto/editarProducto.html?category=${category}&id=${id}`;
}

// Hacer que editProduct esté disponible globalmente
window.editProduct = editProduct;

// Cargar productos al inicio
loadProducts();
