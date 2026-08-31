import { usePagos } from '../../context/PagosContext';
import { formatMoneda } from './pagosUtils';

export default function PagosKPIs() {
  const { calcularKPIs } = usePagos();
  const kpis = calcularKPIs();

  return (
    <div className="pagos-kpis-grid">
      {/* KPI 1: Total por Cobrar */}
      <div className="kpi-card kpi-card-rose">
        <div className="kpi-icon kpi-icon-rose">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div className="kpi-info">
          <span className="kpi-label">Total por Cobrar</span>
          <span className="kpi-value">{formatMoneda(kpis.totalPorCobrar)}</span>
          <span className="kpi-sublabel">Saldo pendiente global</span>
        </div>
      </div>

      {/* KPI 2: Pagos Vencidos */}
      <div className={`kpi-card kpi-card-red ${kpis.cantidadVencidos > 0 ? 'kpi-alert-pulse' : ''}`}>
        <div className="kpi-icon kpi-icon-red">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div className="kpi-info">
          <span className="kpi-label">Pagos Vencidos</span>
          <span className={`kpi-value ${kpis.cantidadVencidos > 0 ? 'kpi-value-red' : ''}`}>
            {kpis.cantidadVencidos}
          </span>
          <span className="kpi-sublabel">
            {kpis.cantidadVencidos === 0 ? 'Sin cobros vencidos' : 'Requieren atencion inmediata'}
          </span>
        </div>
      </div>

      {/* KPI 3: Pagados / Al dia */}
      <div className="kpi-card kpi-card-green">
        <div className="kpi-icon kpi-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="kpi-info">
          <span className="kpi-label">Pagados al Dia</span>
          <span className="kpi-value kpi-value-green">{kpis.cantidadAlDia}</span>
          <span className="kpi-sublabel">Cuentas saldadas</span>
        </div>
      </div>

      {/* KPI 4: Total Recaudado en el Mes */}
      <div className="kpi-card kpi-card-gold">
        <div className="kpi-icon kpi-icon-gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div className="kpi-info">
          <span className="kpi-label">Recaudado este Mes</span>
          <span className="kpi-value kpi-value-gold">{formatMoneda(kpis.totalRecaudadoMes)}</span>
          <span className="kpi-sublabel">Total de abonos del mes</span>
        </div>
      </div>
    </div>
  );
}
