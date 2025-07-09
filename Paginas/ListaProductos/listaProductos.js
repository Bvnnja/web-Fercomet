// Importar las funciones de Firebase
import { db } from "../../Servicios/firebaseConfig.js";
import { collection, getDocs, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Mostrar notificación
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.backgroundColor = type === "success" ? "#467a6a" : "#dc3545";
  notification.style.color = "#ffffff";
  notification.style.padding = "10px 20px";
  notification.style.borderRadius = "8px";
  notification.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  notification.style.zIndex = "1000";
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Confirmación personalizada
function showConfirmation(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "999";
    document.body.appendChild(overlay);

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

let allProducts = [];
let currentPage = 1;
const itemsPerPage = 12;

// Leer productos con filtros y paginación
async function loadProducts() {
  const productList = document.getElementById('productList');
  const filterCategory = document.getElementById('filterCategory').value;
  const searchProduct = document.getElementById('searchProduct').value.toLowerCase();
  productList.innerHTML = "";

  const categories = [
    "automotriz", "construccion", "electricidad", "gasfiteria", "griferia",
    "herramientas", "jardineria", "pinturas", "seguridad"
  ];

  const filteredCategories = filterCategory ? [filterCategory] : categories;
  allProducts = [];

  for (const category of filteredCategories) {
    const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nombre.toLowerCase().includes(searchProduct)) {
        allProducts.push({
          ...data,
          id: doc.id,
          category
        });
      }
    });
  }

  renderProducts();
  renderPagination();
}

function renderProducts() {
  const productList = document.getElementById('productList');
  productList.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const productsToShow = allProducts.slice(start, end);

  productsToShow.forEach((data) => {
    // Cambia de div a li para mejor grid y accesibilidad
    const card = document.createElement("li");
    card.className = "product-card";
    card.dataset.category = data.category;
    card.dataset.id = data.id;
    card.innerHTML = `
      <img src="${data.imagenUrl}" alt="${data.nombre}">
      <div class="card-body">
        <h5>${data.nombre}</h5>
        <p>${data.descripcion}</p>
        <p class="price">$${data.precio}</p>
        <p class="cantidad">Cantidad: ${data.cantidad}</p>
        <div class="card-actions">
          <button class="edit"><i class="bi bi-pencil"></i> Editar</button>
          <button class="delete"><i class="bi bi-trash"></i> Eliminar</button>
        </div>
      </div>
    `;
    productList.appendChild(card);
  });
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = "";
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Anterior";
  prevBtn.className = "pagination-btn";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  pagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.className = "pagination-btn" + (i === currentPage ? " active" : "");
    pageBtn.onclick = () => {
      currentPage = i;
      renderProducts();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pagination.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Siguiente";
  nextBtn.className = "pagination-btn";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    renderProducts();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  pagination.appendChild(nextBtn);
}

// Delegación de eventos para los botones Editar y Eliminar
document.getElementById('productList').addEventListener('click', async (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const category = card.dataset.category;
  const id = card.dataset.id;

  if (e.target.classList.contains('edit')) {
    window.location.href = `/Paginas/EditarProducto/editarProducto.html?category=${category}&id=${id}`;
  }
  if (e.target.classList.contains('delete')) {
    await confirmDelete(category, id);
  }
});

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

// Eliminar producto
async function deleteProduct(category, id) {
  try {
    await deleteDoc(doc(db, "Products", category, "items", id));
    loadProducts();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    showNotification("Error al eliminar producto", "error");
  }
}

// Filtros y búsqueda
document.getElementById('filterCategory').addEventListener('change', () => {
  currentPage = 1;
  loadProducts();
});
document.getElementById('searchButton').addEventListener('click', () => {
  currentPage = 1;
  loadProducts();
});

// Cargar productos al inicio
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
