import { useCobros } from '../../context/CobrosContext';
import { formatMoneda } from './cobrosUtils';

export default function CobrosKPIs() {
  const { calcularKPIsCobros } = useCobros();
  const kpis = calcularKPIsCobros();

  return (
    <div className="cobros-kpis-grid">
      {/* KPI 1: Cobros Realizados Hoy */}
      <div className="cobros-kpi-card cobros-kpi-green">
        <div className="cobros-kpi-icon cobros-kpi-icon-green">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="cobros-kpi-info">
          <span className="cobros-kpi-label">Cobros Realizados Hoy</span>
          <span className="cobros-kpi-value" style={{ color: '#88c985' }}>
            {kpis.cobrosHoyCount} {kpis.cobrosHoyCount === 1 ? 'cobro' : 'cobros'}
          </span>
          <span className="cobros-kpi-sublabel">
            Total hoy: {formatMoneda(kpis.montoCobradoHoy)}
          </span>
        </div>
      </div>

      {/* KPI 2: Clientes con Cobro Pendiente/Atrasado */}
      <div className={`cobros-kpi-card cobros-kpi-coral ${kpis.clientesAtencionCount > 0 ? 'cobros-alert-pulse' : ''}`}>
        <div className="cobros-kpi-icon cobros-kpi-icon-coral">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div className="cobros-kpi-info">
          <span className="cobros-kpi-label">Cobros en Atención</span>
          <span className="cobros-kpi-value" style={{ color: kpis.clientesAtencionCount > 0 ? '#e06070' : 'inherit' }}>
            {kpis.clientesAtencionCount} {kpis.clientesAtencionCount === 1 ? 'cliente' : 'clientes'}
          </span>
          <span className="cobros-kpi-sublabel">
            {kpis.clientesAtencionCount === 0 ? 'Cobros al día' : '8+ días sin registrar cobro'}
          </span>
        </div>
      </div>

      {/* KPI 3: Promedio de Días entre Cobros */}
      <div className="cobros-kpi-card cobros-kpi-gold">
        <div className="cobros-kpi-icon cobros-kpi-icon-gold">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="cobros-kpi-info">
          <span className="cobros-kpi-label">Días Promedio</span>
          <span className="cobros-kpi-value" style={{ color: 'var(--color-dorado)' }}>
            {kpis.promedioDias} {kpis.promedioDias === 1 ? 'día' : 'días'}
          </span>
          <span className="cobros-kpi-sublabel">
            Tiempo promedio desde cobro
          </span>
        </div>
      </div>

      {/* KPI 4: Total Recaudado en Cobros */}
      <div className="cobros-kpi-card cobros-kpi-rose">
        <div className="cobros-kpi-icon cobros-kpi-icon-rose">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div className="cobros-kpi-info">
          <span className="cobros-kpi-label">Total Recaudado</span>
          <span className="cobros-kpi-value">
            {formatMoneda(kpis.totalRecaudado)}
          </span>
          <span className="cobros-kpi-sublabel">
            {kpis.totalCobrosCount} {kpis.totalCobrosCount === 1 ? 'registro' : 'registros acumulados'}
          </span>
        </div>
      </div>
    </div>
  );
}
