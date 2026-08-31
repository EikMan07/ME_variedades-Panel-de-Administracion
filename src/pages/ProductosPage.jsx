import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import ProductFilters from '../components/productos/ProductFilters';
import ProductGrid from '../components/productos/ProductGrid';
import ProductTable from '../components/productos/ProductTable';
import ProductModal from '../components/productos/ProductModal';
import Modal from '../components/common/Modal';
import { useProducts } from '../context/ProductContext';
import { useToast } from '../components/common/Toast';

export default function ProductosPage() {
  const { productos, eliminarProducto } = useProducts();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('todos');
  const [filtroStock, setFiltroStock] = useState('todos');
  const [searchInpage, setSearchInpage] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Filtrado reactivo de productos
  const productosFiltrados = useMemo(() => {
    const q = searchInpage.toLowerCase().trim();

    return productos.filter((p) => {
      const coincideBusqueda =
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.tipo || '').toLowerCase().includes(q);

      const coincideCategoria =
        activeCategory === 'todos' ||
        (p.tipo || '').toLowerCase() === activeCategory.toLowerCase();

      let coincideStock = true;
      const stockNum = Number(p.stock) || 0;
      if (filtroStock === 'disponible') {
        coincideStock = stockNum >= 5;
      } else if (filtroStock === 'bajo') {
        coincideStock = stockNum > 0 && stockNum < 5;
      } else if (filtroStock === 'agotado') {
        coincideStock = stockNum === 0;
      }

      return coincideBusqueda && coincideCategoria && coincideStock;
    });
  }, [productos, searchInpage, activeCategory, filtroStock]);

  // Resumen métricas
  const totalStock = useMemo(() => {
    return productos.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [productos]);

  const totalCriticos = useMemo(() => {
    return productos.filter((p) => (Number(p.stock) || 0) < 5).length;
  }, [productos]);

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (producto) => {
    setProductToEdit(producto);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (producto) => {
    setProductToDelete(producto);
  };

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    const res = eliminarProducto(productToDelete.id);
    if (res.success) {
      showToast(`"${productToDelete.nombre}" eliminado del catálogo`, 'success');
    }
    setProductToDelete(null);
  };

  return (
    <>
      <Topbar
        breadcrumb="Productos e Inventario"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-modal-crear"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Producto</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado y Métricas */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / <strong>Productos e Inventario</strong>
            </span>
            <h1 className="page-main-heading">Catálogo de Productos</h1>
            <p className="page-sub-heading">
              Control de existencias, precios de venta y disponibilidad por categoría.
            </p>
          </div>

          <div className="inventory-summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Total Productos</span>
              <span className="chip-val" id="chip-total-productos">
                {productos.length}
              </span>
            </div>
            <div className="summary-chip">
              <span className="chip-label">Unidades en Stock</span>
              <span className="chip-val" id="chip-stock-total">
                {totalStock}
              </span>
            </div>
            <div className="summary-chip chip-coral">
              <span className="chip-label">Stock Crítico / Agotado</span>
              <span className="chip-val" id="chip-stock-critico">
                {totalCriticos}
              </span>
            </div>
          </div>
        </section>

        {/* Filtros de Categoría y Controles */}
        <ProductFilters
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          filtroStock={filtroStock}
          setFiltroStock={setFiltroStock}
          searchInpage={searchInpage}
          setSearchInpage={setSearchInpage}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Vistas Grid y Tabla */}
        {viewMode === 'grid' ? (
          <ProductGrid
            productos={productosFiltrados}
            onEdit={handleEdit}
            onDeleteRequest={handleDeleteRequest}
            onOpenCreate={handleOpenCreate}
          />
        ) : (
          <ProductTable
            productos={productosFiltrados}
            onEdit={handleEdit}
            onDeleteRequest={handleDeleteRequest}
          />
        )}
      </main>

      {/* Modal: Registrar / Editar Producto */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={productToEdit}
      />

      {/* Modal: Confirmar Eliminación */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="¿Eliminar Producto?"
        subtitle="Control de inventario"
        cardClassName="modal-card-danger"
        icon={
          <div className="icon-circle-badge coral-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
        }
        footer={
          <>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setProductToDelete(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={handleConfirmDelete}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Sí, Eliminar y Ajustar Stock</span>
            </button>
          </>
        }
      >
        <p className="confirm-message">
          ¿Estás segura de que deseas eliminar &quot;{productToDelete?.nombre}&quot;?
        </p>
        <p className="note-explanation">
          Al eliminar este artículo, se descontarán automáticamente sus unidades del stock disponible de esa categoría en el inventario general.
        </p>
      </Modal>
    </>
  );
}
