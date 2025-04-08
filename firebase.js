import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA50EDq4nAaqNx3HICdZJPAnGNMdOsyb1k",
  authDomain: "fercomet-32e92.firebaseapp.com",
  projectId: "fercomet-32e92",
  storageBucket: "fercomet-32e92.firebasestorage.app",
  messagingSenderId: "995994877980",
  appId: "1:995994877980:web:1239c3e358b596e562dfd9",
  measurementId: "G-J00DPD8T8X"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener los productos desde la subcolección 'items' de la subcolección dada
async function obtenerProductos(subcategoria) {
  // Accedemos a la colección 'productos' y luego a la subcolección correspondiente (construccion, automotriz, etc.)
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
      imagen: data.imagen || "url_imagen_predeterminada"  // Si no hay imagen, se coloca una predeterminada
    };
  });

  return productos;
}

// Exportamos la función para que pueda ser usada en otros archivos
export { obtenerProductos };
