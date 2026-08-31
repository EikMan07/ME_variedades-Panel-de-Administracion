import { useProducts } from '../../context/ProductContext';

export default function ProductFilters({
  activeCategory,
  setActiveCategory,
  filtroStock,
  setFiltroStock,
  searchInpage,
  setSearchInpage,
  viewMode,
  setViewMode
}) {
  const { productos } = useProducts();

  const categoryList = [
    { key: 'todos', label: 'Todos los Tipos', icon: true },
    { key: 'perfume', label: 'Perfumería' },
    { key: 'camisa', label: 'Camisas' },
    { key: 'short', label: 'Shorts' },
    { key: 'pantalón', label: 'Pantalones' },
    { key: 'vestido', label: 'Vestidos' },
    { key: 'zapato', label: 'Zapatos' },
    { key: 'crocs', label: 'Crocs' },
    { key: 'maquillaje', label: 'Maquillaje' },
    { key: 'accesorio', label: 'Accesorios' },
    { key: 'aparato electrónico', label: 'Electrónicos' }
  ];

  const getCount = (key) => {
    if (key === 'todos') return productos.length;
    return productos.filter(p => (p.tipo || '').toLowerCase() === key.toLowerCase()).length;
  };

  return (
    <section className="card-glass category-pills-section">
      <div className="pills-scroll-container">
        {categoryList.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`category-pill ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.icon && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            )}
            <span>{cat.label}</span>
            <span className="pill-count">{getCount(cat.key)}</span>
          </button>
        ))}
      </div>

      <div className="filters-bar-secondary">
        <div className="filter-search-box">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="input-search-inline"
            placeholder="Buscar producto en catálogo..."
            value={searchInpage}
            onChange={(e) => setSearchInpage(e.target.value)}
            aria-label="Buscar producto en catálogo"
          />
        </div>

        <div className="stock-filter-group">
          <label htmlFor="filtro-stock" className="filter-label-inline">
            Disponibilidad:
          </label>
          <select
            id="filtro-stock"
            className="select-glass select-compact"
            value={filtroStock}
            onChange={(e) => setFiltroStock(e.target.value)}
          >
            <option value="todos">Todo el inventario</option>
            <option value="disponible">Disponible (5 o más unidades)</option>
            <option value="bajo">Stock bajo (menos de 5 unidades)</option>
            <option value="agotado">Agotados (sin existencias)</option>
          </select>
        </div>

        <div className="view-toggle-group">
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista en Cuadrícula"
            aria-label="Vista en Cuadrícula"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button
            type="button"
            className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Vista en Tabla"
            aria-label="Vista en Tabla"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
