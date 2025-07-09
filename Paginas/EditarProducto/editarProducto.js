import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../../Servicios/firebaseConfig.js";

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const category = params.get("category");
const id = params.get("id");

// Cargar datos del producto
async function loadProductData() {
  try {
    const docRef = doc(db, "Products", category, "items", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("nombre").value = data.nombre;
      document.getElementById("precio").value = data.precio;
      document.getElementById("unidad").value = data.unidad;
      document.getElementById("descripcion").value = data.descripcion;
      document.getElementById("imagenUrl").value = data.imagenUrl;
      document.getElementById("cantidad").value = data.cantidad;
      document.getElementById("categoria").value = category;

      // Mostrar la imagen previa
      const imagenPrevia = document.getElementById("imagenPrevia");
      imagenPrevia.src = data.imagenUrl;
      imagenPrevia.style.display = "block";
    } else {
      alert("El producto no existe.");
    }
  } catch (error) {
    console.error("Error al cargar los datos del producto:", error);
  }
}

// Ejecutar todo después de que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  loadProductData();

  // Actualizar la imagen previa cuando se modifique el campo imagenUrl
  document.getElementById("imagenUrl").addEventListener("input", (e) => {
    const imagenPrevia = document.getElementById("imagenPrevia");
    const url = e.target.value;
    if (url) {
      imagenPrevia.src = url;
      imagenPrevia.style.display = "block";
    } else {
      imagenPrevia.style.display = "none";
    }
  });

  // Actualizar producto
  document.getElementById("editProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const docRef = doc(db, "Products", category, "items", id);
      await updateDoc(docRef, {
        nombre: document.getElementById("nombre").value,
        precio: document.getElementById("precio").value,
        unidad: document.getElementById("unidad").value,
        descripcion: document.getElementById("descripcion").value,
        imagenUrl: document.getElementById("imagenUrl").value,
        cantidad: document.getElementById("cantidad").value,
      });
      alert("Producto actualizado correctamente");
      window.location.href = "/Paginas/AgregarProducto/agregarProducto.html";
    } catch (error) {
      console.error("Error al actualizar el producto:", error);
    }
  });
});
