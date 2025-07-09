import { db } from "../../Servicios/firebaseConfig.js";
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Inicializa Mercado Pago con la Public Key
const mp = new window.MercadoPago('APP_USR-49168db0-73aa-48ce-918c-7b6aed07bec1', { locale: 'es-CL' });

const metodoBtns = document.querySelectorAll('.metodo-btn');
const paypalBtnContainer = document.getElementById('paypal-button-container');
const mpBtnContainer = document.getElementById('mp-btn-container');
const paymentForm = document.getElementById('paymentForm'); // Formulario de tarjeta de crédito/débito
const paymentResult = document.getElementById('paymentResult');

metodoBtns.forEach(btn => {
  btn.addEventListener('click', async function () {
    metodoBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const metodo = this.getAttribute('data-metodo');

    // Ocultar todos los contenedores
    if (paypalBtnContainer) paypalBtnContainer.style.display = "none";
    if (mpBtnContainer) mpBtnContainer.style.display = "none";
    if (paymentForm) paymentForm.style.display = "none";

    if (metodo === "tarjeta") {
      // Mostrar el formulario de tarjeta de crédito/débito
      paymentForm.style.display = "block";
      paymentResult.innerHTML = "";
    } else if (metodo === "mercadopago") {
      // Mostrar el botón de Mercado Pago
      mpBtnContainer.style.display = "block";

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      if (cart.length === 0) {
        mpBtnContainer.innerHTML = "<div class='alert alert-danger'>El carrito está vacío.</div>";
        return;
      }

      const preference = {
        items: cart.map(item => ({
          title: item.name,
          quantity: item.cantidad,
          currency_id: "CLP",
          unit_price: Number(item.price)
        })),
        auto_return: "approved",
        back_urls: {
          success: "https://www.tu-dominio.com/paginas/exito.html",
          failure: "https://www.tu-dominio.com/paginas/error.html",
          pending: "https://www.tu-dominio.com/paginas/pendiente.html"
        }
      };

      try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer APP_USR-7394783910348918-061002-5aa33507e541c444be6f45a28a9ed465-392440340"
          },
          body: JSON.stringify(preference)
        });

        const data = await response.json();

        if (!data.id) {
          mpBtnContainer.innerHTML = `<div class='alert alert-danger'>Error Mercado Pago: ${data.message || JSON.stringify(data)}</div>`;
          return;
        }

        mp.bricks().create("wallet", "mp-btn-container", {
          initialization: { preferenceId: data.id },
          customization: { texts: { valueProp: 'Paga con Mercado Pago' } }
        });
      } catch (e) {
        mpBtnContainer.innerHTML = `<div class='alert alert-danger'>No se pudo cargar Mercado Pago.<br>${e.message}</div>`;
      }
    } else if (metodo === "paypal") {
      // Mostrar el botón de PayPal
      paypalBtnContainer.style.display = "block";
      paymentResult.innerHTML = "";
      if (!paypalBtnContainer.hasChildNodes()) {
        paypal.Buttons({
          createOrder: function (data, actions) {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            let total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
            if (total === 0) {
              paymentResult.innerHTML = "<div class='alert alert-danger'>El carrito está vacío.</div>";
              return;
            }
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: total.toFixed(2)
                }
              }]
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              localStorage.setItem("cart", JSON.stringify([]));
              paypalBtnContainer.style.display = "none";
              document.getElementById('successMessage').style.display = "flex";
              setTimeout(() => {
                window.location.href = "/Paginas/Inicio/index.html";
              }, 3000);
            });
          }
        }).render('#paypal-button-container');
      }
    } else if (metodo === "transferencia") {
      // Mostrar los datos de transferencia bancaria directamente en el resultado
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);

      paymentResult.innerHTML = `
        <div class="alert alert-info">
          <strong>Datos para Transferencia Bancaria:</strong>
          <ul style="list-style:none; padding:0; margin:10px 0;">
            <li><strong>RUT:</strong> 11.111.111-1</li>
            <li><strong>N° Cuenta:</strong> 123456789</li>
            <li><strong>Nombre:</strong> FercometSPA</li>
            <li><strong>Monto:</strong> $${total.toLocaleString('es-CL')}</li>
          </ul>
          Realiza tu pago y confirma la transferencia.
        </div>
        <button id="confirmTransferButton" class="pago-btn">Confirmar Transferencia</button>
      `;

      // Agregar evento al botón de confirmar transferencia
      const confirmTransferButton = document.getElementById("confirmTransferButton");
      confirmTransferButton.addEventListener("click", () => {
        alert("Transferencia confirmada. Gracias por tu compra.");
        window.location.href = "/Paginas/Inicio/index.html";
      });
    }
  });
});

// Validar formulario de tarjeta de crédito/débito
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

  // Guardar compra en Firestore
  try {
    const usuario = JSON.parse(localStorage.getItem("Usuario"));
    const userDetails = JSON.parse(localStorage.getItem("userDetails")) || {}; // Obtener userDetails desde localStorage

    if (usuario && usuario.uid) {
      const userDocRef = doc(db, "usuarios", usuario.uid);

      // Calcular total
      const total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);

      // Crear objeto compra con estado inicial "pendiente"
      const compra = {
        fecha: new Date().toISOString(),
        total,
        estado: "pendiente", // <-- Estado inicial
        productos: cart.map(item => ({
          id: item.productId || item.id,
          nombre: item.name,
          cantidad: item.cantidad,
          precio: item.price
        })),
        usuario: {
          uid: usuario.uid,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          rut: usuario.rut,
          email: usuario.email
        },
        retiro: {
          ...userDetails // Agregar los detalles del usuario desde localStorage en el apartado "retiro"
        }
      };

      // Agregar la compra al array "compras" en Firestore (usuario)
      await updateDoc(userDocRef, {
        compras: arrayUnion(compra),
        userDetails // Actualizar también los detalles del usuario en Firestore
      });

      // Guardar la compra en la colección global "compras"
      await addDoc(collection(db, "compras"), compra);
    }
  } catch (err) {
    console.error("Error al guardar la compra en Firestore:", err);
    // No bloquea el flujo de compra
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