import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useClients } from '../../context/ClientContext';
import { useProducts } from '../../context/ProductContext';
import { useOrders } from '../../context/OrderContext';

export default function OrderModal({ isOpen, onClose, pedidoToEdit = null }) {
  const { clientes } = useClients();
  const { productos } = useProducts();
  const { procesarPedido, actualizarPedido } = useOrders();

  const autocompleteRef = useRef(null);

  const [clienteId, setClienteId] = useState('');
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);

  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [estado, setEstado] = useState('Activo');
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (pedidoToEdit) {
        setClienteId(pedidoToEdit.cliente_id || '');
        const cl = clientes.find((c) => Number(c.id) === Number(pedidoToEdit.cliente_id));
        const nombreCl =
          pedidoToEdit.clientes?.nombre_completo ||
          pedidoToEdit.cliente?.nombre_completo ||
          (cl ? cl.nombre_completo : '');
        const telCl = cl?.telefono ? ` (${cl.telefono})` : '';
        setClienteBusqueda(nombreCl ? `${nombreCl}${telCl}` : '');

        setProductoId(pedidoToEdit.producto_id || '');
        setCantidad(String(pedidoToEdit.cantidad || '1'));
        setEstado(pedidoToEdit.estado || 'Activo');
      } else {
        setClienteId('');
        setClienteBusqueda('');
        setProductoId('');
        setCantidad('1');
        setEstado('Activo');
      }
      setShowDropdown(false);
      setClientesFiltrados([]);
      setErrores({});
      setIsSubmitting(false);
    }
  }, [isOpen, pedidoToEdit, clientes]);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const resetForm = () => {
    setClienteId('');
    setClienteBusqueda('');
    setShowDropdown(false);
    setClientesFiltrados([]);
    setProductoId('');
    setCantidad('1');
    setEstado('Activo');
    setErrores({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSearchChange = (e) => {
    const valor = e.target.value;
    setClienteBusqueda(valor);
    setClienteId(''); // Forzar nueva selección

    const query = valor.trim().toLowerCase();

    // Si el campo está vacío: Ocultar y limpiar inmediatamente
    if (query.length === 0) {
      setShowDropdown(false);
      setClientesFiltrados([]);
      return;
    }

    // Si hay texto: Filtrar clientes coincidentes
    const filtrados = clientes.filter(
      (c) =>
        (c.nombre_completo && c.nombre_completo.toLowerCase().includes(query)) ||
        (c.telefono && c.telefono.replace(/[\s-]/g, '').includes(query.replace(/[\s-]/g, ''))) ||
        (c.identificacion && String(c.identificacion).toLowerCase().includes(query)) ||
        (c.id && String(c.id).toLowerCase().includes(query))
    );

    setClientesFiltrados(filtrados);
    setShowDropdown(true);

    if (errores.cliente_id) {
      setErrores((prev) => ({ ...prev, cliente_id: '' }));
    }
  };

  const handleSelectCliente = (cliente) => {
    setClienteId(cliente.id);
    setClienteBusqueda(cliente.nombre_completo + (cliente.telefono ? ` (${cliente.telefono})` : ''));
    setShowDropdown(false);
    setErrores((prev) => ({ ...prev, cliente_id: '' }));
  };

  const handleClearCliente = () => {
    setClienteId('');
    setClienteBusqueda('');
    setClientesFiltrados([]);
    setShowDropdown(false);
  };

  const productoSeleccionado = productos.find((p) => String(p.id) === String(productoId));
  const stockDisponible = productoSeleccionado ? Number(productoSeleccionado.stock) || 0 : 0;
  const costoUnitario = productoSeleccionado ? Number(productoSeleccionado.costo) || 0 : 0;
  const cantidadNum = Number(cantidad) || 0;
  const costoTotalEstimado = cantidadNum * costoUnitario;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let resultado;
    if (pedidoToEdit) {
      resultado = await actualizarPedido(pedidoToEdit.id, {
        cliente_id: clienteId,
        producto_id: productoId,
        cantidad: cantidadNum,
        estado: estado,
      });
    } else {
      resultado = await procesarPedido({
        cliente_id: clienteId,
        producto_id: productoId,
        cantidad: cantidadNum,
        estado: estado,
      });
    }

    if (resultado.success) {
      resetForm();
      onClose();
    } else if (resultado.errores) {
      setErrores(resultado.errores);
    }
    setIsSubmitting(false);
  };

  const handleProductoChange = (e) => {
    const val = e.target.value;
    setProductoId(val);
    setErrores((prev) => ({ ...prev, producto_id: '', cantidad: '' }));
  };

  const handleCantidadChange = (e) => {
    const val = e.target.value;
    setCantidad(val);
    setErrores((prev) => ({ ...prev, cantidad: '' }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={pedidoToEdit ? `Editar Pedido #PED-${String(pedidoToEdit.id).padStart(4, '0')}` : 'Registrar Nuevo Pedido'}
      subtitle={
        pedidoToEdit
          ? 'Actualice la información, cantidad o estado del pedido'
          : 'Asocie un cliente del directorio con un producto en inventario'
      }
      cardClassName="modal-order-card"
      icon={
        <div className="icon-circle-badge rose-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="form-order-modal">
        {/* Selección de Cliente con Combobox / Live Search */}
        <div className="form-group autocomplete-group" id="cliente-autocomplete-container" ref={autocompleteRef}>
          <label htmlFor="search-cliente-pedido" className="form-label">
            Cliente Comprador *
          </label>

          <div className="search-combobox-wrapper">
            <svg className="combobox-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>

            <input
              type="text"
              id="search-cliente-pedido"
              className={`form-input combobox-input ${errores.cliente_id ? 'input-error' : ''} ${clienteId ? 'has-selection' : ''}`}
              placeholder="Escribe el nombre o teléfono del cliente..."
              autoComplete="off"
              value={clienteBusqueda}
              onChange={handleSearchChange}
              onFocus={() => {
                if (clienteBusqueda.trim().length > 0 && !clienteId) {
                  setShowDropdown(true);
                }
              }}
              required
            />

            {clienteBusqueda && (
              <button
                type="button"
                id="btn-clear-cliente-selected"
                className="btn-clear-selection"
                title="Cambiar cliente"
                onClick={handleClearCliente}
              >
                ✕
              </button>
            )}

            <input type="hidden" id="pedido-cliente-id" name="cliente_id" value={clienteId} required />

            {showDropdown && (
              <div id="cliente-search-dropdown" className="combobox-dropdown" role="listbox">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((c) => (
                    <div
                      key={c.id}
                      className="combobox-item"
                      role="option"
                      onClick={() => handleSelectCliente(c)}
                    >
                      <div className="combobox-avatar">
                        {c.nombre_completo ? c.nombre_completo.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="combobox-info">
                        <div className="combobox-nombre">{c.nombre_completo}</div>
                        <div className="combobox-meta">
                          {c.telefono && <span className="combobox-tel">{c.telefono}</span>}
                          {c.identificacion && <span className="combobox-id">ID: {c.identificacion}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="combobox-empty">
                    No se encontró ningún cliente con &quot;{clienteBusqueda}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
          {errores.cliente_id && (
            <span className="input-error-msg visible">{errores.cliente_id}</span>
          )}
        </div>

        {/* Selección de Producto */}
        <div className="form-group">
          <label htmlFor="modal-select-producto" className="form-label">
            Producto en Stock *
          </label>
          <select
            id="modal-select-producto"
            value={productoId}
            onChange={handleProductoChange}
            className={`input-form select-glass ${errores.producto_id ? 'input-error' : ''}`}
          >
            <option value="">-- Seleccione un producto --</option>
            {productos.map((p) => {
              const stock = Number(p.stock) || 0;
              const costo = Number(p.costo) || 0;
              const sinStock = stock === 0 && (!pedidoToEdit || String(p.id) !== String(pedidoToEdit.producto_id));
              return (
                <option key={p.id} value={p.id} disabled={sinStock}>
                  {p.nombre} {sinStock ? '(Sin Stock / Agotado)' : `- ₡${costo.toLocaleString('es-CR')} (Stock: ${stock})`}
                </option>
              );
            })}
          </select>
          {errores.producto_id && (
            <span className="input-error-msg visible">{errores.producto_id}</span>
          )}
        </div>

        {/* Cantidad y Costo Total */}
        <div className="form-row-grid">
          <div className="form-group">
            <label htmlFor="modal-input-cantidad" className="form-label">
              Cantidad a Facturar *
            </label>
            <input
              type="number"
              id="modal-input-cantidad"
              min="1"
              step="1"
              value={cantidad}
              onChange={handleCantidadChange}
              className={`input-form ${errores.cantidad ? 'input-error' : ''}`}
              placeholder="1"
            />
            {errores.cantidad && (
              <span className="input-error-msg visible">{errores.cantidad}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Costo Total Estimado</label>
            <div className="cost-display-box">
              ₡{costoTotalEstimado.toLocaleString('es-CR')}
            </div>
          </div>
        </div>

        {/* Estado del Pedido (Especialmente para Edición) */}
        <div className="form-group">
          <label htmlFor="modal-select-estado" className="form-label">
            Estado del Pedido
          </label>
          <select
            id="modal-select-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="input-form select-glass"
          >
            <option value="Activo">Activo (En curso)</option>
            <option value="Entregado">Entregado / Despachado</option>
            <option value="Pendiente">Pendiente de entrega</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {/* Banner de Stock en Tiempo Real */}
        {productoSeleccionado && (
          <div className={`stock-info-banner ${stockDisponible === 0 ? 'stock-zero' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>
              Stock disponible: <strong>{stockDisponible} {stockDisponible === 1 ? 'unidad' : 'unidades'}</strong> | Costo unitario: ₡{costoUnitario.toLocaleString('es-CR')}
            </span>
          </div>
        )}

        {/* Acciones Footer */}
        <div className="modal-actions-footer">
          <button type="button" onClick={handleClose} className="btn-secondary-action">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary-action">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{isSubmitting ? 'Guardando...' : (pedidoToEdit ? 'Guardar Cambios' : 'Confirmar y Procesar Pedido')}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
