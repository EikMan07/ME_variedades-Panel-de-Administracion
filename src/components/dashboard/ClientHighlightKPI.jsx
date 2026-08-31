import { useDashboard } from '../../context/DashboardContext';

export default function ClientHighlightKPI() {
  const { metrics = {} } = useDashboard?.() || {};
  const totalClientes = metrics?.totalClientes ?? 0;

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
          <span className="client-kpi-status">
            <span className="status-indicator-dot" />
            Base de datos activa
          </span>
        </div>
      </div>
    </article>
  );
}
