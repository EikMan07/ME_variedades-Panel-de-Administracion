import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import PagosKPIs from '../components/pagos/PagosKPIs';
import PagosFilters from '../components/pagos/PagosFilters';
import PagosTable from '../components/pagos/PagosTable';
import ModalRegistrarPago from '../components/pagos/ModalRegistrarPago';
import ModalAbono from '../components/pagos/ModalAbono';
import ModalDetallePago from '../components/pagos/ModalDetallePago';
import Modal from '../components/common/Modal';
import { usePagos } from '../context/PagosContext';
import { useToast } from '../components/common/Toast';
import '../styles/pagos.css';

/**
 * Pagina principal del modulo de Pagos y Cuentas por Cobrar.
 * RF-17 al RF-22.
 */
export default function PagosPage() {
  const { pagos, eliminarPago, filtrarPagos } = usePagos();
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modales
  const [isModalPagoOpen, setIsModalPagoOpen] = useState(false);
  const [pagoToEdit, setPagoToEdit] = useState(null);
  const [pagoAbono, setPagoAbono] = useState(null);
  const [pagoDetalle, setPagoDetalle] = useState(null);
  const [pagoToDelete, setPagoToDelete] = useState(null);

  const pagosFiltrados = useMemo(() =>
    filtrarPagos(pagos, { busqueda, filtroEstado }),
    [pagos, busqueda, filtroEstado, filtrarPagos]
  );

  const handleOpenCreate = () => {
    setPagoToEdit(null);
    setIsModalPagoOpen(true);
  };

  const handleEditar = (pago) => {
    setPagoToEdit(pago);
    setIsModalPagoOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!pagoToDelete) return;
    const res = eliminarPago(pagoToDelete.id);
    if (res.success) {
      showToast('Pago eliminado del registro.', 'success');
    }
    setPagoToDelete(null);
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setFiltroEstado('todos');
  };

  return (
    <>
      <Topbar
        breadcrumb="Pagos y Cuentas"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-modal-pago"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Registrar Pago</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado del Modulo */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / Finanzas / <strong>Pagos y Cuentas</strong>
            </span>
            <h1 className="page-main-heading">Gestion de Pagos y Cuentas</h1>
            <p className="page-sub-heading">
              Control de cuentas por cobrar, seguimiento de abonos y semaforo de vencimientos.
            </p>
          </div>

          <div className="client-summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Total Cuentas</span>
              <span className="chip-val" id="chip-total-pagos">{pagos.length}</span>
            </div>
            <div className="summary-chip chip-coral">
              <span className="chip-label">Con Saldo</span>
              <span className="chip-val" id="chip-con-saldo">
                {pagos.filter(p => p.saldo_pendiente > 0).length}
              </span>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <PagosKPIs />

        {/* Filtros */}
        <PagosFilters
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          onReset={handleResetFilters}
        />

        {/* Tabla de Pagos */}
        <PagosTable
          pagos={pagosFiltrados}
          onVerDetalle={(p) => setPagoDetalle(p)}
          onAbono={(p) => setPagoAbono(p)}
          onEditar={handleEditar}
          onEliminar={(p) => setPagoToDelete(p)}
          onCrear={handleOpenCreate}
        />
      </main>

      {/* Modal: Registrar / Editar Pago */}
      <ModalRegistrarPago
        isOpen={isModalPagoOpen}
        onClose={() => setIsModalPagoOpen(false)}
        pagoToEdit={pagoToEdit}
      />

      {/* Modal: Registrar Abono */}
      <ModalAbono
        isOpen={!!pagoAbono}
        onClose={() => setPagoAbono(null)}
        pago={pagoAbono}
      />

      {/* Modal: Detalle / Historial */}
      <ModalDetallePago
        isOpen={!!pagoDetalle}
        onClose={() => setPagoDetalle(null)}
        pago={pagoDetalle}
      />

      {/* Modal: Confirmacion de Eliminacion — RF-22 */}
      <Modal
        isOpen={!!pagoToDelete}
        onClose={() => setPagoToDelete(null)}
        title="Eliminar Registro de Pago"
        subtitle="Esta accion no se puede deshacer"
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
            <button type="button" className="btn-secondary-action" onClick={() => setPagoToDelete(null)}>
              Cancelar
            </button>
            <button type="button" className="btn-danger-action" onClick={handleConfirmDelete} id="btn-confirmar-eliminar-pago">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Si, Eliminar</span>
            </button>
          </>
        }
      >
        <p className="confirm-message">
          Estas segura de que deseas eliminar el registro de pago de
          &quot;{pagoToDelete?.cliente_nombre}&quot;?
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-texto-secundario)' }}>
          Se eliminara el historial de abonos asociado a esta cuenta.
        </p>
      </Modal>
    </>
  );
}
