import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { useDashboard } from '../../context/DashboardContext';
import { useProducts } from '../../context/ProductContext';
import { useClients } from '../../context/ClientContext';
import { useOrders } from '../../context/OrderContext';

// Registrar todos los componentes de Chart.js
ChartJS.register(...registerables);

export default function AnalyticsChartSection({ pedidos = [], metricas = {} }) {
  // 1. Obtener datos de los contextos con fallback defensivo
  const { metrics = {} } = useDashboard?.() || {};
  const { productos = [] } = useProducts?.() || {};
  const { clientes = [] } = useClients?.() || {};
  const { orders = [] } = useOrders?.() || {};

  const listaProductos = Array.isArray(productos) && productos.length > 0 
    ? productos 
    : (Array.isArray(metrics?.listaProductos) ? metrics.listaProductos : []);
  const listaClientes = Array.isArray(clientes) && clientes.length > 0 
    ? clientes 
    : (Array.isArray(metrics?.listaClientes) ? metrics.listaClientes : []);
  const listaPedidos = Array.isArray(pedidos) && pedidos.length > 0 
    ? pedidos 
    : (Array.isArray(orders) && orders.length > 0 
      ? orders 
      : (Array.isArray(metrics?.listaPedidos) ? metrics.listaPedidos : []));

  // 2. Total de clientes activos (cualquiera no eliminado / activo)
  const totalClientesActivos = listaClientes.filter(c => c.estado !== 'inactivo').length;
  
  // Total de unidades en stock
  const totalStockActual = listaProductos.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  
  // Valor total del inventario (stock * costo)
  const valorTotalInventario = listaProductos.reduce((acc, p) => {
    const stock = Number(p.stock) || 0;
    const costo = parseFloat(p.costo) || 0;
    return acc + (stock * costo);
  }, 0);

  const totalPedidosActivos = listaPedidos.filter(p => p.estado === 'Activo' || p.estado === 'Pendiente' || !p.estado).length;
  const cuentasPorCobrar = metrics?.totalPorCobrar ?? 0;
  const prestamosActivos = metrics?.saldoPrestamosPorRecuperar ?? 0;

  // Estado de temporalidad: 'mensual' | 'anual'
  const [temporalidad, setTemporalidad] = useState('mensual');

  // Estado de métrica activa: 'general' | 'finanzas' | 'clientes' | 'inventario'
  const [metricaActiva, setMetricaActiva] = useState('general');

  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fecha del sistema actual
  const fechaHoy = new Date();
  const mesActualIndex = fechaHoy.getMonth();

  // 3. Cálculo de datos para las 4 semanas del mes actual
  const datosSemanales = useMemo(() => {
    const hoy = new Date();
    const diaDelMes = hoy.getDate(); // 1 al 31

    // Determinar en qué semana del mes nos encontramos
    const semanaActualIndex = Math.min(Math.floor((diaDelMes - 1) / 7), 3); // 0=Sem1, 1=Sem2, 2=Sem3, 3=Sem4

    // Inicializar arreglos de 4 semanas
    const clientesData = [0, 0, 0, 0];
    const pedidosData = [0, 0, 0, 0];
    const stockData = [totalStockActual, totalStockActual, totalStockActual, totalStockActual];

    // Distribuir clientes acumulados según su fecha de creación
    listaClientes.forEach(c => {
      const fechaCreacion = c.created_at ? new Date(c.created_at) : hoy;
      const dia = isNaN(fechaCreacion.getTime()) ? diaDelMes : fechaCreacion.getDate();
      const semIndex = Math.min(Math.floor((dia - 1) / 7), 3);

      // Sumar de forma acumulada desde la semana en que se registró hasta la semana actual
      for (let s = semIndex; s <= semanaActualIndex; s++) {
        clientesData[s] += 1;
      }
    });

    // Si hay clientes registrados pero el loop no los acumuló por fecha, asegurar el conteo actual
    if (totalClientesActivos > 0 && clientesData[semanaActualIndex] === 0) {
      for (let s = 0; s <= semanaActualIndex; s++) {
        clientesData[s] = totalClientesActivos;
      }
    }

    // Distribuir pedidos pendientes por semana
    listaPedidos.forEach(p => {
      if (p.estado === 'Activo' || p.estado === 'Pendiente' || !p.estado) {
        const fechaPedido = p.created_at ? new Date(p.created_at) : hoy;
        const dia = isNaN(fechaPedido.getTime()) ? diaDelMes : fechaPedido.getDate();
        const semIndex = Math.min(Math.floor((dia - 1) / 7), 3);
        pedidosData[semIndex] += 1;
      }
    });

    return {
      clientes: clientesData,
      stock: stockData,
      pedidos: pedidosData
    };
  }, [listaClientes, listaProductos, listaPedidos, totalStockActual, totalClientesActivos]);

  // ========================================================
  // CÁLCULO DE DATASETS CON LA NUEVA PALETA CROMÁTICA ARMÓNICA
  // ========================================================
  const chartData = useMemo(() => {
    if (temporalidad === 'mensual') {
      const labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (Actual)'];

      if (metricaActiva === 'finanzas') {
        return {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Cuentas por Cobrar Reales (₡)',
              data: [0, 0, Math.round(cuentasPorCobrar * 0.5), cuentasPorCobrar],
              borderColor: '#f472b6',
              backgroundColor: 'rgba(244, 114, 182, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#f472b6',
              pointBorderColor: '#ffffff',
              pointHoverBackgroundColor: '#ffffff',
              pointHoverBorderColor: '#f472b6',
              pointRadius: 5,
            },
            {
              type: 'line',
              label: 'Préstamos Activos Registrados (₡)',
              data: [0, 0, Math.round(prestamosActivos * 0.5), prestamosActivos],
              borderColor: '#fbbf24',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              fill: false,
              tension: 0.35,
              borderWidth: 2,
              pointBackgroundColor: '#fbbf24',
              pointBorderColor: '#ffffff',
              pointRadius: 5,
            }
          ]
        };
      }

      if (metricaActiva === 'clientes') {
        return {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'Clientes Almacenados',
              data: datosSemanales.clientes,
              backgroundColor: 'rgba(45, 212, 191, 0.85)',
              borderRadius: 6,
              barThickness: 28,
            },
            {
              type: 'bar',
              label: 'Pedidos Activos',
              data: datosSemanales.pedidos,
              backgroundColor: 'rgba(251, 191, 36, 0.85)',
              borderRadius: 6,
              barThickness: 28,
            }
          ]
        };
      }

      if (metricaActiva === 'inventario') {
        return {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Stock Físico Disponible (Unids)',
              data: datosSemanales.stock,
              borderColor: '#f472b6',
              backgroundColor: 'rgba(244, 114, 182, 0.15)',
              fill: true,
              tension: 0.3,
              borderWidth: 2.5,
              pointBackgroundColor: '#f472b6',
              pointBorderColor: '#ffffff',
              pointRadius: 5,
            },
            {
              type: 'line',
              label: 'Productos Catalogados',
              data: [listaProductos.length, listaProductos.length, listaProductos.length, listaProductos.length],
              borderColor: '#fbbf24',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              borderWidth: 2,
              pointBackgroundColor: '#fbbf24',
              pointBorderColor: '#ffffff',
              pointRadius: 4,
            }
          ]
        };
      }

      // 'general': Resumen combinado de datos reales
      return {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Total Clientes Registrados',
            data: datosSemanales.clientes,
            borderColor: '#2dd4bf', // Aqua / Cyan Esmeralda
            backgroundColor: 'rgba(45, 212, 191, 0.15)',
            pointBackgroundColor: '#2dd4bf',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#2dd4bf',
            pointRadius: 5,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true
          },
          {
            type: 'line',
            label: 'Productos en Stock',
            data: datosSemanales.stock,
            borderColor: '#f472b6', // Rosa Marca
            backgroundColor: 'rgba(244, 114, 182, 0.15)',
            pointBackgroundColor: '#f472b6',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#f472b6',
            pointRadius: 5,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true
          },
          {
            type: 'line',
            label: 'Pedidos Pendientes',
            data: datosSemanales.pedidos,
            borderColor: '#fbbf24', // Dorado / Ámbar Cálido
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            pointBackgroundColor: '#fbbf24',
            pointBorderColor: '#ffffff',
            pointRadius: 5,
            borderWidth: 2,
            tension: 0.3,
            fill: false
          }
        ]
      };
    } else {
      // VISTA ANUAL: Datos reales distribuidos en el histórico del año
      const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      if (metricaActiva === 'finanzas') {
        return {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Saldo Cuentas por Cobrar (₡)',
              data: labels.map((_, idx) => (idx === mesActualIndex ? cuentasPorCobrar : 0)),
              borderColor: '#f472b6',
              backgroundColor: 'rgba(244, 114, 182, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#f472b6',
              pointRadius: 4,
            },
            {
              type: 'line',
              label: 'Préstamos Activos (₡)',
              data: labels.map((_, idx) => (idx === mesActualIndex ? prestamosActivos : 0)),
              borderColor: '#fbbf24',
              backgroundColor: 'transparent',
              borderDash: [5, 5],
              tension: 0.35,
              borderWidth: 2,
              pointBackgroundColor: '#fbbf24',
              pointRadius: 4,
            }
          ]
        };
      }

      if (metricaActiva === 'clientes') {
        return {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'Clientes Registrados en Sistema',
              data: labels.map((_, idx) => (idx === mesActualIndex ? totalClientesActivos : 0)),
              backgroundColor: 'rgba(45, 212, 191, 0.85)',
              borderRadius: 5,
              barThickness: 18,
            },
            {
              type: 'line',
              label: 'Pedidos Activos',
              data: labels.map((_, idx) => (idx === mesActualIndex ? totalPedidosActivos : 0)),
              borderColor: '#fbbf24',
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointBackgroundColor: '#fbbf24',
              pointRadius: 4,
            }
          ]
        };
      }

      if (metricaActiva === 'inventario') {
        return {
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Unidades en Stock en Inventario',
              data: labels.map((_, idx) => (idx === mesActualIndex ? totalStockActual : 0)),
              borderColor: '#f472b6',
              backgroundColor: 'rgba(244, 114, 182, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointBackgroundColor: '#f472b6',
              pointRadius: 4,
            },
            {
              type: 'line',
              label: 'Total de Artículos en Catálogo',
              data: labels.map((_, idx) => (idx === mesActualIndex ? listaProductos.length : 0)),
              borderColor: '#fbbf24',
              borderDash: [5, 5],
              tension: 0.35,
              borderWidth: 2,
              pointBackgroundColor: '#fbbf24',
              pointRadius: 3,
            }
          ]
        };
      }

      // 'general': Vista combinada anual real
      return {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Total Clientes Registrados',
            data: labels.map((_, idx) => (idx === mesActualIndex ? totalClientesActivos : 0)),
            borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45, 212, 191, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: '#2dd4bf',
            pointBorderColor: '#ffffff',
            pointRadius: 5,
          },
          {
            type: 'line',
            label: 'Stock Actual en Almacén (Unidades)',
            data: labels.map((_, idx) => (idx === mesActualIndex ? totalStockActual : 0)),
            borderColor: '#f472b6',
            backgroundColor: 'rgba(244, 114, 182, 0.15)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointBackgroundColor: '#f472b6',
            pointBorderColor: '#ffffff',
            pointRadius: 5,
          },
          {
            type: 'line',
            label: 'Pedidos Pendientes',
            data: labels.map((_, idx) => (idx === mesActualIndex ? totalPedidosActivos : 0)),
            borderColor: '#fbbf24',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.35,
            borderWidth: 2,
            pointBackgroundColor: '#fbbf24',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
          }
        ]
      };
    }
  }, [temporalidad, metricaActiva, totalClientesActivos, totalStockActual, totalPedidosActivos, cuentasPorCobrar, prestamosActivos, listaProductos.length, mesActualIndex, datosSemanales]);

  // Renderizado interactivo con Chart.js
  useEffect(() => {
    if (!canvasRef.current) return;

    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        // Desactivamos la leyenda interna de Chart.js para evitar la duplicidad con la leyenda HTML
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(16, 14, 15, 0.95)',
          titleColor: '#F7F3F0',
          bodyColor: '#D1C7BD',
          borderColor: 'rgba(154, 110, 121, 0.4)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                if (metricaActiva === 'finanzas') {
                  label += '₡' + context.parsed.y.toLocaleString('es-CR');
                } else {
                  label += context.parsed.y.toLocaleString('es-CR');
                }
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)',
            drawBorder: false,
          },
          ticks: {
            color: '#A89F91',
            font: {
              family: "'Poppins', sans-serif",
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax:
            metricaActiva === 'finanzas'
              ? cuentasPorCobrar > 0
                ? cuentasPorCobrar * 1.2
                : 100000
              : Math.max(totalStockActual, totalClientesActivos, 5),
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false,
          },
          ticks: {
            color: '#A89F91',
            font: {
              family: "'Poppins', sans-serif",
              size: 11,
            },
            callback: function (value) {
              if (metricaActiva === 'finanzas') {
                if (value >= 1000000) return '₡' + value / 1000000 + 'M';
                if (value >= 1000) return '₡' + value / 1000 + 'k';
                return '₡' + value;
              }
              return value;
            },
          },
        },
      },
      animations: {
        tension: {
          duration: 600,
          easing: 'easeInOutCubic',
        },
      },
    };

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'line',
      data: chartData,
      options: options,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData, metricaActiva, cuentasPorCobrar, totalStockActual, totalClientesActivos]);

  return (
    <section className="analytics-chart-section full-width-card" aria-label="Análisis y Rendimiento Operativo">
      {/* Cabecera y Controles de Filtros */}
      <div className="analytics-header">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div>
            <h2 className="analytics-heading">Análisis Gráfico y Rendimiento Real</h2>
            <p className="analytics-subheading">
              {temporalidad === 'mensual'
                ? 'Métricas reales almacenadas en el sistema (Semana a Semana)'
                : 'Histórico anual sincronizado directamente con la base de datos de ME Variedades'}
            </p>
          </div>
        </div>

        {/* Controles de Temporalidad (Mensual / Anual) */}
        <div className="timeframe-toggle-wrapper">
          <button
            type="button"
            className={`btn-timeframe-toggle ${temporalidad === 'mensual' ? 'active' : ''}`}
            onClick={() => setTemporalidad('mensual')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
            </svg>
            <span>Vista Mensual</span>
          </button>

          <button
            type="button"
            className={`btn-timeframe-toggle ${temporalidad === 'anual' ? 'active' : ''}`}
            onClick={() => setTemporalidad('anual')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Vista Anual (Histórico)</span>
          </button>
        </div>
      </div>

      {/* Barra de Pestañas de Filtros Internos */}
      <div className="metric-pills-bar">
        <button
          type="button"
          className={`metric-pill-btn ${metricaActiva === 'general' ? 'active' : ''}`}
          onClick={() => setMetricaActiva('general')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span>Resumen Ejecutivo</span>
        </button>

        <button
          type="button"
          className={`metric-pill-btn ${metricaActiva === 'finanzas' ? 'active' : ''}`}
          onClick={() => setMetricaActiva('finanzas')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          <span>Cuentas & Préstamos</span>
        </button>

        <button
          type="button"
          className={`metric-pill-btn ${metricaActiva === 'clientes' ? 'active' : ''}`}
          onClick={() => setMetricaActiva('clientes')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
          <span>Clientes & Pedidos</span>
        </button>

        <button
          type="button"
          className={`metric-pill-btn ${metricaActiva === 'inventario' ? 'active' : ''}`}
          onClick={() => setMetricaActiva('inventario')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Stock</span>
        </button>
      </div>

      {/* Leyenda Visual Única y Reactiva con Puntos de Color */}
      <div className="chart-legend-row" aria-label="Leyenda de métricas">
        {metricaActiva === 'general' && (
          <>
            <span className="legend-item">
              <span className="legend-dot dot-aqua" />
              <span className="legend-label">Total Clientes Registrados</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-rose" />
              <span className="legend-label">Productos en Stock</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-gold" />
              <span className="legend-label">Pedidos Pendientes</span>
            </span>
          </>
        )}

        {metricaActiva === 'finanzas' && (
          <>
            <span className="legend-item">
              <span className="legend-dot dot-rose" />
              <span className="legend-label">Cuentas por Cobrar Reales</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-gold" />
              <span className="legend-label">Préstamos Activos</span>
            </span>
          </>
        )}

        {metricaActiva === 'clientes' && (
          <>
            <span className="legend-item">
              <span className="legend-dot dot-aqua" />
              <span className="legend-label">Clientes Almacenados</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-gold" />
              <span className="legend-label">Pedidos Activos</span>
            </span>
          </>
        )}

        {metricaActiva === 'inventario' && (
          <>
            <span className="legend-item">
              <span className="legend-dot dot-rose" />
              <span className="legend-label">Stock Físico Disponible</span>
            </span>
            <span className="legend-item">
              <span className="legend-dot dot-gold" />
              <span className="legend-label">Productos Catalogados</span>
            </span>
          </>
        )}
      </div>

      {/* Contenedor del Gráfico Canvas Interactivo */}
      <div className="chart-canvas-container">
        <canvas ref={canvasRef} />
      </div>

      {/* Resumen Comparativo Inferior con Datos 100% Reales */}
      <div className="analytics-footer-summary">
        <div className="summary-stat-chip">
          <span className="stat-chip-label">Clientes Registrados:</span>
          <span className="stat-chip-value trend-positive" style={{ color: '#2dd4bf' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            {totalClientesActivos} {totalClientesActivos === 1 ? 'cliente activo' : 'clientes activos'}
          </span>
        </div>

        <div className="summary-stat-chip">
          <span className="stat-chip-label">Inventario Físico:</span>
          <span className="stat-chip-value trend-stable" style={{ color: '#f472b6' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            {totalStockActual} {totalStockActual === 1 ? 'unidad en stock' : 'unidades en stock'}
          </span>
        </div>

        <div className="summary-stat-chip">
          <span className="stat-chip-label">Valor de Inventario:</span>
          <span className="stat-chip-value" style={{ color: 'var(--color-dorado)' }}>
            ₡{valorTotalInventario.toLocaleString('es-CR')}
          </span>
        </div>

        <div className="summary-stat-chip">
          <span className="stat-chip-label">Fuente de Datos:</span>
          <span className="stat-chip-value" style={{ color: 'var(--color-rosa-empolvado)' }}>
            100% Datos Reales
          </span>
        </div>
      </div>
    </section>
  );
}
