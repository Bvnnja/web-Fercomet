import { db } from "../../Servicios/firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function fetchData() {
  const comprasSnapshot = await getDocs(collection(db, "compras"));
  const comprasData = [];
  comprasSnapshot.forEach(doc => comprasData.push(doc.data()));
  return comprasData;
}

function processChartData(data) {
  const ventasPorDia = {};
  const productos = {};
  const productosPorDia = {};

  data.forEach(compra => {
    const dia = new Date(compra.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
    ventasPorDia[dia] = (ventasPorDia[dia] || 0) + compra.total;

    compra.productos.forEach(producto => {
      productos[producto.nombre] = (productos[producto.nombre] || 0) + producto.cantidad;
      productosPorDia[dia] = (productosPorDia[dia] || 0) + producto.cantidad;
    });
  });

  return { ventasPorDia, productos, productosPorDia };
}

function renderPaginatedList(items, containerId, itemsPerPage = 10) {
  const container = document.getElementById(containerId);
  const paginationContainer = document.createElement("div");
  paginationContainer.className = "pagination-container mt-3";
  container.innerHTML = "";

  let currentPage = 1;
  const totalPages = Math.ceil(items.length / itemsPerPage);

  function renderPage(page) {
    container.innerHTML = `
      <ul class="list-group">
        ${items
          .slice((page - 1) * itemsPerPage, page * itemsPerPage)
          .map(([nombre, cantidad]) => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              ${nombre}
              <span class="badge bg-primary rounded-pill">${cantidad}</span>
            </li>
          `).join("")}
      </ul>
    `;

    paginationContainer.innerHTML = `
      <nav>
        <ul class="pagination justify-content-center">
          ${Array.from({ length: totalPages }, (_, i) => `
            <li class="page-item ${i + 1 === page ? "active" : ""}">
              <button class="page-link" data-page="${i + 1}">${i + 1}</button>
            </li>
          `).join("")}
        </ul>
      </nav>
    `;

    paginationContainer.querySelectorAll(".page-link").forEach(button => {
      button.addEventListener("click", () => {
        currentPage = parseInt(button.dataset.page, 10);
        renderPage(currentPage);
      });
    });
  }

  renderPage(currentPage);
  container.appendChild(paginationContainer);
}

function renderCharts(chartData) {
  const ventasTotalesContainer = document.getElementById("ventasTotalesChart");
  const categoriasChartContainer = document.getElementById("categoriasChart");

  // Calcular la suma total de las ventas
  const totalVentas = Object.values(chartData.ventasPorDia).reduce((acc, val) => acc + val, 0);

  // Ordenar fechas de ventasPorDia de forma ascendente (formato: "12 abr 2024")
  const meses = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
  };
  const fechasOrdenadas = Object.keys(chartData.ventasPorDia)
    .map(fechaStr => {
      // Soporta tanto "12 abr 2024" como "12-abr-2024"
      let partes = fechaStr.includes("-") ? fechaStr.split("-") : fechaStr.split(" ");
      let [dia, mesStr, anio] = partes;
      dia = Number(dia);
      mesStr = mesStr.toLowerCase();
      anio = Number(anio);
      return {
        original: fechaStr,
        date: new Date(anio, meses[mesStr], dia)
      };
    })
    .sort((a, b) => a.date - b.date)
    .map(obj => obj.original);

  // Top 5 productos más vendidos
  const productosTop5 = Object.entries(chartData.productos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  ventasTotalesContainer.innerHTML = `
    <div class="text-center">
      <h2 class="display-4 text-success">Total Ventas</h2>
      <p class="display-1 fw-bold text-primary">$${totalVentas.toLocaleString("es-CL")}</p>
      <canvas id="topProductosChart" style="margin-top: 30px; min-height: 260px;"></canvas>
    </div>
  `;

  // Gráfico horizontal Top 5 productos más vendidos
  const topProductosCtx = document.getElementById("topProductosChart").getContext("2d");
  new Chart(topProductosCtx, {
    type: "bar",
    data: {
      labels: productosTop5.map(([nombre]) => nombre),
      datasets: [{
        label: "Cantidad vendida",
        data: productosTop5.map(([, cantidad]) => cantidad),
        backgroundColor: "#32735B"
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'right',
          color: '#32735B',
          font: { weight: 'bold', size: 14 },
          formatter: value => value
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Cantidad vendida" },
          beginAtZero: true
        },
        y: { title: { display: false } }
      }
    },
    plugins: [ChartDataLabels]
  });

  // Mostrar productos más vendidos con paginación (sin título aquí)
  categoriasChartContainer.innerHTML = `
    <div id="productosMasVendidosLista"></div>
  `;
  renderPaginatedList(
    Object.entries(chartData.productos).sort((a, b) => b[1] - a[1]),
    "productosMasVendidosLista"
  );

  // Renderizar gráfico de rendimiento diario (ordenado)
  const rendimientoDiarioContainer = document.getElementById("rendimientoChart");
  const rendimientoDiarioCtx = rendimientoDiarioContainer.getContext("2d");
  new Chart(rendimientoDiarioCtx, {
    type: "line",
    data: {
      labels: fechasOrdenadas,
      datasets: [
        {
          label: "Ventas Totales ($)",
          data: fechasOrdenadas.map(f => chartData.ventasPorDia[f]),
          borderColor: "#32735B",
          backgroundColor: "rgba(50, 115, 91, 0.2)",
          fill: true,
          tension: 0.4, // Suavizar las líneas
          pointRadius: 4,
          pointBackgroundColor: "#32735B"
        },

      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Día"
          }
        },
        y: {
          title: {
            display: true,
            text: "Valores"
          },
          beginAtZero: true
        }
      }
    }
  });
}

async function fetchVentasRealizadas() {
  const comprasSnapshot = await getDocs(collection(db, "compras"));
  const ventas = [];
  comprasSnapshot.forEach(doc => {
    const data = doc.data();
    // Asegura que el nombre completo siempre esté presente
    const nombreCompleto = `${data.usuario?.nombre || ""} ${data.usuario?.apellido || ""}`.trim() || "N/A";
    // Asegura que el total sea un número
    let total = data.total;
    if (typeof total === "string") {
      total = Number(total.replace(/[^\d]/g, "")) || 0;
    }
    ventas.push({
      id: doc.id,
      cliente: nombreCompleto,
      fecha: data.fecha ? new Date(data.fecha).toLocaleString("es-CL") : "Sin fecha",
      total: total,
      estado: data.estado || "Pendiente"
    });
  });
  return ventas;
}

function renderPaginatedTable(data, tableBodyId, paginationContainerId, rowsPerPage = 10) {
  const tableBody = document.getElementById(tableBodyId);
  const paginationContainer = document.getElementById(paginationContainerId);

  let currentPage = 1;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  function renderPage(page) {
    const start = (page - 1) * rowsPerPage;
    const end = page * rowsPerPage;
    const rows = data.slice(start, end);

    tableBody.innerHTML = rows.map((venta, index) => `
      <tr>
        <td>${start + index + 1}</td>
        <td>${venta.cliente}</td>
        <td>${venta.fecha}</td>
        <td>$${venta.total.toLocaleString("es-CL")}</td>
        <td>${venta.estado}</td>
      </tr>
    `).join("");

    paginationContainer.innerHTML = `
      <nav>
        <ul class="pagination justify-content-center">
          ${Array.from({ length: totalPages }, (_, i) => `
            <li class="page-item ${i + 1 === page ? "active" : ""}">
              <button class="page-link" data-page="${i + 1}">${i + 1}</button>
            </li>
          `).join("")}
        </ul>
      </nav>
    `;

    paginationContainer.querySelectorAll(".page-link").forEach(button => {
      button.addEventListener("click", () => {
        currentPage = parseInt(button.dataset.page, 10);
        renderPage(currentPage);
      });
    });
  }

  renderPage(currentPage);
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchData();
  const chartData = processChartData(data);
  renderCharts(chartData);

  const ventas = await fetchVentasRealizadas();
  renderPaginatedTable(ventas, "ventasTableBody", "ventasPagination");
});
