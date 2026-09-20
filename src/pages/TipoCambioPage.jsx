import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import Topbar from '../components/layout/Topbar';
import { fetchTipoCambioActual, fetchHistorialTipoCambio } from '../services/tipoCambioService';
import '../styles/tipo-cambio.css';

// Registrar componentes de Chart.js
ChartJS.register(...registerables);

// Formateador de moneda costarricense (CRC)
function formatearCRC(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '₡0.00';
  return `₡${Number(valor).toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function TipoCambioPage() {
  // Estados de datos
  const [actualData, setActualData] = useState(null);
  const [historialData, setHistorialData] = useState([]);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [tieneSuficientesDatos, setTieneSuficientesDatos] = useState(false);
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [estadisticas, setEstadisticas] = useState({
    actual: 0,
    min: 0,
    max: 0,
    promedio: 0,
    variacion: 0,
  });

  // Estados de interfaz y control
  const [rangoSeleccionado, setRangoSeleccionado] = useState('1M');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [ultimoRefresco, setUltimoRefresco] = useState(null);

  // Estados del Convertidor de Moneda
  const [modoTasa, setModoTasa] = useState('venta'); // 'venta' | 'compra'
  const [montoUSD, setMontoUSD] = useState('100');
  const [montoCRC, setMontoCRC] = useState('');
  const [direccionSwap, setDireccionSwap] = useState('USD_A_CRC'); // 'USD_A_CRC' | 'CRC_A_USD'

  // Estado para la serie de las Tarjetas de Resumen (KPIs): 'venta' | 'compra'
  const [modoKpi, setModoKpi] = useState('venta');

  // Referencias para el gráfico
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const lastFetchTimeRef = useRef(0);

  // Tasa de cambio activa para el convertidor
  const tasaActiva = useMemo(() => {
    if (!actualData) return 0;
    return modoTasa === 'venta' ? actualData.venta : actualData.compra;
  }, [actualData, modoTasa]);

  // Datos para las tarjetas de resumen según la serie seleccionada (compra o venta)
  const kpiData = useMemo(() => {
    if (estadisticas && estadisticas[modoKpi]) {
      return estadisticas[modoKpi];
    }
    return estadisticas || {};
  }, [estadisticas, modoKpi]);

  const handleModoTasaChange = (nuevoModo) => {
    setModoTasa(nuevoModo);
    const nuevaTasa = nuevoModo === 'venta' ? actualData?.venta : actualData?.compra;
    if (!nuevaTasa || nuevaTasa <= 0) return;
    if (direccionSwap === 'USD_A_CRC') {
      const numUSD = parseFloat(montoUSD);
      if (!isNaN(numUSD)) setMontoCRC((numUSD * nuevaTasa).toFixed(2));
    } else {
      const numCRC = parseFloat(montoCRC);
      if (!isNaN(numCRC)) setMontoUSD((numCRC / nuevaTasa).toFixed(2));
    }
  };

  const handleUSDChange = (val) => {
    setMontoUSD(val);
    const num = parseFloat(val);
    if (!isNaN(num) && tasaActiva > 0) {
      setMontoCRC((num * tasaActiva).toFixed(2));
    } else {
      setMontoCRC('');
    }
  };

  const handleCRCChange = (val) => {
    setMontoCRC(val);
    const num = parseFloat(val);
    if (!isNaN(num) && tasaActiva > 0) {
      setMontoUSD((num / tasaActiva).toFixed(2));
    } else {
      setMontoUSD('');
    }
  };

  const handleSwapDirection = () => {
    setDireccionSwap((prev) => (prev === 'USD_A_CRC' ? 'CRC_A_USD' : 'USD_A_CRC'));
  };

  const handlePresetUSD = (cantidad) => {
    setDireccionSwap('USD_A_CRC');
    setMontoUSD(String(cantidad));
    if (tasaActiva > 0) {
      setMontoCRC((cantidad * tasaActiva).toFixed(2));
    }
  };

  // Carga de datos al montar y al cambiar de rango temporal
  useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const actual = await fetchTipoCambioActual();
        if (!activo) return;
        setActualData(actual);
        setErrorMsg(null);

        if (actual?.venta) {
          setMontoCRC((100 * actual.venta).toFixed(2));
        }

        const historial = await fetchHistorialTipoCambio(rangoSeleccionado);
        if (!activo) return;
        setHistorialData(historial.datos);
        setDatosGrafico(historial.datosGrafico || historial.datos);
        setTieneSuficientesDatos(historial.tieneSuficientesDatos);
        setTotalPuntos(historial.totalPuntos);
        setEstadisticas(historial.estadisticas);

        setUltimoRefresco(new Date());
        lastFetchTimeRef.current = Date.now();
      } catch (err) {
        if (!activo) return;
        console.error('[TipoCambioPage] Error cargando tipo de cambio:', err);
        setErrorMsg(err.message || 'Error de conexión al consultar el tipo de cambio.');
      } finally {
        if (activo) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    cargarInicial();

    return () => {
      activo = false;
    };
  }, [rangoSeleccionado]);

  // Actualización manual o periódica (botón "Actualizar" o intervalo)
  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const actual = await fetchTipoCambioActual();
      setActualData(actual);
      setErrorMsg(null);

      const historial = await fetchHistorialTipoCambio(rangoSeleccionado);
      setHistorialData(historial.datos);
      setDatosGrafico(historial.datosGrafico || historial.datos);
      setTieneSuficientesDatos(historial.tieneSuficientesDatos);
      setTotalPuntos(historial.totalPuntos);
      setEstadisticas(historial.estadisticas);

      setUltimoRefresco(new Date());
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      console.error('[TipoCambioPage] Error refrescando tipo de cambio:', err);
      setErrorMsg(err.message || 'Error de conexión al consultar el tipo de cambio.');
    } finally {
      setRefreshing(false);
    }
  }, [rangoSeleccionado]);

  // Auto-refresco inteligente cada 5 minutos (solo con pestaña visible)
  useEffect(() => {
    const CINCO_MINUTOS_MS = 5 * 60 * 1000;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleManualRefresh();
      }
    }, CINCO_MINUTOS_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const tiempoTranscurrido = Date.now() - lastFetchTimeRef.current;
        if (tiempoTranscurrido >= CINCO_MINUTOS_MS) {
          handleManualRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleManualRefresh]);

  // Renderizado del Gráfico interactivo con Chart.js
  useEffect(() => {
    if (!canvasRef.current) return;

    // Destruir instancia previa para evitar fugas de memoria y glitches de canvas
    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) existingChart.destroy();
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    // Si no hay datos, no creamos el chart
    if (!datosGrafico || datosGrafico.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');

    // Gradiente de área suave para Venta
    const gradienteVenta = ctx.createLinearGradient(0, 0, 0, 300);
    gradienteVenta.addColorStop(0, 'rgba(224, 166, 181, 0.32)');
    gradienteVenta.addColorStop(1, 'rgba(224, 166, 181, 0.0)');

    // Gradiente de área suave para Compra
    const gradienteCompra = ctx.createLinearGradient(0, 0, 0, 300);
    gradienteCompra.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
    gradienteCompra.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    const labels = datosGrafico.map((d) => d.fecha);
    const ventas = datosGrafico.map((d) => d.venta);
    const compras = datosGrafico.map((d) => d.compra);

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Tipo de Cambio Venta (₡)',
            data: ventas,
            borderColor: '#e0a6b5',
            backgroundColor: gradienteVenta,
            fill: true,
            tension: 0.35,
            borderWidth: 2.5,
            pointRadius: datosGrafico.length === 1 ? 6 : datosGrafico.length > 80 ? 0 : 3,
            pointHoverRadius: 7,
            pointBackgroundColor: '#e0a6b5',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
          },
          {
            label: 'Tipo de Cambio Compra (₡)',
            data: compras,
            borderColor: '#8b5cf6',
            backgroundColor: gradienteCompra,
            fill: true,
            tension: 0.35,
            borderWidth: 1.8,
            borderDash: [4, 4],
            pointRadius: datosGrafico.length === 1 ? 5 : datosGrafico.length > 80 ? 0 : 2.5,
            pointHoverRadius: 6,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#d4c4c8',
              font: {
                family: "'Montserrat', sans-serif",
                size: 11,
                weight: 600,
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(18, 15, 24, 0.94)',
            titleColor: '#ffffff',
            bodyColor: '#d4c4c8',
            borderColor: 'rgba(244, 180, 200, 0.3)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleFont: {
              family: "'Montserrat', sans-serif",
              size: 13,
              weight: 'bold',
            },
            bodyFont: {
              family: "'Montserrat', sans-serif",
              size: 12,
            },
            callbacks: {
              title: (items) => {
                if (!items || items.length === 0) return '';
                const baseDate = items[0].label;
                if (rangoSeleccionado === '1A') {
                  return `${baseDate} • Promedio semanal`;
                }
                if (rangoSeleccionado === '5A' || rangoSeleccionado === 'MAX') {
                  return `${baseDate} • Promedio mensual`;
                }
                return baseDate;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const val = context.parsed.y;
                const tipoPromedio = rangoSeleccionado === '1A'
                  ? ' [Promedio semanal]'
                  : (rangoSeleccionado === '5A' || rangoSeleccionado === 'MAX')
                    ? ' [Promedio mensual]'
                    : '';
                return ` ${label}${tipoPromedio}: ${formatearCRC(val)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#8e7e83',
              font: {
                family: "'Montserrat', sans-serif",
                size: 11,
              },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false,
            },
            ticks: {
              color: '#8e7e83',
              font: {
                family: "'Montserrat', sans-serif",
                size: 11,
              },
              callback: (val) => `₡${val}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [datosGrafico, rangoSeleccionado]);

  // Cálculo de variación en tarjeta de Compra y Venta frente al día anterior
  const variacionCompra = useMemo(() => {
    if (!historialData || historialData.length < 2) {
      return { direccion: 'neutro', texto: 'Sin variación' };
    }
    const penultimo = historialData[historialData.length - 2]?.compra;
    const ultimo = historialData[historialData.length - 1]?.compra;
    if (!penultimo || !ultimo) return { direccion: 'neutro', texto: 'Sin variación' };

    const diff = ultimo - penultimo;
    const pct = ((diff / penultimo) * 100).toFixed(2);
    if (diff > 0) return { direccion: 'sube', texto: `▲ +₡${diff.toFixed(2)} (+${pct}%)` };
    if (diff < 0) return { direccion: 'baja', texto: `▼ -₡${Math.abs(diff).toFixed(2)} (${pct}%)` };
    return { direccion: 'neutro', texto: '= Sin variación' };
  }, [historialData]);

  const variacionVenta = useMemo(() => {
    if (!historialData || historialData.length < 2) {
      return { direccion: 'neutro', texto: 'Sin variación' };
    }
    const penultimo = historialData[historialData.length - 2]?.venta;
    const ultimo = historialData[historialData.length - 1]?.venta;
    if (!penultimo || !ultimo) return { direccion: 'neutro', texto: 'Sin variación' };

    const diff = ultimo - penultimo;
    const pct = ((diff / penultimo) * 100).toFixed(2);
    if (diff > 0) return { direccion: 'sube', texto: `▲ +₡${diff.toFixed(2)} (+${pct}%)` };
    if (diff < 0) return { direccion: 'baja', texto: `▼ -₡${Math.abs(diff).toFixed(2)} (${pct}%)` };
    return { direccion: 'neutro', texto: '= Sin variación' };
  }, [historialData]);

  return (
    <>
      <Topbar breadcrumb="Tipo de Cambio" />

      <main className="tipo-cambio-container">
        {/* ========================================================
           1. ENCABEZADO DE PÁGINA Y ACCIONES
           ======================================================== */}
        <section className="tc-page-header">
          <div className="tc-header-title-group">
            <h1>Tipo de Cambio BCCR</h1>
            <p className="tc-header-subtitle">
              Cotización oficial del Banco Central de Costa Rica en tiempo real, registro histórico auditado y convertidor multidivisa.
            </p>
          </div>

          <div className="tc-header-actions">
            {actualData && (
              <div className="tc-sync-badge" title={actualData.cached ? 'Dato servido desde la última copia de seguridad local' : 'Conectado a la API oficial de Gometa (BCCR)'}>
                <span className={`tc-sync-dot ${actualData.cached ? 'is-cached' : ''}`} />
                <span>
                  {actualData.cached ? 'Modo Contingencia' : 'Sincronizado BCCR'}
                </span>
                {ultimoRefresco && (
                  <span style={{ marginLeft: '0.35rem', opacity: 0.8, fontSize: '0.74rem' }}>
                    ({ultimoRefresco.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              id="btn-actualizar-tipo-cambio"
              className="tc-btn-refresh"
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              title="Consultar cotización actualizada"
            >
              <svg
                className={refreshing ? 'spinning' : ''}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </section>

        {/* Banner de Contingencia (si la API externa falló y estamos en caché) */}
        {actualData?.cached && (
          <section className="tc-contingency-banner" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Aviso de contingencia:</strong> El proveedor externo del BCCR presentó intermitencia temporal. El sistema está operando con la última cotización verificada guardada en la base de datos (fecha: <strong>{actualData.fecha}</strong>).
            </div>
          </section>
        )}

        {/* Error en pantalla si ocurrió un fallo total */}
        {errorMsg && (
          <section className="tc-contingency-banner" style={{ background: 'rgba(244, 63, 94, 0.14)', borderColor: 'rgba(244, 63, 94, 0.35)', color: '#fb7185' }} role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Error al obtener cotización:</strong> {errorMsg}
            </div>
          </section>
        )}

        {/* ========================================================
           2. TARJETAS PRINCIPALES: COMPRA Y VENTA
           ======================================================== */}
        <section className="tc-rates-grid">
          {/* Tarjeta de Compra */}
          <article className="tc-rate-card compra-card" aria-label="Tipo de Cambio Compra">
            <div className="tc-rate-card-top">
              <div>
                <span className="tc-rate-type-tag">Tipo de Cambio Compra</span>
                <p className="tc-rate-desc">Precio al que se compran dólares</p>
              </div>
              <span className="tc-rate-badge-bccr">Referencia BCCR</span>
            </div>

            <div className="tc-rate-price-row">
              <span className="tc-rate-currency-sym">₡</span>
              <span className="tc-rate-price-val">
                {actualData ? Number(actualData.compra).toFixed(2) : '---.--'}
              </span>
            </div>

            <div className="tc-rate-indicator-row">
              <span className={`tc-variation-pill ${variacionCompra.direccion}`}>
                {variacionCompra.texto}
              </span>
              <span className="tc-rate-timestamp">
                {actualData ? `Fecha: ${actualData.compraDate}` : 'Cargando...'}
              </span>
            </div>
          </article>

          {/* Tarjeta de Venta */}
          <article className="tc-rate-card venta-card" aria-label="Tipo de Cambio Venta">
            <div className="tc-rate-card-top">
              <div>
                <span className="tc-rate-type-tag">Tipo de Cambio Venta</span>
                <p className="tc-rate-desc">Precio al que se venden dólares</p>
              </div>
              <span className="tc-rate-badge-bccr">Referencia BCCR</span>
            </div>

            <div className="tc-rate-price-row">
              <span className="tc-rate-currency-sym">₡</span>
              <span className="tc-rate-price-val">
                {actualData ? Number(actualData.venta).toFixed(2) : '---.--'}
              </span>
            </div>

            <div className="tc-rate-indicator-row">
              <span className={`tc-variation-pill ${variacionVenta.direccion}`}>
                {variacionVenta.texto}
              </span>
              <span className="tc-rate-timestamp">
                {actualData ? `Fecha: ${actualData.ventaDate}` : 'Cargando...'}
              </span>
            </div>
          </article>
        </section>

        {/* ========================================================
           3. SECCIÓN DEL GRÁFICO CON CHART.JS Y SELECTOR DE RANGOS
           ======================================================== */}
        <section className="tc-chart-card">
          <div className="tc-chart-header">
            <div className="tc-chart-title-group">
              <h2>Tendencia Histórica de Cotizaciones</h2>
              <p>Evolución de las tasas de compra y venta según el registro diario persistido en Supabase.</p>
            </div>

            {/* Selector de Rangos: 1D, 5D, 1M, 1A, 5A, Máx */}
            <div className="tc-range-selector" role="group" aria-label="Selector de rango temporal">
              {['1D', '5D', '1M', '1A', '5A', 'MAX'].map((rango) => (
                <button
                  key={rango}
                  type="button"
                  className={`tc-range-btn ${rangoSeleccionado === rango ? 'active' : ''}`}
                  onClick={() => setRangoSeleccionado(rango)}
                >
                  {rango === 'MAX' ? 'Máx' : rango}
                </button>
              ))}
            </div>
          </div>

          <div className="tc-chart-canvas-wrapper">
            <canvas ref={canvasRef} />

            {/* Overlay informativo cuando NO hay suficientes datos para el rango (SIN datos inventados) */}
            {!tieneSuficientesDatos && (
              <div className="tc-chart-insufficient-overlay">
                <div className="tc-chart-insufficient-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <div className="tc-chart-insufficient-title">
                  Datos históricos en recopilación
                </div>
                <div className="tc-chart-insufficient-desc">
                  Se requieren al menos 2 registros diarios para trazar una línea de tendencia real para el rango {rangoSeleccionado === 'MAX' ? 'Máx' : rangoSeleccionado}. El cron diario de Vercel está recopilando las cotizaciones oficiales del BCCR cada mediodía.
                </div>
                <span className="tc-chart-insufficient-count">
                  {totalPuntos} registro{totalPuntos === 1 ? '' : 's'} verificado{totalPuntos === 1 ? '' : 's'} en base de datos
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
           4. TARJETAS DE RESUMEN FINANCIERO (KPIs)
           ======================================================== */}
        <section className="tc-summary-section">
          <div className="tc-summary-header">
            <div>
              <h2 className="tc-section-title">Resumen del Período ({rangoSeleccionado === 'MAX' ? 'Máx' : rangoSeleccionado})</h2>
              <p className="tc-section-subtitle">
                Métricas calculadas sobre la {modoKpi === 'venta' ? 'tasa de venta' : 'tasa de compra'} de las cotizaciones verificadas.
              </p>
            </div>

            {/* Selector Modo KPI: Venta vs Compra */}
            <div className="tc-toggle-mode-group" role="group" aria-label="Seleccionar serie para resumen">
              <button
                type="button"
                className={`tc-toggle-mode-btn ${modoKpi === 'venta' ? 'active' : ''}`}
                onClick={() => setModoKpi('venta')}
              >
                Sobre Tasa de Venta
              </button>
              <button
                type="button"
                className={`tc-toggle-mode-btn ${modoKpi === 'compra' ? 'active' : ''}`}
                onClick={() => setModoKpi('compra')}
              >
                Sobre Tasa de Compra
              </button>
            </div>
          </div>

          <div className="tc-summary-grid">
            <div className="tc-summary-card">
              <span className="tc-summary-label">Cotización Actual</span>
              <span className="tc-summary-value">{formatearCRC(kpiData.actual || (modoKpi === 'venta' ? actualData?.venta : actualData?.compra))}</span>
              <span className="tc-summary-subtext">{modoKpi === 'venta' ? 'Tasa de venta vigente' : 'Tasa de compra vigente'}</span>
            </div>

            <div className="tc-summary-card">
              <span className="tc-summary-label">Mínimo (Período)</span>
              <span className="tc-summary-value">{formatearCRC(kpiData.min || (modoKpi === 'venta' ? actualData?.venta : actualData?.compra))}</span>
              <span className="tc-summary-subtext">Valor más bajo ({modoKpi})</span>
            </div>

            <div className="tc-summary-card">
              <span className="tc-summary-label">Máximo (Período)</span>
              <span className="tc-summary-value">{formatearCRC(kpiData.max || (modoKpi === 'venta' ? actualData?.venta : actualData?.compra))}</span>
              <span className="tc-summary-subtext">Valor más alto ({modoKpi})</span>
            </div>

            <div className="tc-summary-card">
              <span className="tc-summary-label">Promedio (Período)</span>
              <span className="tc-summary-value">{formatearCRC(kpiData.promedio || (modoKpi === 'venta' ? actualData?.venta : actualData?.compra))}</span>
              <span className="tc-summary-subtext">Media aritmética ({modoKpi})</span>
            </div>

            <div className="tc-summary-card">
              <span className="tc-summary-label">Variación (Período)</span>
              <span
                className="tc-summary-value"
                style={{
                  color: kpiData.variacion > 0 ? '#34d399' : kpiData.variacion < 0 ? '#fb7185' : 'inherit',
                }}
              >
                {kpiData.variacion > 0 ? `+${kpiData.variacion}%` : `${kpiData.variacion}%`}
              </span>
              <span className="tc-summary-subtext">Frente al primer registro</span>
            </div>
          </div>
        </section>

        {/* ========================================================
           5. CONVERTIDOR DE MONEDA EN TIEMPO REAL (USD ↔ CRC)
           ======================================================== */}
        <section className="tc-converter-card">
          <div className="tc-converter-header">
            <div className="tc-converter-title-group">
              <h2>Convertidor de Moneda USD ↔ CRC</h2>
              <p>Conversión instantánea y bidireccional aplicando la tasa oficial de ME Variedades.</p>
            </div>

            {/* Selector Modo de Tasa: Venta vs Compra */}
            <div className="tc-toggle-mode-group" role="group" aria-label="Seleccionar modo de tasa">
              <button
                type="button"
                className={`tc-toggle-mode-btn ${modoTasa === 'venta' ? 'active' : ''}`}
                onClick={() => handleModoTasaChange('venta')}
              >
                Tasa Venta ({actualData ? Number(actualData.venta).toFixed(2) : '---'})
              </button>
              <button
                type="button"
                className={`tc-toggle-mode-btn ${modoTasa === 'compra' ? 'active' : ''}`}
                onClick={() => handleModoTasaChange('compra')}
              >
                Tasa Compra ({actualData ? Number(actualData.compra).toFixed(2) : '---'})
              </button>
            </div>
          </div>

          {/* Grid de Inputs con Botón Swap Central */}
          <div className="tc-converter-inputs-grid">
            {direccionSwap === 'USD_A_CRC' ? (
              <>
                {/* Caja USD */}
                <div className="tc-converter-box">
                  <div className="tc-converter-box-header">
                    <span className="tc-currency-label">Monto en Dólares</span>
                    <span className="tc-currency-tag">USD ($)</span>
                  </div>
                  <div className="tc-converter-input-row">
                    <span className="tc-converter-sym">$</span>
                    <input
                      type="number"
                      className="tc-converter-input"
                      placeholder="0.00"
                      value={montoUSD}
                      onChange={(e) => handleUSDChange(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>

                {/* Botón Swap */}
                <div className="tc-swap-btn-container">
                  <button
                    type="button"
                    className="tc-swap-btn"
                    onClick={handleSwapDirection}
                    title="Intercambiar dirección de conversión"
                    aria-label="Intercambiar dirección de conversión"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                    </svg>
                  </button>
                </div>

                {/* Caja CRC */}
                <div className="tc-converter-box">
                  <div className="tc-converter-box-header">
                    <span className="tc-currency-label">Monto en Colones</span>
                    <span className="tc-currency-tag">CRC (₡)</span>
                  </div>
                  <div className="tc-converter-input-row">
                    <span className="tc-converter-sym">₡</span>
                    <input
                      type="number"
                      className="tc-converter-input"
                      placeholder="0.00"
                      value={montoCRC}
                      onChange={(e) => handleCRCChange(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Caja CRC */}
                <div className="tc-converter-box">
                  <div className="tc-converter-box-header">
                    <span className="tc-currency-label">Monto en Colones</span>
                    <span className="tc-currency-tag">CRC (₡)</span>
                  </div>
                  <div className="tc-converter-input-row">
                    <span className="tc-converter-sym">₡</span>
                    <input
                      type="number"
                      className="tc-converter-input"
                      placeholder="0.00"
                      value={montoCRC}
                      onChange={(e) => handleCRCChange(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>

                {/* Botón Swap */}
                <div className="tc-swap-btn-container">
                  <button
                    type="button"
                    className="tc-swap-btn"
                    onClick={handleSwapDirection}
                    title="Intercambiar dirección de conversión"
                    aria-label="Intercambiar dirección de conversión"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                    </svg>
                  </button>
                </div>

                {/* Caja USD */}
                <div className="tc-converter-box">
                  <div className="tc-converter-box-header">
                    <span className="tc-currency-label">Monto en Dólares</span>
                    <span className="tc-currency-tag">USD ($)</span>
                  </div>
                  <div className="tc-converter-input-row">
                    <span className="tc-converter-sym">$</span>
                    <input
                      type="number"
                      className="tc-converter-input"
                      placeholder="0.00"
                      value={montoUSD}
                      onChange={(e) => handleUSDChange(e.target.value)}
                      min="0"
                      step="any"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Chips Rápidos de Conversión y Nota de Referencia */}
          <div className="tc-quick-chips-row">
            <span className="tc-quick-chips-label">Atajos rápidos:</span>
            {[10, 50, 100, 500, 1000].map((cant) => (
              <button
                key={cant}
                type="button"
                className="tc-chip-btn"
                onClick={() => handlePresetUSD(cant)}
              >
                ${cant.toLocaleString()}
              </button>
            ))}

            <div className="tc-rate-ref-note">
              1 USD = {formatearCRC(tasaActiva)} ({modoTasa === 'venta' ? 'Venta' : 'Compra'})
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
