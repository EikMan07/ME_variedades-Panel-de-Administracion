import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import OrderModal from '../components/pedidos/OrderModal';
import Modal from '../components/common/Modal';
import { useOrders } from '../context/OrderContext';
import { useClients } from '../context/ClientContext';
import { useProducts } from '../context/ProductContext';

export default function PedidosPage() {
  const { pedidos, eliminarPedido } = useOrders();
  const { clientes } = useClients();
  const { productos } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [pedidoToEdit, setPedidoToEdit] = useState(null);
  const [pedidoToDelete, setPedidoToDelete] = useState(null);

  // Filtrado de pedidos en tiempo real
  const pedidosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return pedidos;

    const q = searchQuery.toLowerCase().trim();
    return pedidos.filter((p) => {
      const cliente = clientes.find((c) => Number(c.id) === Number(p.cliente_id));
      const producto = productos.find((pr) => Number(pr.id) === Number(p.producto_id));
      const nombreCliente = cliente ? cliente.nombre_completo.toLowerCase() : '';
      const nombreProducto = producto ? producto.nombre.toLowerCase() : '';
      const codigo = `#ped-${String(p.id).padStart(4, '0')}`.toLowerCase();

      return nombreCliente.includes(q) || nombreProducto.includes(q) || codigo.includes(q);
    });
  }, [pedidos, clientes, productos, searchQuery]);

  const handleOpenCreate = () => {
    setPedidoToEdit(null);
    setShowModal(true);
  };

  const handleOpenEdit = (pedido) => {
    setPedidoToEdit(pedido);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPedidoToEdit(null);
  };

  const handleConfirmDelete = async () => {
    if (!pedidoToDelete) return;
    await eliminarPedido(pedidoToDelete.id);
    setPedidoToDelete(null);
  };

  return (
    <>
      <Topbar
        breadcrumb="Gestión de Pedidos"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-crear-pedido"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Pedido</span>
          </button>
        }
      />

      <main className="pedidos-page-content">
        {/* Cabecera del Módulo */}
        <div className="module-header-banner">
          <div>
            <h1 className="module-title">Gestión de Pedidos</h1>
            <p className="module-subtitle">
              Administración de ventas, despacho y control de inventario en tiempo real para ME Variedades.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Pedido</span>
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <section className="pedidos-filters-bar">
          <div className="search-box-group">
            <svg className="search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente, producto o código #PED-0001..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="counter-pill-badge">
            {pedidos.length} {pedidos.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
          </div>
        </section>

        {/* Contenedor Principal: Empty State o Tabla */}
        <section className="pedidos-table-container">
          {pedidos.length === 0 ? (
            <div className="orders-empty-state">
              <div className="empty-icon-circle">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h2 className="empty-heading">No hay pedidos registrados</h2>
              <p className="empty-text">
                Aún no se han generado órdenes de venta. Registra un nuevo pedido asociándolo a un cliente existente y a los productos disponibles en catálogo.
              </p>
              <button
                type="button"
                className="btn-primary-action"
                onClick={handleOpenCreate}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Crear Primer Pedido</span>
              </button>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-data-table">
                <thead>
                  <tr>
                    <th>ID Pedido</th>
                    <th>Cliente</th>
                    <th>Producto Solicitado</th>
                    <th>Cantidad</th>
                    <th>Costo Total</th>
                    <th>Fecha de Registro</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="table-no-match">
                        No se encontraron pedidos que coincidan con la búsqueda &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    pedidosFiltrados.map((pedido) => {
                      const cliente = clientes.find((c) => Number(c.id) === Number(pedido.cliente_id));
                      const producto = productos.find((pr) => Number(pr.id) === Number(pedido.producto_id));

                      const clienteNombre =
                        pedido.clientes?.nombre_completo ||
                        pedido.cliente?.nombre_completo ||
                        (cliente ? cliente.nombre_completo : 'Cliente no identificado');

                      const productoNombre =
                        pedido.productos?.nombre ||
                        pedido.producto?.nombre ||
                        (producto ? producto.nombre : 'Producto no disponible');

                      const totalNum =
                        Number(pedido.total !== undefined && pedido.total !== null ? pedido.total : pedido.costo_total) || 0;

                      const fechaRaw = pedido.created_at || pedido.fecha_registro;
                      let fechaTexto = 'Reciente';
                      if (fechaRaw) {
                        const d = new Date(fechaRaw);
                        if (!isNaN(d.getTime())) {
                          fechaTexto = d.toLocaleDateString('es-CR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          });
                        }
                      }

                      return (
                        <tr key={pedido.id}>
                          <td>
                            <span className="order-id-badge">
                              #PED-{String(pedido.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="cell-client-name">{clienteNombre}</td>
                          <td className="cell-product-name">{productoNombre}</td>
                          <td>
                            {pedido.cantidad} {pedido.cantidad === 1 ? 'unidad' : 'unidades'}
                          </td>
                          <td className="cell-price">
                            ₡{totalNum.toLocaleString('es-CR')}
                          </td>
                          <td className="cell-date">{fechaTexto}</td>
                          <td>
                            <span className={`status-pill-active ${pedido.estado === 'Entregado' ? 'status-entregado' : pedido.estado === 'Cancelado' ? 'status-cancelado' : ''}`}>
                              <span className="status-dot" />
                              {pedido.estado || 'Activo'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              <button
                                type="button"
                                className="btn-action-icon edit"
                                title="Editar pedido"
                                onClick={() => handleOpenEdit(pedido)}
                                aria-label="Editar pedido"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="btn-action-icon delete"
                                title="Eliminar pedido"
                                onClick={() => setPedidoToDelete(pedido)}
                                aria-label="Eliminar pedido"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Creación / Edición */}
      <OrderModal
        isOpen={showModal}
        onClose={handleCloseModal}
        pedidoToEdit={pedidoToEdit}
      />

      {/* Modal Confirmación de Eliminación */}
      <Modal
        isOpen={Boolean(pedidoToDelete)}
        onClose={() => setPedidoToDelete(null)}
        title="Eliminar Pedido"
        subtitle={`¿Está seguro de eliminar el pedido #PED-${String(pedidoToDelete?.id || '').padStart(4, '0')}? Esta acción no se puede deshacer.`}
        cardClassName="modal-delete-card"
        icon={
          <div className="icon-circle-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
        }
      >
        <div className="modal-actions-footer">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => setPedidoToDelete(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger-action"
            onClick={handleConfirmDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '42px',
              padding: '0 1.25rem',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Eliminar Pedido</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
