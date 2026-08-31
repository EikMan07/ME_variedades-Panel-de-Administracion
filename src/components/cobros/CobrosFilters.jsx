export default function CobrosFilters({
  busqueda,
  setBusqueda,
  filtroPeriodo,
  setFiltroPeriodo,
  filtroMetodo,
  setFiltroMetodo,
  filtroAntiguedad,
  setFiltroAntiguedad,
  onReset
}) {
  return (
    <div className="card-glass cobros-filters-bar">
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

      {/* Filtro por Periodo */}
      <div className="cobros-filter-group">
        <label htmlFor="filtro-periodo-cobros">Periodo de cobro</label>
        <select
          id="filtro-periodo-cobros"
          className="select-glass"
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
        >
          <option value="todos">Todos los periodos</option>
          <option value="hoy">Cobrados hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Últimos 30 días</option>
        </select>
      </div>

      {/* Filtro por Método de Cobro */}
      <div className="cobros-filter-group">
        <label htmlFor="filtro-metodo-cobros">Método de cobro</label>
        <select
          id="filtro-metodo-cobros"
          className="select-glass"
          value={filtroMetodo}
          onChange={(e) => setFiltroMetodo(e.target.value)}
        >
          <option value="todos">Todos los métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="sinpe">SINPE Móvil</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia / Depósito</option>
        </select>
      </div>

      {/* Filtro por Semáforo / Días Transcurridos */}
      <div className="cobros-filter-group">
        <label htmlFor="filtro-antiguedad-cobros">Días transcurridos</label>
        <select
          id="filtro-antiguedad-cobros"
          className="select-glass"
          value={filtroAntiguedad}
          onChange={(e) => setFiltroAntiguedad(e.target.value)}
        >
          <option value="todos">Cualquier antigüedad</option>
          <option value="recientes">Recientes (0 a 3 días)</option>
          <option value="moderados">Moderados (4 a 7 días)</option>
          <option value="atencion">Atención requerida (8+ días)</option>
        </select>
      </div>

      {/* Botón Limpiar */}
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          type="button"
          className="btn-secondary-action"
          onClick={onReset}
          title="Restablecer filtros"
          id="btn-limpiar-filtros-cobros"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 .49-3.52"></path>
          </svg>
          <span>Limpiar</span>
        </button>
      </div>
    </div>
  );
}
