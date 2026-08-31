import { useFacturas } from '../../context/FacturasContext';

export default function FacturasKPIs() {
  const { calcularKPIsFacturas } = useFacturas();
  const kpis = calcularKPIsFacturas();

  return (
    <div className="facturas-kpis-grid invoices-kpi-grid">
      {/* 1. Total Comprobantes */}
      <div className="factura-kpi-card factura-kpi-gold kpi-doc-card kpi-card-total">
        <div className="factura-kpi-icon factura-kpi-icon-gold kpi-doc-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </div>
        <div className="factura-kpi-info kpi-doc-content">
          <span className="factura-kpi-label kpi-doc-title">TOTAL COMPROBANTES</span>
          <h3 className="factura-kpi-value kpi-doc-number" style={{ color: 'var(--color-dorado)' }}>
            {kpis.totalFacturas}
          </h3>
          <p className="factura-kpi-sublabel kpi-doc-subtext">
            Archivos digitalizados
          </p>
        </div>
      </div>

      {/* 2. Comprobantes de Pedidos */}
      <div className="factura-kpi-card factura-kpi-rose kpi-doc-card kpi-card-pedidos">
        <div className="factura-kpi-icon factura-kpi-icon-rose kpi-doc-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4b4c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div className="factura-kpi-info kpi-doc-content">
          <span className="factura-kpi-label kpi-doc-title">COMPROBANTES DE PEDIDO</span>
          <h3 className="factura-kpi-value kpi-doc-number">
            {kpis.facturasPedidos}
          </h3>
          <p className="factura-kpi-sublabel kpi-doc-subtext">
            Facturas de mercadería
          </p>
        </div>
      </div>

      {/* 3. Recibos de Pago / Cobro */}
      <div className="factura-kpi-card factura-kpi-green kpi-doc-card kpi-card-cobros">
        <div className="factura-kpi-icon factura-kpi-icon-green kpi-doc-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div className="factura-kpi-info kpi-doc-content">
          <span className="factura-kpi-label kpi-doc-title">RECIBOS DE PAGO / COBRO</span>
          <h3 className="factura-kpi-value kpi-doc-number" style={{ color: '#88c985' }}>
            {kpis.facturasPagosCobros}
          </h3>
          <p className="factura-kpi-sublabel kpi-doc-subtext">
            Transferencias y abonos
          </p>
        </div>
      </div>

      {/* 4. Respaldos de Préstamos */}
      <div className="factura-kpi-card factura-kpi-cyan kpi-doc-card kpi-card-prestamos">
        <div className="factura-kpi-icon factura-kpi-icon-cyan kpi-doc-icon-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e0a6b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div className="factura-kpi-info kpi-doc-content">
          <span className="factura-kpi-label kpi-doc-title">RESPALDOS DE PRÉSTAMO</span>
          <h3 className="factura-kpi-value kpi-doc-number" style={{ color: '#f4b4c8' }}>
            {kpis.facturasPrestamos}
          </h3>
          <p className="factura-kpi-sublabel kpi-doc-subtext">
            Pagarés y contratos
          </p>
        </div>
      </div>
    </div>
  );
}
