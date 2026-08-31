export default function ClientFilters({
  busqueda,
  setBusqueda,
  filtroMes,
  setFiltroMes,
  filtroActividad,
  setFiltroActividad,
  onReset
}) {
  return (
    <section className="card-glass filters-card" aria-label="Filtros y Búsqueda de Clientes">
      <div className="clients-filters-grid">
        {/* 1. Nuevo Buscador de Clientes Dedicado */}
        <div className="filter-group filter-search-group">
          <label htmlFor="search-client-input" className="filter-label">
            Buscar Cliente
          </label>
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="search-client-input"
              className="form-input filter-input"
              placeholder="Buscar por nombre, teléfono o ID (ej. CLI-0001)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              id="clear-search-btn"
              className={`btn-clear-input ${!busqueda ? 'hidden' : ''}`}
              title="Borrar búsqueda"
              onClick={() => setBusqueda('')}
              aria-label="Borrar búsqueda"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Filtro por Mes de Cumpleaños */}
        <div className="filter-group">
          <label htmlFor="filter-birthday-month" className="filter-label">
            Filtrar por Mes de Cumpleaños
          </label>
          <select
            id="filter-birthday-month"
            className="form-select filter-select"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            <option value="all">Todos los meses</option>
            <option value="0">Enero</option>
            <option value="1">Febrero</option>
            <option value="2">Marzo</option>
            <option value="3">Abril</option>
            <option value="4">Mayo</option>
            <option value="5">Junio</option>
            <option value="6">Julio</option>
            <option value="7">Agosto</option>
            <option value="8">Septiembre</option>
            <option value="9">Octubre</option>
            <option value="10">Noviembre</option>
            <option value="11">Diciembre</option>
          </select>
        </div>

        {/* 3. Filtro por Estado de Cuenta */}
        <div className="filter-group">
          <label htmlFor="filter-account-status" className="filter-label">
            Estado de Cuenta
          </label>
          <select
            id="filter-account-status"
            className="form-select filter-select"
            value={filtroActividad}
            onChange={(e) => setFiltroActividad(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="sin_deuda">Sin deudas activas</option>
            <option value="con_saldo">Con saldo pendiente</option>
            <option value="prestamo_activo">Préstamo activo</option>
          </select>
        </div>

        {/* 4. Botón Limpiar Filtros */}
        <div className="filter-group filter-actions">
          <button
            type="button"
            id="btn-reset-filters"
            className="btn-secondary btn-reset"
            onClick={onReset}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>
  );
}
