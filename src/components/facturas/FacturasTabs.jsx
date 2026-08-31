import { useFacturas } from '../../context/FacturasContext';

export default function FacturasTabs({
  busqueda,
  setBusqueda,
  filtroCategoria,
  setFiltroCategoria,
  filtroFecha,
  setFiltroFecha,
  onReset
}) {
  const { facturas } = useFacturas();

  const countTodas = facturas.length;
  const countPedidos = facturas.filter(f => f.tipo_categoria === 'pedidos').length;
  const countPagosCobros = facturas.filter(f => f.tipo_categoria === 'pagos' || f.tipo_categoria === 'cobros').length;
  const countPrestamos = facturas.filter(f => f.tipo_categoria === 'prestamos').length;

  const tabs = [
    { id: 'todas', label: 'Todos los Archivos', count: countTodas },
    { id: 'pedidos', label: 'Comprobantes de Pedidos', count: countPedidos },
    { id: 'cobros', label: 'Recibos de Pago / Cobro', count: countPagosCobros },
    { id: 'prestamos', label: 'Respaldos de Préstamos', count: countPrestamos },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Pestañas / Píldoras de Categoría */}
      <div className="facturas-tabs-bar category-pills-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filtroCategoria === tab.id}
            className={`btn-factura-tab pill-btn ${filtroCategoria === tab.id ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-counter-badge">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Barra de Filtro de Fecha y Limpiar */}
      <div className="card-glass facturas-filters-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          {/* Buscador estandarizado a la izquierda de los filtros */}
          <div className="filter-group search-filter-group">
            <label className="filter-label">Buscar Cliente</label>
            <div className="search-input-wrapper">
              <svg className="search-icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="filter-input search-client-input" 
                placeholder="Buscar por nombre, teléfono o ID (ej. CLI-0001)..."
                value={busqueda || ''}
                onChange={(e) => setBusqueda(e.target.value)}
                autoComplete="off"
              />
              {busqueda && (
                <button
                  type="button"
                  className="btn-clear-input"
                  title="Borrar búsqueda"
                  onClick={() => setBusqueda('')}
                  aria-label="Borrar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)', fontWeight: 500 }}>
              Periodo de emisión:
            </span>
            <select
              className="select-glass"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              style={{ minWidth: 160, padding: '0.4rem 0.75rem' }}
            >
              <option value="todas">Cualquier fecha</option>
              <option value="hoy">Emitidas hoy</option>
              <option value="mes">Este mes</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary-action"
          onClick={onReset}
          title="Restablecer filtros"
          id="btn-limpiar-filtros-facturas"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 .49-3.52"></path>
          </svg>
          <span>Limpiar</span>
        </button>
      </div>
    </div>
  );
}
