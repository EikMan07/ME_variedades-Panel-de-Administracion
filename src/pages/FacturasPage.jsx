import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import FacturasKPIs from '../components/facturas/FacturasKPIs';
import FacturasTabs from '../components/facturas/FacturasTabs';
import FacturasGrid from '../components/facturas/FacturasGrid';
import ModalNuevaFactura from '../components/facturas/ModalNuevaFactura';
import ModalPreviewFactura from '../components/facturas/ModalPreviewFactura';
import Modal from '../components/common/Modal';
import { useFacturas } from '../context/FacturasContext';
import { useToast } from '../components/common/Toast';
import '../styles/facturas.css';

/**
 * Página principal del módulo de Facturas y Comprobantes.
 * Gestión digital de facturas de pedidos, comprobantes de cobros/pagos y préstamos.
 */
export default function FacturasPage() {
  const { facturas, eliminarFactura, filtrarFacturas, calcularKPIsFacturas } = useFacturas();
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroFecha, setFiltroFecha] = useState('todas');

  // Modales
  const [isModalNuevaOpen, setIsModalNuevaOpen] = useState(false);
  const [clientePreseleccionado, setClientePreseleccionado] = useState(null);
  const [facturaPreview, setFacturaPreview] = useState(null);
  const [facturaToDelete, setFacturaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const kpis = calcularKPIsFacturas();

  const facturasFiltradas = useMemo(() => {
    return filtrarFacturas(facturas, {
      busqueda,
      filtroCategoria,
      filtroFecha,
    });
  }, [facturas, busqueda, filtroCategoria, filtroFecha, filtrarFacturas]);

  const handleOpenCreate = (cliente = null) => {
    setClientePreseleccionado(cliente);
    setIsModalNuevaOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facturaToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      const res = await eliminarFactura(
        facturaToDelete.id,
        facturaToDelete.archivo_url || facturaToDelete.archivo_data
      );

      if (res.success) {
        showToast('Comprobante y archivo eliminados permanentemente de Supabase.', 'success');
        setFacturaToDelete(null);
      } else {
        showToast(res.error || 'No se pudo eliminar el comprobante de Supabase.', 'error');
      }
    } catch (err) {
      console.error('Error al confirmar eliminación:', err);
      showToast('Error inesperado al eliminar el comprobante.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setFiltroCategoria('todas');
    setFiltroFecha('todas');
  };

  return (
    <>
      <Topbar
        breadcrumb="Facturas y Comprobantes"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => handleOpenCreate(null)}
            id="btn-abrir-modal-nueva-factura"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nueva Factura / Comprobante</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado del Módulo */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / Finanzas / <strong>Facturas y Comprobantes</strong>
            </span>
            <h1 className="page-main-heading">Archivo de Facturas y Comprobantes</h1>
            <p className="page-sub-heading">
              Digitalización, previsualización y almacenamiento centralizado de documentos, facturas y recibos.
            </p>
          </div>

          <div className="client-summary-chips header-stat-badges">
            <div className="summary-chip stat-badge-item">
              <span className="chip-label stat-badge-label">TOTAL ARCHIVOS</span>
              <span className="chip-val stat-badge-value" id="chip-total-facturas">
                {facturas.length}
              </span>
            </div>
          </div>
        </section>

        {/* Tarjetas KPIs Superiores */}
        <FacturasKPIs />

        {/* Pestañas y Filtros */}
        <FacturasTabs
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroCategoria={filtroCategoria}
          setFiltroCategoria={setFiltroCategoria}
          filtroFecha={filtroFecha}
          setFiltroFecha={setFiltroFecha}
          onReset={handleResetFilters}
        />

        {/* Cuadrícula de Facturas */}
        <FacturasGrid
          facturas={facturasFiltradas}
          onVerPreview={(f) => setFacturaPreview(f)}
          onEliminar={(f) => setFacturaToDelete(f)}
          onCrear={() => handleOpenCreate(null)}
          onCrearParaCliente={(cliente) => handleOpenCreate(cliente)}
        />
      </main>

      {/* Modal: Nueva Factura / Comprobante */}
      <ModalNuevaFactura
        isOpen={isModalNuevaOpen}
        onClose={() => {
          setIsModalNuevaOpen(false);
          setClientePreseleccionado(null);
        }}
        clientePreseleccionado={clientePreseleccionado}
      />

      {/* Modal: Lightbox de Previsualización */}
      <ModalPreviewFactura
        isOpen={!!facturaPreview}
        onClose={() => setFacturaPreview(null)}
        factura={facturaPreview}
      />

      {/* Modal: Confirmación de Eliminación */}
      <Modal
        isOpen={!!facturaToDelete}
        onClose={() => setFacturaToDelete(null)}
        title="¿Eliminar Comprobante?"
        subtitle="Esta acción no se puede deshacer"
        cardClassName="modal-card-danger"
        icon={
          <div className="icon-circle-badge coral-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              onClick={() => setFacturaToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              id="btn-confirmar-eliminar-factura"
            >
              {isDeleting ? (
                <span>Eliminando de Supabase...</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Sí, Eliminar</span>
                </>
              )}
            </button>
          </>
        }
      >
        <p className="confirm-message">
          ¿Estás segura de que deseas eliminar el comprobante &quot;{facturaToDelete?.archivo_nombre}&quot; asociado a &quot;{facturaToDelete?.cliente_nombre}&quot;?
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-texto-secundario)' }}>
          El archivo adjunto se borrará permanentemente de la plataforma.
        </p>
      </Modal>
    </>
  );
}
