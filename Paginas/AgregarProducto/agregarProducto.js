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
    alert("Producto agregado correctamente");
    document.getElementById('productForm').reset();
    loadProducts();  // Actualizar la lista de productos
  } catch (error) {
    console.error("Error al agregar producto: ", error);
  }
});

// Leer productos
async function loadProducts() {
  const productList = document.getElementById('productList');
  productList.innerHTML = "";  // Limpiar la lista antes de cargarla

  const categories = [
    "automotriz", "construccion", "electricidad", "gasfiteria", "griferia", 
    "herramientas", "jardineria", "pinturas", "seguridad"
  ];

  // Cargar productos por categoría
  for (const category of categories) {
    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);  // Capitalizar la categoría
    productList.appendChild(categoryTitle);

    const querySnapshot = await getDocs(collection(db, "Products", category, "items"));
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${data.nombre}</strong><br>
        Precio: $${data.precio}<br>
        Unidad: ${data.unidad}<br>
        Descripción: ${data.descripcion}<br>
        Cantidad disponible: ${data.cantidad}<br> <!-- Mostrar cantidad -->
        <img src="${data.imagenUrl}" alt="Imagen" width="100">
        <button onclick="deleteProduct('${category}', '${doc.id}')">Eliminar</button>
        <button onclick="editProduct('${category}', '${doc.id}')">Editar</button>
      `;
      productList.appendChild(li);
    });
  }
}

// Eliminar producto
async function deleteProduct(category, id) {
  try {
    await deleteDoc(doc(db, "Products", category, "items", id));  // Eliminar el producto de la subcolección correcta
    alert("Producto eliminado");
    loadProducts();  // Actualizar la lista
  } catch (error) {
    console.error("Error al eliminar producto: ", error);
  }
}

// Editar producto
async function editProduct(category, id) {
  const docRef = doc(db, "Products", category, "items", id);  // Acceder a la subcolección correcta
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('nombre').value = data.nombre;
    document.getElementById('precio').value = data.precio;
    document.getElementById('unidad').value = data.unidad;
    document.getElementById('descripcion').value = data.descripcion;
    document.getElementById('imagenUrl').value = data.imagenUrl;
    document.getElementById('cantidad').value = data.cantidad; // Rellenar cantidad
    
    // Cambiar botón para editar
    const submitButton = document.querySelector('form button');
    submitButton.textContent = "Actualizar Producto";

    submitButton.onclick = async (e) => {
      e.preventDefault();
      await updateDoc(docRef, {
        nombre: document.getElementById('nombre').value,
        precio: document.getElementById('precio').value,
        unidad: document.getElementById('unidad').value,
        descripcion: document.getElementById('descripcion').value,
        imagenUrl: document.getElementById('imagenUrl').value,
        cantidad: document.getElementById('cantidad').value // Actualizar cantidad
      });
      alert("Producto actualizado");
      loadProducts();  // Actualizar la lista
      submitButton.textContent = "Agregar Producto";  // Resetear botón
    };
  }
}

// Cargar productos al inicio
loadProducts();
