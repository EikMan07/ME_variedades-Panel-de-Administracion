import { useDashboard } from '../../context/DashboardContext';

export default function KPICards() {
  const { metrics = {}, isLoading = false } = useDashboard?.() || {};

  const totalStock = metrics?.totalStockUnidades ?? 0;
  const totalPedidos = metrics?.pedidosActivos ?? 0;
  const cuentasPorCobrar = metrics?.cuentasPorCobrarCount ?? metrics?.cuentasPorCobrar ?? metrics?.totalPorCobrar ?? 0;
  const prestamosActivos = metrics?.prestamosActivosCount ?? metrics?.prestamosActivos ?? 0;

  return (
    <section className="kpi-grid-4" aria-label="Indicadores clave de operaciones">
      {/* KPI 1: Pedidos Activos */}
      <article className="kpi-command-card" id="kpi-pedidos">
        <div className="kpi-card-top">
          <div className="kpi-icon-box icon-purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <span className="kpi-badge-pill badge-green">Al día</span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-label-text">Pedidos Activos</span>
          <h3 className="kpi-number-value">{totalPedidos}</h3>
          <span className="kpi-status-subtext">
            {totalPedidos > 0 ? `${totalPedidos} en seguimiento` : 'Sin pedidos pendientes'}
          </span>
        </div>
      </article>

      {/* KPI 2: Cuentas por Cobrar (Conteo de Cuentas Pendientes) */}
      <article className="kpi-command-card" id="kpi-pagos">
        <div className="kpi-card-top">
          <div className="kpi-icon-box icon-emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <span className={`kpi-badge-pill ${cuentasPorCobrar > 0 ? 'badge-amber' : 'badge-green'}`}>
            {cuentasPorCobrar > 0 ? 'Por cobrar' : 'Al día'}
          </span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-label-text">Cuentas por Cobrar</span>
          <h3 className="kpi-number-value">{cuentasPorCobrar}</h3>
          <span className="kpi-status-subtext">
            {cuentasPorCobrar > 0 ? `${cuentasPorCobrar} cuentas pendientes` : 'Al día'}
          </span>
        </div>
      </article>

      {/* KPI 3: Préstamos Activos (Conteo de Préstamos en Curso) */}
      <article className="kpi-command-card" id="kpi-prestamos">
        <div className="kpi-card-top">
          <div className="kpi-icon-box icon-amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <span className={`kpi-badge-pill ${prestamosActivos > 0 ? 'badge-amber' : 'badge-green'}`}>
            {prestamosActivos > 0 ? 'Abiertos' : 'Al día'}
          </span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-label-text">Préstamos Activos</span>
          <h3 className="kpi-number-value">{prestamosActivos}</h3>
          <span className="kpi-status-subtext">
            {prestamosActivos > 0 ? `${prestamosActivos} préstamos en curso` : 'Sin préstamos abiertos'}
          </span>
        </div>
      </article>

      {/* KPI 4: Productos en Stock */}
      <article className="kpi-command-card" id="kpi-stock">
        <div className="kpi-card-top">
          <div className="kpi-icon-box icon-slate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span className={`kpi-badge-pill ${totalStock === 0 ? 'badge-rose' : 'badge-green'}`}>
            {totalStock === 0 ? 'Vacío' : 'Disponible'}
          </span>
        </div>
        <div className="kpi-card-body">
          <span className="kpi-label-text">Productos en Stock</span>
          <h3 className="kpi-number-value">{totalStock}</h3>
          <span className="kpi-status-subtext">Inventario disponible</span>
        </div>
      </article>
    </section>
  );
}
