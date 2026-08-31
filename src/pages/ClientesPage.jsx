import { useState, useMemo } from 'react';
import Topbar from '../components/layout/Topbar';
import ClientFilters from '../components/clientes/ClientFilters';
import ClientTable from '../components/clientes/ClientTable';
import ClientModal from '../components/clientes/ClientModal';
import ClientBlockedModal from '../components/clientes/ClientBlockedModal';
import Modal from '../components/common/Modal';
import { useClients } from '../context/ClientContext';
import { useToast } from '../components/common/Toast';

export default function ClientesPage() {
  const { clientes, eliminarCliente, puedeEliminarse } = useClients();
  const { showToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [filtroMes, setFiltroMes] = useState('all');
  const [filtroActividad, setFiltroActividad] = useState('all');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  const [clientToDelete, setClientToDelete] = useState(null);
  const [blockedClient, setBlockedClient] = useState(null);
  const [blockedMotivos, setBlockedMotivos] = useState([]);

  // Filtrado reactivo en tiempo real de clientes (Requerimiento RF-12)
  const clientesFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    const cleanQ = q.replace(/[\s-]/g, '');

    return clientes.filter((c) => {
      // 1. Búsqueda por Nombre, Teléfono o ID (ej. CLI-0001)
      let coincideBusqueda = true;
      if (q) {
        const nombre = (c.nombre_completo || '').toLowerCase();
        const telefono = (c.telefono || '').replace(/[\s-]/g, '');
        const idRaw = String(c.id || '');
        const idFormatted = `cli-${idRaw.padStart(4, '0')}`.toLowerCase();

        coincideBusqueda =
          nombre.includes(q) ||
          telefono.includes(cleanQ) ||
          idFormatted.includes(q) ||
          idRaw === q;
      }

      // 2. Filtro por Mes de Cumpleaños
      let coincideMes = true;
      if (filtroMes !== 'all' && filtroMes !== 'todos') {
        const mesIndex = parseInt(filtroMes, 10);
        const mesCliente = Number(c.mes_cumpleanos || c.mes_cumple || c.mes);
        // Soporta índice 0..11 (0 = Enero) o 1..12
        coincideMes = mesCliente === (mesIndex + 1) || mesCliente === mesIndex;
      }

      // 3. Filtro por Estado de Cuenta
      let coincideActividad = true;
      const saldo = Number(c.saldo_pendiente) || 0;
      const prestamos = Number(c.prestamos_abiertos) || 0;

      if (filtroActividad === 'sin_deuda' || filtroActividad === 'al_dia') {
        coincideActividad = saldo === 0 && prestamos === 0;
      } else if (filtroActividad === 'con_saldo' || filtroActividad === 'pendiente') {
        coincideActividad = saldo > 0;
      } else if (filtroActividad === 'prestamo_activo') {
        coincideActividad = prestamos > 0;
      }

      return coincideBusqueda && coincideMes && coincideActividad;
    });
  }, [clientes, busqueda, filtroMes, filtroActividad]);

  // Resumen chips
  const cumpleanerosEsteMes = useMemo(() => {
    const mesActual = new Date().getMonth() + 1;
    return clientes.filter((c) => Number(c.mes_cumpleanos || c.mes_cumple || c.mes) === mesActual).length;
  }, [clientes]);

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cliente) => {
    setClientToEdit(cliente);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (cliente) => {
    const verificacion = puedeEliminarse(cliente);
    if (!verificacion.puede) {
      setBlockedClient(cliente);
      setBlockedMotivos(verificacion.motivos);
    } else {
      setClientToDelete(cliente);
    }
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    const res = eliminarCliente(clientToDelete.id);
    if (res.success) {
      showToast('Cliente eliminado del directorio', 'success');
    }
    setClientToDelete(null);
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setFiltroMes('all');
    setFiltroActividad('all');
  };

  return (
    <>
      <Topbar
        breadcrumb="Clientes"
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
            <span>Nuevo Cliente</span>
          </button>
        }
      />

      <main className="dashboard-content">
        {/* Encabezado de Página */}
        <section className="page-title-section">
          <div>
            <span className="breadcrumb-text">
              Dashboard / <strong>Clientes</strong>
            </span>
            <h1 className="page-main-heading">Directorio de Clientes</h1>
            <p className="page-sub-heading">
              Gestión centralizada de contactos, fechas de cumpleaños y control de actividad.
            </p>
          </div>

          <div className="client-summary-chips">
            <div className="summary-chip">
              <span className="chip-label">Total Clientes</span>
              <span className="chip-val" id="chip-total-clientes">
                {clientes.length}
              </span>
            </div>
            <div className="summary-chip chip-gold">
              <span className="chip-label">Cumpleañeros este Mes</span>
              <span className="chip-val" id="chip-cumple-mes">
                {cumpleanerosEsteMes}
              </span>
            </div>
          </div>
        </section>

        {/* Filtros y Buscador Dedicado */}
        <ClientFilters
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtroMes={filtroMes}
          setFiltroMes={setFiltroMes}
          filtroActividad={filtroActividad}
          setFiltroActividad={setFiltroActividad}
          onReset={handleResetFilters}
        />

        {/* Tabla de Clientes */}
        <ClientTable
          clientes={clientesFiltrados}
          onEdit={handleEdit}
          onDeleteRequest={handleDeleteRequest}
          onOpenCreate={handleOpenCreate}
        />
      </main>

      {/* Modal: Registrar / Editar Cliente */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={clientToEdit}
      />

      {/* Modal: Bloqueo de Eliminación */}
      <ClientBlockedModal
        isOpen={!!blockedClient}
        onClose={() => setBlockedClient(null)}
        client={blockedClient}
        motivos={blockedMotivos}
      />

      {/* Modal: Confirmación de Eliminación */}
      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="¿Eliminar Cliente?"
        subtitle="Esta acción no se puede deshacer"
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
              onClick={() => setClientToDelete(null)}
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
              <span>Sí, Eliminar</span>
            </button>
          </>
        }
      >
        <p className="confirm-message">
          ¿Estás segura de que deseas eliminar permanentemente a &quot;{clientToDelete?.nombre_completo}&quot; del directorio?
        </p>
      </Modal>
    </>
  );
}
