import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useClients } from '../../context/ClientContext';

export default function ClientHighlightKPI() {
  const { metrics = {}, conexion = {}, recargarMetricas, isLoading: isDashboardLoading } = useDashboard?.() || {};
  const { clientes = [], isLoading: isClientsLoading } = useClients?.() || {};

  const [reintentando, setReintentando] = useState(false);
  const { conectada, error, verificando } = conexion;

  // Estado de carga global de clientes y conexión
  const enCarga = verificando || isDashboardLoading || isClientsLoading || reintentando;

  // Resolución multicanal y reactiva del total de clientes registrados
  const totalClientes =
    (metrics?.totalClientes && metrics.totalClientes > 0)
      ? metrics.totalClientes
      : (clientes && clientes.length > 0)
        ? clientes.length
        : (metrics?.listaClientes && metrics.listaClientes.length > 0)
          ? metrics.listaClientes.length
          : (conexion?.totalClientes && conexion.totalClientes > 0)
            ? conexion.totalClientes
            : null;

  const handleRetry = async (e) => {
    e?.stopPropagation?.();
    setReintentando(true);
    try {
      if (typeof recargarMetricas === 'function') {
        await recargarMetricas();
      }
    } finally {
      setTimeout(() => setReintentando(false), 600);
    }
  };

  // Determinación reactiva estricta del estado y diseño
  let statusClass = 'checking';
  let dotClass = 'checking';
  let statusText = 'Sincronizando con Supabase...';
  let showErrorRetry = false;

  if (enCarga) {
    statusClass = 'checking';
    dotClass = 'checking';
    statusText = 'Sincronizando con Supabase...';
  } else if (!conectada || error) {
    statusClass = 'error';
    dotClass = 'error';
    statusText = error ? `Error: ${error}` : 'Error de conexión / Permisos RLS';
    showErrorRetry = true;
  } else if (conectada) {
    statusClass = 'connected';
    dotClass = 'connected';
    statusText = 'Base de datos activa (Sincronizada)';
  }

  // Valor a mostrar: nunca mostrar 0 engañoso si está cargando y no tenemos conteo firme
  const valorDisplay = enCarga
    ? (totalClientes !== null && totalClientes > 0 ? totalClientes : '...')
    : (totalClientes ?? 0);

  return (
    <article className="client-highlight-card" id="kpi-clientes-destacado" aria-label="Total de Clientes Registrados">
      <div className="client-kpi-inner">
        <div className="client-kpi-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div className="client-kpi-data">
          <span className="client-kpi-label">Total Clientes</span>
          <h2 className="client-kpi-value">{valorDisplay}</h2>
          <div className="client-kpi-status-container">
            <span className={`client-kpi-status ${statusClass}`} title={error || statusText}>
              <span className={`status-indicator-dot ${dotClass}`} />
              <span className="status-indicator-label">{statusText}</span>
            </span>
            {showErrorRetry && (
              <button
                type="button"
                className={`client-kpi-retry-btn ${reintentando ? 'spinning' : ''}`}
                onClick={handleRetry}
                disabled={reintentando}
                title="Reintentar sincronización con Supabase"
                aria-label="Reintentar sincronización"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span>Reintentar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
