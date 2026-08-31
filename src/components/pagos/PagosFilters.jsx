/**
 * Barra de filtros del modulo de Pagos.
 * RF-20: Filtrar pagos pendientes por cliente y estado.
 */
export default function PagosFilters({ busqueda, setBusqueda, filtroEstado, setFiltroEstado, onReset }) {
  return (
    <div className="card-glass pagos-filters-bar">
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

      <div className="pagos-filter-group">
        <label htmlFor="filtro-estado-pagos">Estado del pago</label>
        <select
          id="filtro-estado-pagos"
          className="select-glass"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente (al dia)</option>
          <option value="proximo">Proximo a vencer (3 dias o menos)</option>
          <option value="vencido">Vencido</option>
          <option value="pagado">Pagado (saldado)</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          type="button"
          className="btn-secondary-action"
          onClick={onReset}
          title="Limpiar filtros"
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
