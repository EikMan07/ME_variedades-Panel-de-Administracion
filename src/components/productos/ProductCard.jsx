import { useProducts } from '../../context/ProductContext';
import { useToast } from '../common/Toast';

export default function ProductCard({ producto, onEdit, onDeleteRequest }) {
  const { ajustarStock } = useProducts();
  const { showToast } = useToast();

  const stockNum = Number(producto.stock) || 0;

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return { clase: 'badge-stock-out', texto: 'Agotado' };
    } else if (stock < 5) {
      return { clase: 'badge-stock-low', texto: 'Stock Bajo' };
    } else {
      return { clase: 'badge-stock-normal', texto: 'En Stock' };
    }
  };

  const badge = getStockBadge(stockNum);

  const handleAdjust = (cambio) => {
    if (cambio < 0 && stockNum <= 0) {
      showToast(`"${producto.nombre}" ya no tiene stock disponible (0 unids.)`, 'error');
      return;
    }
    const res = ajustarStock(producto.id, cambio);
    if (res.success) {
      showToast(`Stock de "${producto.nombre}": ${res.nuevoStock} unids.`, 'success');
    }
  };

  const capitalizar = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <article className="product-card" data-id={producto.id}>
      <div className="product-image-box">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="product-img"
          />
        ) : (
          <div className="product-img-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>Sin imagen</span>
          </div>
        )}
        <div className={`product-stock-badge-overlay ${badge.clase}`}>
          {badge.texto}
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-tags-row">
          <span className="tag-category">{capitalizar(producto.tipo)}</span>
          {producto.genero && <span className="tag-gender">{producto.genero}</span>}
        </div>

        <h3 className="product-title" title={producto.nombre}>
          {producto.nombre}
        </h3>

        <div className="product-price-box">
          <span className="product-price">
            ₡{Number(producto.costo || 0).toLocaleString('es-CR')}
          </span>
        </div>

        <div className="stock-control-panel">
          <div className="stock-info-text">
            <span className="stock-label">Disponibles</span>
            <span className="stock-number">{stockNum} unidades</span>
          </div>
          <div className="stock-quick-btns">
            <button
              type="button"
              className="btn-stock-adjust btn-stock-minus"
              onClick={() => handleAdjust(-1)}
              title="Restar 1 unidad"
              aria-label="Restar"
            >
              -
            </button>
            <button
              type="button"
              className="btn-stock-adjust btn-stock-plus"
              onClick={() => handleAdjust(1)}
              title="Sumar 1 unidad"
              aria-label="Sumar"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="product-card-footer">
        <span className="client-id-text">
          SKU: PROD-{String(producto.id).padStart(4, '0')}
        </span>
        <div className="action-buttons-group">
          <button
            type="button"
            className="btn-table-action btn-action-edit"
            onClick={() => onEdit(producto)}
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
            onClick={() => onDeleteRequest(producto)}
            title="Eliminar Producto"
            aria-label="Eliminar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
