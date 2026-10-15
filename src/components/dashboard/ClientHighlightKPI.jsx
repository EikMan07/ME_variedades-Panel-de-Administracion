import { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';

export default function ClientHighlightKPI() {
  const { metrics = {}, conexion = {}, recargarMetricas, isLoading } = useDashboard?.() || {};
  const totalClientes = metrics?.totalClientes ?? 0;
  const [reintentando, setReintentando] = useState(false);

  const { conectada, faltanVariables, error, verificando } = conexion;

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

  // Determinación reactiva del estado y diseño
  let statusClass = 'connected';
  let dotClass = 'connected';
  let statusText = 'Base de datos activa (Sincronizada)';
  let showErrorRetry = false;

  if (verificando || (isLoading && !conectada && !error && !faltanVariables)) {
    statusClass = 'checking';
    dotClass = 'checking';
    statusText = 'Verificando base de datos...';
  } else if (faltanVariables) {
    statusClass = 'warning';
    dotClass = 'warning';
    statusText = 'Faltan variables VITE_SUPABASE en Vercel';
    showErrorRetry = true;
  } else if (!conectada || error) {
    statusClass = 'error';
    dotClass = 'error';
    statusText = 'Error de conexión / Permisos RLS';
    showErrorRetry = true;
  }

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
          <h2 className="client-kpi-value">{totalClientes}</h2>
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
