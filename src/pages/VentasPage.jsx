import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import ModalRegistrarVenta from '../components/ventas/ModalRegistrarVenta';
import Modal from '../components/common/Modal';
import { useVentas } from '../context/VentasContext';
import { useClients } from '../context/ClientContext';
import { useProducts } from '../context/ProductContext';
import { calcularMoratoriaElemento, formatearMoneda } from '../utils/utils';

export default function VentasPage() {
  const { ventas, eliminarVenta } = useVentas();
  const { clientes } = useClients();
  const { productos } = useProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalidadFiltro, setModalidadFiltro] = useState('TODAS'); // 'TODAS' | 'CONTADO' | 'CREDITO'
  const [showModal, setShowModal] = useState(false);
  const [ventaToEdit, setVentaToEdit] = useState(null);
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [ventaVerCuotas, setVentaVerCuotas] = useState(null);

  // Filtrado de ventas en tiempo real
  const ventasFiltradas = useMemo(() => {
    let result = ventas || [];

    // Filtro por modalidad
    if (modalidadFiltro === 'CONTADO') {
      result = result.filter(v => (v.tipo_venta || v.modalidad || 'Contado').toLowerCase() === 'contado');
    } else if (modalidadFiltro === 'CREDITO') {
      result = result.filter(v => (v.tipo_venta || v.modalidad || '').toLowerCase() === 'crédito' || (v.tipo_venta || v.modalidad || '').toLowerCase() === 'credito');
    }

    if (!searchQuery.trim()) return result;

    const q = searchQuery.toLowerCase().trim();
    return result.filter((v) => {
      const cliente = clientes.find((c) => Number(c.id) === Number(v.cliente_id));
      const producto = productos.find((pr) => Number(pr.id) === Number(v.producto_id));
      const nombreCliente = (v.clientes?.nombre_completo || v.cliente?.nombre_completo || cliente?.nombre_completo || '').toLowerCase();
      const nombreProducto = (v.productos?.nombre || v.producto?.nombre || producto?.nombre || '').toLowerCase();
      const codigoVta = `#vta-${String(v.id).padStart(4, '0')}`.toLowerCase();
      const codigoPed = `#ped-${String(v.id).padStart(4, '0')}`.toLowerCase();

      return nombreCliente.includes(q) || nombreProducto.includes(q) || codigoVta.includes(q) || codigoPed.includes(q);
    });
  }, [ventas, clientes, productos, searchQuery, modalidadFiltro]);

  const handleOpenCreate = () => {
    setVentaToEdit(null);
    setShowModal(true);
  };

  const handleOpenEdit = (venta) => {
    setVentaToEdit(venta);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setVentaToEdit(null);
  };

  const handleConfirmDelete = async () => {
    if (!ventaToDelete) return;
    await eliminarVenta(ventaToDelete.id);
    setVentaToDelete(null);
  };

  return (
    <>
      <Topbar
        breadcrumb="Gestión de Ventas"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-crear-venta"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nueva Venta</span>
          </button>
        }
      />

      <main className="pedidos-page-content ventas-page-content">
        {/* Cabecera del Módulo */}
        <div className="module-header-banner">
          <div>
            <h1 className="module-title">Gestión de Ventas</h1>
            <p className="module-subtitle">
              Registro comercial integral, venta de contado y a crédito con motor de cuotas automatizado para ME Variedades.
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
            <span>Nueva Venta</span>
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <section className="pedidos-filters-bar ventas-filters-bar">
          <div className="search-box-group">
            <svg className="search-icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por cliente, producto o código #VTA-0001..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filtros de modalidad */}
            <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setModalidadFiltro('TODAS')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: modalidadFiltro === 'TODAS' ? 'linear-gradient(135deg, #f4b4c8 0%, #d48b9f 100%)' : 'transparent',
                  color: modalidadFiltro === 'TODAS' ? '#121215' : '#a1a1aa',
                  fontWeight: modalidadFiltro === 'TODAS' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setModalidadFiltro('CONTADO')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: modalidadFiltro === 'CONTADO' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: modalidadFiltro === 'CONTADO' ? '#34d399' : '#a1a1aa',
                  fontWeight: modalidadFiltro === 'CONTADO' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Contado
              </button>
              <button
                type="button"
                onClick={() => setModalidadFiltro('CREDITO')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: modalidadFiltro === 'CREDITO' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: modalidadFiltro === 'CREDITO' ? '#f59e0b' : '#a1a1aa',
                  fontWeight: modalidadFiltro === 'CREDITO' ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Crédito
              </button>
            </div>

            <div className="counter-pill-badge">
              {ventas.length} {ventas.length === 1 ? 'venta registrada' : 'ventas registradas'}
            </div>
          </div>
        </section>

        {/* Contenedor Principal: Empty State o Tabla */}
        <section className="pedidos-table-container ventas-table-container">
          {ventas.length === 0 ? (
            <div className="orders-empty-state">
              <div className="empty-icon-circle" style={{ borderColor: 'rgba(244, 180, 200, 0.3)', background: 'rgba(244, 180, 200, 0.08)' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#f4b4c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h2 className="empty-heading">No hay ventas registradas</h2>
              <p className="empty-text">
                Aún no se han generado transacciones de venta. Registra una nueva venta de contado o a crédito asociándola a un cliente y producto en stock.
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
                <span>Registrar Primera Venta</span>
              </button>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              <table className="orders-data-table">
                <thead>
                  <tr>
                    <th>ID Venta</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Modalidad</th>
                    <th>Precio Venta</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center', width: '130px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="table-no-match">
                        No se encontraron ventas que coincidan con la búsqueda &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    ventasFiltradas.map((venta) => {
                      const cliente = clientes.find((c) => Number(c.id) === Number(venta.cliente_id));
                      const producto = productos.find((pr) => Number(pr.id) === Number(venta.producto_id));

                      const clienteNombre =
                        venta.clientes?.nombre_completo ||
                        venta.cliente?.nombre_completo ||
                        (cliente ? cliente.nombre_completo : 'Cliente no identificado');

                      const productoNombre =
                        venta.productos?.nombre ||
                        venta.producto?.nombre ||
                        (producto ? producto.nombre : 'Producto no disponible');

                      const precioVentaNum =
                        Number(venta.precio_venta_real ?? venta.total ?? venta.costo_total ?? 0);

                      const esCredito = (venta.tipo_venta || venta.modalidad || '').toLowerCase() === 'crédito' || (venta.tipo_venta || venta.modalidad || '').toLowerCase() === 'credito';
                      const numCuotas = venta.num_plazos || (venta.cuotas?.length) || 0;

                      const fechaRaw = venta.fecha_venta || venta.created_at || venta.fecha_registro;
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
                        <tr key={venta.id}>
                          <td>
                            <span className="order-id-badge" style={{ background: 'rgba(244, 180, 200, 0.1)', color: '#f4b4c8', borderColor: 'rgba(244, 180, 200, 0.25)' }}>
                              #VTA-{String(venta.id).padStart(4, '0')}
                            </span>
                          </td>
                          <td className="cell-client-name">{clienteNombre}</td>
                          <td className="cell-product-name">{productoNombre}</td>
                          <td>
                            {venta.cantidad} {venta.cantidad === 1 ? 'ud' : 'uds'}
                          </td>
                          <td>
                            {esCredito ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '16px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.25)'
                              }}>
                                <span>Crédito ({numCuotas}p)</span>
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '16px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.25)'
                              }}>
                                <span>Contado</span>
                              </span>
                            )}
                          </td>
                          <td className="cell-price" style={{ fontWeight: 700, color: '#fdf2f8' }}>
                            ₡{precioVentaNum.toLocaleString('es-CR')}
                          </td>
                          <td className="cell-date">{fechaTexto}</td>
                          <td>
                            <span className={`status-pill-active ${venta.estado === 'Entregado' ? 'status-entregado' : venta.estado === 'Cancelado' ? 'status-cancelado' : ''}`}>
                              <span className="status-dot" />
                              {venta.estado || 'Activo'}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                              {/* Ver cuotas si es crédito */}
                              {esCredito && venta.cuotas && venta.cuotas.length > 0 && (
                                <button
                                  type="button"
                                  className="btn-action-icon"
                                  title="Ver desglose de cuotas"
                                  onClick={() => setVentaVerCuotas(venta)}
                                  style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}
                                  aria-label="Ver cuotas"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn-action-icon edit"
                                title="Editar venta"
                                onClick={() => handleOpenEdit(venta)}
                                aria-label="Editar venta"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>

                              <button
                                type="button"
                                className="btn-action-icon delete"
                                title="Eliminar venta"
                                onClick={() => setVentaToDelete(venta)}
                                aria-label="Eliminar venta"
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

      {/* Modal de Creación / Edición de Venta */}
      <ModalRegistrarVenta
        isOpen={showModal}
        onClose={handleCloseModal}
        ventaToEdit={ventaToEdit}
      />

      {/* Modal Desglose de Cuotas de Crédito */}
      <Modal
        isOpen={Boolean(ventaVerCuotas)}
        onClose={() => setVentaVerCuotas(null)}
        title={`Plan de Cuotas: Venta #VTA-${String(ventaVerCuotas?.id || '').padStart(4, '0')}`}
        subtitle={`Modalidad a Crédito: ${ventaVerCuotas?.num_plazos || ventaVerCuotas?.cuotas?.length} cuotas fijas`}
        cardClassName="modal-card-md"
      >
        {ventaVerCuotas && (() => {
          const calculoMoraVenta = calcularMoratoriaElemento(ventaVerCuotas);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>Total Financiado</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#f4b4c8', fontSize: '1.05rem' }}>
                    ₡{Number(ventaVerCuotas.precio_venta_real || ventaVerCuotas.total || 0).toLocaleString('es-CR')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>Frecuencia</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#e4e4e7', textTransform: 'capitalize' }}>
                    {ventaVerCuotas.tipo_plazo || 'Semana'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#a1a1aa' }}>Total Cuotas</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#e4e4e7' }}>
                    {ventaVerCuotas.cuotas?.length || 0} pagos
                  </p>
                </div>
                {Number(ventaVerCuotas.moratoria_monto) > 0 && (
                  <div>
                    <span style={{ fontSize: '0.74rem', color: '#f59e0b' }}>Política Mora</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 600, color: '#f59e0b', fontSize: '0.85rem' }}>
                      ₡{Number(ventaVerCuotas.moratoria_monto).toLocaleString('es-CR')} / {ventaVerCuotas.moratoria_tipo || 'semana'}
                    </p>
                  </div>
                )}
                {calculoMoraVenta.moraTotal > 0 && (
                  <div>
                    <span style={{ fontSize: '0.74rem', color: '#fb7185' }}>Mora Acumulada</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#fb7185', fontSize: '1.05rem' }}>
                      +₡{calculoMoraVenta.moraTotal.toLocaleString('es-CR')}
                    </p>
                  </div>
                )}
                {calculoMoraVenta.moraTotal > 0 && (
                  <div>
                    <span style={{ fontSize: '0.74rem', color: '#f59e0b' }}>Total con Mora</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 800, color: '#f59e0b', fontSize: '1.05rem' }}>
                      ₡{calculoMoraVenta.saldoTotalConMora.toLocaleString('es-CR')}
                    </p>
                  </div>
                )}
              </div>

            <div style={{ overflowX: 'auto', maxHeight: '340px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#a1a1aa' }}>
                    <th style={{ padding: '8px 10px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Fecha Vencimiento</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Monto Cuota</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ref. Calculada</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(ventaVerCuotas.cuotas || []).map((c, idx) => {
                    const fueAjustado = c.montoSugerido && Number(c.monto) !== Number(c.montoSugerido);
                    const numC = c.numeroCuota || idx + 1;
                    const moraCuota = calculoMoraVenta.cuotasConMora.find(m => m.numeroCuota === numC);
                    return (
                      <tr key={numC} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f4b4c8' }}>
                          Cuota {numC}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#e4e4e7' }}>
                          {c.fechaVencimiento}
                          {moraCuota && (
                            <span style={{
                              display: 'inline-block',
                              marginLeft: '6px',
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(244, 63, 94, 0.18)',
                              color: '#fb7185',
                              fontWeight: 600
                            }}>
                              {moraCuota.diasAtraso}d atraso • +₡{moraCuota.montoMora.toLocaleString('es-CR')} mora
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                          ₡{Number(c.monto ?? c.montoRealAcordado ?? 0).toLocaleString('es-CR')}
                          {moraCuota && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>
                              Total: ₡{moraCuota.montoTotalExigible.toLocaleString('es-CR')}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#71717a', fontSize: '0.78rem' }}>
                          ₡{Number(c.montoSugerido || c.monto || 0).toLocaleString('es-CR')}
                          {fueAjustado && (
                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#eab308' }}>
                              (Ajuste manual)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: c.pagada ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: c.pagada ? '#34d399' : '#facc15'
                          }}>
                            {c.pagada ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setVentaVerCuotas(null)}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      <Modal
        isOpen={Boolean(ventaToDelete)}
        onClose={() => setVentaToDelete(null)}
        title="Eliminar Venta"
        subtitle={`¿Está seguro de eliminar la venta #VTA-${String(ventaToDelete?.id || '').padStart(4, '0')}? Esta acción no se puede deshacer.`}
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
            onClick={() => setVentaToDelete(null)}
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
            <span>Eliminar Venta</span>
          </button>
        </div>
      </Modal>
    </>
  );
}
