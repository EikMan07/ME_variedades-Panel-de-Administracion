import ProductCard from './ProductCard';

export default function ProductGrid({
  productos,
  onEdit,
  onDeleteRequest,
  onOpenCreate
}) {
  if (productos.length === 0) {
    return (
      <div id="productos-empty-state" className="empty-state-card">
        <div className="empty-icon-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <h3>No se encontraron productos</h3>
        <p>No hay artículos que coincidan con la búsqueda o el filtro de categoría seleccionado.</p>
        <button
          type="button"
          className="btn-primary-action"
          onClick={onOpenCreate}
        >
          Registrar Nuevo Producto
        </button>
      </div>
    );
  }

  return (
    <section className="products-grid-view" id="products-grid-container">
      {productos.map((prod) => (
        <ProductCard
          key={prod.id}
          producto={prod}
          onEdit={onEdit}
          onDeleteRequest={onDeleteRequest}
        />
      ))}
    </section>
  );
}
