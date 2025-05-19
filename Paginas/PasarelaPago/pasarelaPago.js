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

  // Guardar compra en Firestore
  try {
    const usuario = JSON.parse(localStorage.getItem("Usuario"));
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
        }
      };

      // Agregar la compra al array "compras" en Firestore (usuario)
      await updateDoc(userDocRef, {
        compras: arrayUnion(compra)
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

const paymentForm = document.getElementById('paymentForm');
const paymentResult = document.getElementById('paymentResult');
const metodoBtns = document.querySelectorAll('.metodo-btn');
const paypalBtnContainer = document.getElementById('paypal-button-container');

metodoBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    metodoBtns.forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const metodo = this.getAttribute('data-metodo');
    // Oculta el botón de PayPal por defecto
    if (paypalBtnContainer) paypalBtnContainer.style.display = "none";
    if (metodo === "tarjeta") {
      paymentForm.style.display = "";
      paymentResult.innerHTML = "";
    } else if (metodo === "mercadopago") {
      paymentForm.style.display = "none";
      paymentResult.innerHTML = `
        <div class="alert alert-info" style="margin-top:20px;">
          <b>Mercado Pago:</b> Haz clic en el botón para pagar con Mercado Pago.<br>
          <button id="btnMercadoPago" class="pago-btn" style="margin-top:12px;">Pagar con Mercado Pago</button>
        </div>
      `;
      setTimeout(() => {
        const btnMP = document.getElementById('btnMercadoPago');
        if (btnMP) {
          btnMP.onclick = function() {
            // Usa tu link real de Mercado Pago
            window.location.href = "https://link.mercadopago.cl/fercomet";
          };
        }
      }, 100);
    } else if (metodo === "paypal") {
      paymentForm.style.display = "none";
      paymentResult.innerHTML = "";
      if (paypalBtnContainer) {
        paypalBtnContainer.style.display = "block";
        // Renderiza el botón solo si no está ya renderizado
        if (!paypalBtnContainer.hasChildNodes()) {
          paypal.Buttons({
            createOrder: function(data, actions) {
              // Puedes calcular el total dinámicamente si lo deseas
              let cart = JSON.parse(localStorage.getItem("cart")) || [];
              let total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
              // Si el carrito está vacío, muestra mensaje y no crea la orden
              if (total === 0) {
                paymentResult.innerHTML = "<div class='alert alert-danger'>El carrito está vacío.</div>";
                return;
              }
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    value: total.toFixed(2) // Monto total del carrito
                  }
                }]
              });
            },
            onApprove: function(data, actions) {
              return actions.order.capture().then(function(details) {
                // Aquí puedes registrar la compra en Firestore si lo deseas
                // Vacía el carrito y muestra mensaje de éxito
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
      }
    } else {
      if (metodo === "bancoestado") {
        paymentResult.innerHTML = "<b>Banco Estado:</b> Realiza tu pago a la cuenta 123456789, rut 11.111.111-1, a nombre de Fercomet. Luego envía el comprobante a pagos@fercomet.cl";
      } else if (metodo === "transferencia") {
        paymentResult.innerHTML = `
          <div style="text-align:left;">
            <b>Datos para Transferencia Bancaria:</b>
            <table style="width:100%;margin:10px 0 10px 0;">
              <tr><td><b>Banco:</b></td><td>Banco Estado</td></tr>
              <tr><td><b>Tipo de cuenta:</b></td><td>Cuenta Corriente</td></tr>
              <tr><td><b>N° Cuenta:</b></td><td>123456789</td></tr>
              <tr><td><b>RUT:</b></td><td>11.111.111-1</td></tr>
              <tr><td><b>Nombre:</b></td><td>Fercomet</td></tr>
              <tr><td><b>Email:</b></td><td>pagos@fercomet.cl</td></tr>
            </table>
            <div class="alert alert-warning" style="font-size:0.98rem;">
              Realiza la transferencia y luego envía el comprobante a <b>pagos@fercomet.cl</b>.<br>
              <b>Importante:</b> Debes confirmar tu compra para que quede registrada.
            </div>
            <button id="confirmarTransferenciaBtn" class="pago-btn" style="margin-top:10px;width:100%;">Confirmar compra por transferencia</button>
          </div>
        `;
      } else if (metodo === "debito") {
        paymentResult.innerHTML = "<b>Débito:</b> Puedes pagar con tu tarjeta de débito en nuestra tienda física.";
      } else if (metodo === "credito") {
        paymentResult.innerHTML = "<b>Crédito:</b> Puedes pagar con tu tarjeta de crédito en nuestra tienda física.";
      } else {
        paymentResult.innerHTML = "<b>Otro método:</b> Consulta con nuestro equipo para coordinar el pago.";
      }

      if (metodo === "transferencia") {
        setTimeout(() => { // Espera a que el botón esté en el DOM
          const btnTransfer = document.getElementById('confirmarTransferenciaBtn');
          if (btnTransfer) {
            btnTransfer.onclick = async function() {
              // Obtener carrito
              let cart = JSON.parse(localStorage.getItem("cart")) || [];
              if (cart.length === 0) {
                paymentResult.innerHTML = `<div class="alert alert-danger">El carrito está vacío.</div>`;
                return;
              }
              try {
                const usuario = JSON.parse(localStorage.getItem("Usuario"));
                if (usuario && usuario.uid) {
                  const userDocRef = doc(db, "usuarios", usuario.uid);
                  const total = cart.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
                  const compra = {
                    fecha: new Date().toISOString(),
                    total,
                    estado: "pendiente_transferencia",
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
                    }
                  };
                  await updateDoc(userDocRef, {
                    compras: arrayUnion(compra)
                  });
                  await addDoc(collection(db, "compras"), compra);
                }
                // Vaciar carrito
                localStorage.setItem("cart", JSON.stringify([]));
                paymentForm.style.display = "none";
                paymentResult.style.display = "none";
                document.getElementById('successMessage').style.display = "flex";
                setTimeout(() => {
                  window.location.href = "/Paginas/Inicio/index.html";
                }, 3000);
              } catch (err) {
                paymentResult.innerHTML = `<div class="alert alert-danger">Error al registrar la compra. Intenta nuevamente.</div>`;
              }
            };
          }
        }, 100);
      }
    }
  });
});
