import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import CobrosKPIs from '../components/cobros/CobrosKPIs';
import CobrosFilters from '../components/cobros/CobrosFilters';
import CobrosTable from '../components/cobros/CobrosTable';
import ModalRegistrarCobro from '../components/cobros/ModalRegistrarCobro';
import ModalHistorialCliente from '../components/cobros/ModalHistorialCliente';
import Modal from '../components/common/Modal';
import { useCobros } from '../context/CobrosContext';
import { useToast } from '../components/common/Toast';
import { formatMoneda } from '../components/cobros/cobrosUtils';
import '../styles/cobros.css';

/**
 * Página principal del módulo de Registro y Control de Cobros.
 * Requerimientos RF-23 al RF-25.
 */
export default function CobrosPage() {
  const { cobros, eliminarCobro, filtrarCobros, calcularKPIsCobros } = useCobros();
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  const [filtroAntiguedad, setFiltroAntiguedad] = useState('todos');

  // Modales
  const [isModalCobroOpen, setIsModalCobroOpen] = useState(false);
  const [cobroToEdit, setCobroToEdit] = useState(null);
  const [cobroHistorial, setCobroHistorial] = useState(null);
  const [cobroToDelete, setCobroToDelete] = useState(null);

  const kpis = calcularKPIsCobros();

  const cobrosFiltrados = useMemo(() => {
    return filtrarCobros(cobros, {
      busqueda,
      filtroPeriodo,
      filtroMetodo,
      filtroAntiguedad,
    });
  }, [cobros, busqueda, filtroPeriodo, filtroMetodo, filtroAntiguedad, filtrarCobros]);

  const handleOpenCreate = () => {
    setCobroToEdit(null);
    setIsModalCobroOpen(true);
  };

  const handleEditar = (cobro) => {
    setCobroToEdit(cobro);
    setIsModalCobroOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!cobroToDelete) return;
    const res = eliminarCobro(cobroToDelete.id);
    if (res.success) {
      showToast('Registro de cobro eliminado correctamente.', 'success');
    }
    setCobroToDelete(null);
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setFiltroPeriodo('todos');
    setFiltroMetodo('todos');
    setFiltroAntiguedad('todos');
  };

  return (
    <>
      <Topbar
        breadcrumb="Cobros"
        rightActions={
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleOpenCreate}
            id="btn-abrir-modal-cobro"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Nuevo Cobro</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado del Módulo */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / Finanzas / <strong>Cobros</strong>
            </span>
            <h1 className="page-main-heading">Registro y Control de Cobros</h1>
            <p className="page-sub-heading">
              Bitácora cronológica de cobros recibidos, seguimiento de periodicidad y días transcurridos.
            </p>
          </div>

          <div className="client-summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Total Cobros</span>
              <span className="chip-val" id="chip-total-cobros">
                {cobros.length}
              </span>
            </div>
            <div className="summary-chip chip-gold">
              <span className="chip-label">Cobrado Hoy</span>
              <span className="chip-val" id="chip-cobrado-hoy">
                {formatMoneda(kpis.montoCobradoHoy)}
              </span>
            </div>
          </div>
        </section>

        {/* Tarjetas KPIs Superiores */}
        <CobrosKPIs />

        {/* Filtros de Cobros */}
        <CobrosFilters
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroPeriodo={filtroPeriodo}
          setFiltroPeriodo={setFiltroPeriodo}
          filtroMetodo={filtroMetodo}
          setFiltroMetodo={setFiltroMetodo}
          filtroAntiguedad={filtroAntiguedad}
          setFiltroAntiguedad={setFiltroAntiguedad}
          onReset={handleResetFilters}
        />

        {/* Tabla de Cobros */}
        <CobrosTable
          cobros={cobrosFiltrados}
          onVerHistorial={(c) => setCobroHistorial(c)}
          onEditar={handleEditar}
          onEliminar={(c) => setCobroToDelete(c)}
          onCrear={handleOpenCreate}
        />
      </main>

      {/* Modal: Registrar / Editar Cobro (RF-23 y RF-25) */}
      <ModalRegistrarCobro
        isOpen={isModalCobroOpen}
        onClose={() => setIsModalCobroOpen(false)}
        cobroToEdit={cobroToEdit}
      />

      {/* Modal: Historial Detallado por Cliente (RF-24 y RF-25) */}
      <ModalHistorialCliente
        isOpen={!!cobroHistorial}
        onClose={() => setCobroHistorial(null)}
        cobroSeleccionado={cobroHistorial}
      />

      {/* Modal: Confirmación de Eliminación (RF-25) */}
      <Modal
        isOpen={!!cobroToDelete}
        onClose={() => setCobroToDelete(null)}
        title="¿Eliminar Registro de Cobro?"
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
              onClick={() => setCobroToDelete(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={handleConfirmDelete}
              id="btn-confirmar-eliminar-cobro"
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
          ¿Estás segura de que deseas eliminar el cobro de{' '}
          <strong>{cobroToDelete && formatMoneda(cobroToDelete.monto_cobrado)}</strong>{' '}
          realizado a &quot;{cobroToDelete?.cliente_nombre}&quot;?
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-texto-secundario)' }}>
          Esta acción afectará los cálculos de días transcurridos y el balance total recaudado.
        </p>
      </Modal>
    </>
  );
}
