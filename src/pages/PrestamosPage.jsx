import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import PrestamosKPIs from '../components/prestamos/PrestamosKPIs';
import PrestamosFilters from '../components/prestamos/PrestamosFilters';
import PrestamosTable from '../components/prestamos/PrestamosTable';
import ModalRegistrarPrestamo from '../components/prestamos/ModalRegistrarPrestamo';
import ModalAbonoPrestamo from '../components/prestamos/ModalAbonoPrestamo';
import ModalAmortizacionPrestamo from '../components/prestamos/ModalAmortizacionPrestamo';
import Modal from '../components/common/Modal';
import { usePrestamos } from '../context/PrestamosContext';
import { useToast } from '../components/common/Toast';
import { formatMoneda } from '../components/prestamos/prestamosUtils';
import '../styles/prestamos.css';

/**
 * Página principal del módulo de Gestión de Préstamos a Terceros.
 * Requerimientos RF-39 al RF-44 e Historia de Usuario HU-07.
 */
export default function PrestamosPage() {
  const { prestamos, eliminarPrestamo, filtrarPrestamos, calcularKPIsPrestamos } = usePrestamos();
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Modales
  const [isModalPrestamoOpen, setIsModalPrestamoOpen] = useState(false);
  const [prestamoToEdit, setPrestamoToEdit] = useState(null);
  const [prestamoAbono, setPrestamoAbono] = useState(null);
  const [prestamoAmortizacion, setPrestamoAmortizacion] = useState(null);
  const [prestamoToDelete, setPrestamoToDelete] = useState(null);

  const kpis = calcularKPIsPrestamos();

  const prestamosFiltrados = useMemo(() => {
    return filtrarPrestamos(prestamos, {
      busqueda,
      filtroEstado,
      filtroTipo,
    });
  }, [prestamos, busqueda, filtroEstado, filtroTipo, filtrarPrestamos]);

  const handleOpenCreate = () => {
    setPrestamoToEdit(null);
    setIsModalPrestamoOpen(true);
  };

  const handleEditar = (prestamo) => {
    setPrestamoToEdit(prestamo);
    setIsModalPrestamoOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!prestamoToDelete) return;
    const res = await eliminarPrestamo(prestamoToDelete.id);
    if (res.success) {
      showToast({ tipo: 'success', mensaje: 'Registro de préstamo eliminado correctamente de Supabase.' });
    } else {
      showToast({ tipo: 'error', mensaje: res.error || 'Error al eliminar el préstamo en Supabase.' });
    }
    setPrestamoToDelete(null);
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setFiltroEstado('todos');
    setFiltroTipo('todos');
  };

  return (
    <>
      <Topbar
        breadcrumb="Préstamos"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-modal-prestamo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Préstamo</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado del Módulo */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / Finanzas / <strong>Préstamos</strong>
            </span>
            <h1 className="page-main-heading">Gestión de Préstamos a Terceros</h1>
            <p className="page-sub-heading">
              Registro de créditos, cálculo automático de intereses, seguimiento de plazos y amortización.
            </p>
          </div>

          <div className="client-summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Total Préstamos</span>
              <span className="chip-val" id="chip-total-prestamos">
                {prestamos.length}
              </span>
            </div>
            <div className="summary-chip chip-coral">
              <span className="chip-label">Saldo por Cobrar</span>
              <span className="chip-val" id="chip-saldo-prestamos">
                {formatMoneda(kpis.saldoTotalPendiente)}
              </span>
            </div>
          </div>
        </section>

        {/* Tarjetas KPIs Superiores */}
        <PrestamosKPIs />

        {/* Filtros de Préstamos */}
        <PrestamosFilters
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroEstado={filtroEstado}
          setFiltroEstado={setFiltroEstado}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          onReset={handleResetFilters}
        />

        {/* Tabla de Préstamos */}
        <PrestamosTable
          prestamos={prestamosFiltrados}
          onAbono={(p) => setPrestamoAbono(p)}
          onVerAmortizacion={(p) => setPrestamoAmortizacion(p)}
          onEditar={handleEditar}
          onEliminar={(p) => setPrestamoToDelete(p)}
          onCrear={handleOpenCreate}
        />
      </main>

      {/* Modal: Registrar / Editar Préstamo (RF-39 al RF-41 y RF-44) */}
      <ModalRegistrarPrestamo
        isOpen={isModalPrestamoOpen}
        onClose={() => setIsModalPrestamoOpen(false)}
        prestamoToEdit={prestamoToEdit}
      />

      {/* Modal: Registrar Abono a Préstamo (RF-43) */}
      <ModalAbonoPrestamo
        isOpen={!!prestamoAbono}
        onClose={() => setPrestamoAbono(null)}
        prestamo={prestamoAbono}
      />

      {/* Modal: Amortización e Historial de Abonos (RF-43) */}
      <ModalAmortizacionPrestamo
        isOpen={!!prestamoAmortizacion}
        onClose={() => setPrestamoAmortizacion(null)}
        prestamo={prestamoAmortizacion}
      />

      {/* Modal: Confirmación de Eliminación (RF-44) */}
      <Modal
        isOpen={!!prestamoToDelete}
        onClose={() => setPrestamoToDelete(null)}
        title="¿Eliminar Registro de Préstamo?"
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
              onClick={() => setPrestamoToDelete(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={handleConfirmDelete}
              id="btn-confirmar-eliminar-prestamo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Sí, Eliminar</span>
            </button>
          </>
        }
      >
        <p className="confirm-message">
          ¿Estás segura de que deseas eliminar el préstamo de{' '}
          <strong>{prestamoToDelete && formatMoneda(prestamoToDelete.monto_capital)}</strong>{' '}
          otorgado a &quot;{prestamoToDelete?.beneficiario_nombre}&quot;?
        </p>
        {prestamoToDelete?.abonos && prestamoToDelete.abonos.length > 0 && (
          <p style={{ fontSize: '0.82rem', color: '#e06070', marginTop: '0.5rem', fontWeight: 500 }}>
            Advertencia: Este préstamo cuenta con {prestamoToDelete.abonos.length} abono(s) registrado(s) que también serán eliminados.
          </p>
        )}
      </Modal>
    </>
  );
}
