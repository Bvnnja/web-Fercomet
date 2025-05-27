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

  // Calcular la suma total de las ventas
  const totalVentas = Object.values(chartData.ventasPorDia).reduce((acc, val) => acc + val, 0);

  // Mostrar el número grande en lugar del gráfico
  ventasTotalesContainer.parentElement.innerHTML = `
    <div class="text-center">
      <h2 class="display-4 text-success">Total Ventas</h2>
      <p class="display-1 fw-bold text-primary">$${totalVentas.toLocaleString("es-CL")}</p>
      <canvas id="ventasPorDiaChart" style="margin-top: 20px;"></canvas>
    </div>
  `;

  // Renderizar gráfico de ventas por día
  const ventasPorDiaCtx = document.getElementById("ventasPorDiaChart").getContext("2d");
  new Chart(ventasPorDiaCtx, {
    type: "bar",
    data: {
      labels: Object.keys(chartData.ventasPorDia),
      datasets: [{
        label: "Ventas por Día",
        data: Object.values(chartData.ventasPorDia),
        backgroundColor: "#43a047"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value, context) => {
            const dia = context.chart.data.labels[context.dataIndex];
            return `${chartData.productosPorDia[dia] || 0} productos`;
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Fecha"
          }
        },
        y: {
          ticks: {
            display: false // Ocultar los números en el eje Y
          },
          title: {
            display: true,
          },
          beginAtZero: true
        }
      }
    },
    plugins: [ChartDataLabels]
  });

  // Renderizar gráfico de rendimiento diario con áreas sombreadas
  const rendimientoDiarioContainer = document.getElementById("rendimientoChart");
  const rendimientoDiarioCtx = rendimientoDiarioContainer.getContext("2d");
  new Chart(rendimientoDiarioCtx, {
    type: "line",
    data: {
      labels: Object.keys(chartData.ventasPorDia),
      datasets: [
        {
          label: "Ventas Totales ($)",
          data: Object.values(chartData.ventasPorDia),
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

  // Mostrar productos más vendidos con paginación
  const productosOrdenados = Object.entries(chartData.productos)
    .sort((a, b) => b[1] - a[1]);

  renderPaginatedList(productosOrdenados, "categoriasChart");
}

async function fetchVentasRealizadas() {
  const comprasSnapshot = await getDocs(collection(db, "compras"));
  const ventas = [];
  comprasSnapshot.forEach(doc => {
    const data = doc.data();
    ventas.push({
      id: doc.id,
      cliente: `${data.usuario?.nombre || "N/A"} ${data.usuario?.apellido || ""}`,
      fecha: data.fecha ? new Date(data.fecha).toLocaleString("es-CL") : "Sin fecha",
      total: data.total || 0,
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
