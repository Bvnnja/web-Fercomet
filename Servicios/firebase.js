import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import firebaseConfig from "../../Servicios/firebaseConfig.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Función para obtener los productos desde la subcolección 'items' de la subcolección dada
async function obtenerProductos(subcategoria) {
  const productosCol = collection(db, 'productos', subcategoria, 'items');
  const productosSnapshot = await getDocs(productosCol);

  // Mapear los documentos a un formato más fácil de usar
  const productos = productosSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      nombre: data.nombre,
      precio: data.precio,
      unidad: data.unidad,
      imagen: data.imagen || "url_imagen_predeterminada" // Si no hay imagen, se coloca una predeterminada
    };
  });

  return productos;
}



// Exportamos las funcionalidades para que puedan ser usadas en otros archivos
export { auth, db, obtenerProductos };