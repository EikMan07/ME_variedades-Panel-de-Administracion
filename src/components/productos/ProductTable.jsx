export default function ProductTable({
  productos,
  onEdit,
  onDeleteRequest
}) {
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return { clase: 'badge-stock-out', texto: 'Agotado' };
    } else if (stock < 5) {
      return { clase: 'badge-stock-low', texto: 'Stock Bajo' };
    } else {
      return { clase: 'badge-stock-normal', texto: 'En Stock' };
    }
  };

  const capitalizar = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (productos.length === 0) {
    return (
      <section className="card-glass products-table-view" id="products-table-container">
        <div id="productos-empty-state" className="empty-state-card">
          <div className="empty-icon-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3>Catálogo de Productos Listo</h3>
          <p>No hay registros disponibles. Utiliza el botón superior para agregar el primero.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card-glass products-table-view" id="products-table-container">
      <div className="table-responsive">
        <table className="data-table" id="tabla-productos">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Tipo / Categoría</th>
              <th>Género</th>
              <th>Costo / Precio</th>
              <th>Stock Disponible</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const stockNum = Number(p.stock) || 0;
              const badge = getStockBadge(stockNum);

              return (
                <tr key={p.id}>
                  <td>
                    <div className="client-info-cell">
                      <div
                        className="client-avatar-circle"
                        style={{
                          background: 'rgba(154, 110, 121, 0.2)',
                          color: 'var(--color-rosa-empolvado)'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        </svg>
                      </div>
                      <div>
                        <span className="client-name-text">{p.nombre}</span>
                        <span className="client-id-text">
                          SKU: PROD-{String(p.id).padStart(4, '0')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="tag-category">{capitalizar(p.tipo)}</span>
                  </td>
                  <td>
                    {p.genero ? (
                      <span className="tag-gender">{p.genero}</span>
                    ) : (
                      <span style={{ color: 'var(--color-texto-apagado)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong>₡{Number(p.costo || 0).toLocaleString('es-CR')}</strong>
                  </td>
                  <td>
                    <span
                      className={`product-stock-badge-overlay ${badge.clase}`}
                      style={{ position: 'static', display: 'inline-flex' }}
                    >
                      {stockNum} unids. ({badge.texto})
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="btn-table-action btn-action-edit"
                        onClick={() => onEdit(p)}
                        title="Editar Producto"
                        aria-label="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn-table-action btn-action-delete"
                        onClick={() => onDeleteRequest(p)}
                        title="Eliminar Producto"
                        aria-label="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
