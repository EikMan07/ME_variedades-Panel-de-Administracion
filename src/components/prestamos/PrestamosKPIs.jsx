import { usePrestamos } from '../../context/PrestamosContext';
import { formatMoneda } from './prestamosUtils';

export default function PrestamosKPIs() {
  const { calcularKPIsPrestamos } = usePrestamos();
  const kpis = calcularKPIsPrestamos();

  return (
    <div className="prestamos-kpis-grid">
      {/* KPI 1: Capital Total Prestado */}
      <div className="prestamo-kpi-card prestamo-kpi-rose">
        <div className="prestamo-kpi-icon prestamo-kpi-icon-rose">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div className="prestamo-kpi-info">
          <span className="prestamo-kpi-label">Capital Total Prestado</span>
          <span className="prestamo-kpi-value">
            {formatMoneda(kpis.capitalPrestado)}
          </span>
          <span className="prestamo-kpi-sublabel">
            {kpis.totalPrestamosCount} {kpis.totalPrestamosCount === 1 ? 'préstamo registrado' : 'préstamos registrados'}
          </span>
        </div>
      </div>

      {/* KPI 2: Intereses Proyectados / Ganancia */}
      <div className="prestamo-kpi-card prestamo-kpi-gold">
        <div className="prestamo-kpi-icon prestamo-kpi-icon-gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div className="prestamo-kpi-info">
          <span className="prestamo-kpi-label">Intereses / Ganancia</span>
          <span className="prestamo-kpi-value" style={{ color: 'var(--color-dorado)' }}>
            {formatMoneda(kpis.interesesProyectados)}
          </span>
          <span className="prestamo-kpi-sublabel">
            Rendimiento calculado
          </span>
        </div>
      </div>

      {/* KPI 3: Saldo Total Pendiente de Retorno */}
      <div className={`prestamo-kpi-card prestamo-kpi-coral ${kpis.prestamosVencidos > 0 ? 'prestamo-alert-pulse' : ''}`}>
        <div className="prestamo-kpi-icon prestamo-kpi-icon-coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div className="prestamo-kpi-info">
          <span className="prestamo-kpi-label">Saldo por Recuperar</span>
          <span className="prestamo-kpi-value" style={{ color: kpis.saldoTotalPendiente > 0 ? '#e06070' : '#88c985' }}>
            {formatMoneda(kpis.saldoTotalPendiente)}
          </span>
          <span className="prestamo-kpi-sublabel">
            {kpis.prestamosVencidos > 0 ? `${kpis.prestamosVencidos} préstamo(s) atrasado(s)` : 'Al día con los plazos'}
          </span>
        </div>
      </div>

      {/* KPI 4: Préstamos Activos vs Liquidados */}
      <div className="prestamo-kpi-card prestamo-kpi-cyan">
        <div className="prestamo-kpi-icon prestamo-kpi-icon-cyan">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <polyline points="16 11 18 13 22 9"></polyline>
          </svg>
        </div>
        <div className="prestamo-kpi-info">
          <span className="prestamo-kpi-label">Préstamos Activos</span>
          <span className="prestamo-kpi-value" style={{ color: '#f4b4c8' }}>
            {kpis.prestamosActivos}
          </span>
          <span className="prestamo-kpi-sublabel">
            {kpis.prestamosLiquidados} {kpis.prestamosLiquidados === 1 ? 'préstamo liquidado' : 'préstamos liquidados'}
          </span>
        </div>
      </div>
    </div>
  );
}
