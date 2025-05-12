import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Validadores y helpers ---
const cardNumberInput = document.getElementById('cardNumber');
const cardTypeIcon = document.getElementById('cardTypeIcon');
const cardNameInput = document.getElementById('cardName');
const expiryInput = document.getElementById('expiry');
const cvvInput = document.getElementById('cvv');
const toggleCvv = document.getElementById('toggleCvv');

// Detectar tipo de tarjeta
cardNumberInput.addEventListener('input', function() {
  let value = cardNumberInput.value.replace(/\D/g, '').substring(0,16);
  // Formato 0000 0000 0000 0000
  cardNumberInput.value = value.replace(/(.{4})/g, '$1 ').trim();

  // Detectar tipo
  let type = '';
  if (/^4/.test(value)) type = 'visa';
  else if (/^5[1-5]/.test(value)) type = 'mastercard';
  else if (/^3[47]/.test(value)) type = 'amex';
  else if (/^6(?:011|5)/.test(value)) type = 'discover';
  else if (value.length >= 4) type = 'other';
  else type = '';

  // Mostrar ícono
  cardTypeIcon.innerHTML = '';
  if (type === 'visa') cardTypeIcon.innerHTML = '<img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" style="height:24px;">';
  else if (type === 'mastercard') cardTypeIcon.innerHTML = '<img src="https://img.icons8.com/color/48/000000/mastercard-logo.png" alt="MasterCard" style="height:24px;">';
  else if (type === 'amex') cardTypeIcon.innerHTML = '<img src="https://img.icons8.com/color/48/000000/amex.png" alt="Amex" style="height:24px;">';
  else if (type === 'discover') cardTypeIcon.innerHTML = '<img src="https://img.icons8.com/color/48/000000/discover.png" alt="Discover" style="height:24px;">';
  else if (type === 'other') cardTypeIcon.innerHTML = '<span style="font-size:1.2rem;">&#128179;</span>';
});

// Validar que el nombre no tenga números
cardNameInput.addEventListener('input', function() {
  cardNameInput.value = cardNameInput.value.replace(/[0-9]/g, '');
});

// Autoformatear fecha MM/AA
expiryInput.addEventListener('input', function(e) {
  let value = expiryInput.value.replace(/\D/g, '').substring(0,4);
  if (value.length > 2) value = value.substring(0,2) + '/' + value.substring(2,4);
  expiryInput.value = value;
});

// Mostrar/ocultar CVV
toggleCvv.addEventListener('click', function() {
  if (cvvInput.type === "password") {
    cvvInput.type = "text";
    toggleCvv.style.color = "#007bff";
  } else {
    cvvInput.type = "password";
    toggleCvv.style.color = "#888";
  }
});
toggleCvv.addEventListener('keydown', function(e) {
  if (e.key === "Enter" || e.key === " ") toggleCvv.click();
});

// --- Lógica de pago ---
document.getElementById('paymentForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validación básica de campos
  if (cardNumberInput.value.replace(/\s/g, '').length < 13) {
    document.getElementById('paymentResult').textContent = "Ingrese un número de tarjeta válido.";
    return;
  }
  if (cardNameInput.value.trim().length < 3) {
    document.getElementById('paymentResult').textContent = "Ingrese un nombre válido.";
    return;
  }
  if (!/^\d{2}\/\d{2}$/.test(expiryInput.value)) {
    document.getElementById('paymentResult').textContent = "Ingrese una fecha válida (MM/AA).";
    return;
  }
  if (cvvInput.value.length < 3) {
    document.getElementById('paymentResult').textContent = "Ingrese un CVV válido.";
    return;
  }

  // Obtener carrito del localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    document.getElementById('paymentResult').textContent = "El carrito está vacío.";
    return;
  }

  // Verificar stock y descontar en Firestore
  for (const item of cart) {
    const categoria = item.category || item.subcategoria;
    const productoId = item.productId || item.id;
    const productRef = doc(db, "Products", categoria, "items", productoId);

    const docSnap = await getDoc(productRef);
    if (!docSnap.exists()) {
      document.getElementById('paymentResult').textContent = `No se encontró el producto ${item.name || productoId}.`;
      return;
    }
    const productData = docSnap.data();
    let cantidadDisponible = typeof productData.cantidad === "number"
      ? productData.cantidad
      : (!isNaN(Number(productData.cantidad)) ? Number(productData.cantidad) : undefined);

    if (typeof cantidadDisponible !== "number" || isNaN(cantidadDisponible)) {
      document.getElementById('paymentResult').textContent = `El producto ${item.name || productoId} no tiene campo 'cantidad' válido.`;
      return;
    }
    if (cantidadDisponible < item.cantidad) {
      document.getElementById('paymentResult').textContent = `No hay suficiente stock de ${item.name || productoId}.`;
      return;
    }
  }

  // Descontar stock
  for (const item of cart) {
    const categoria = item.category || item.subcategoria;
    const productoId = item.productId || item.id;
    const productRef = doc(db, "Products", categoria, "items", productoId);

    const docSnap = await getDoc(productRef);
    const productData = docSnap.data();
    let cantidadDisponible = typeof productData.cantidad === "number"
      ? productData.cantidad
      : (!isNaN(Number(productData.cantidad)) ? Number(productData.cantidad) : undefined);

    const newQuantity = cantidadDisponible - item.cantidad;
    await updateDoc(productRef, { cantidad: newQuantity });
  }

  // Vaciar carrito
  localStorage.setItem("cart", JSON.stringify([]));

  // Mostrar mensaje de éxito y ocultar formulario
  document.getElementById('paymentForm').style.display = "none";
  document.getElementById('paymentResult').style.display = "none";
  document.getElementById('successMessage').style.display = "flex";

  // Redirigir al index después de 3 segundos
  setTimeout(() => {
    window.location.href = "/Paginas/Inicio/index.html";
  }, 3000);
});

document.getElementById('cancelarPago').addEventListener('click', function() {
  window.location.href = "/Paginas/Carrito/carrito.html";
});
