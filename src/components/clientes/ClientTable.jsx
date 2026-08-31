import { useClients } from '../../context/ClientContext';

export default function ClientTable({
  clientes,
  onEdit,
  onDeleteRequest,
  onOpenCreate
}) {
  const { puedeEliminarse } = useClients();

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();
  const nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (clientes.length === 0) {
    return (
      <section className="card-glass table-container-card">
        <div id="clientes-empty-state" className="empty-state-card">
          <div className="empty-icon-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>Directorio de Clientes Listo</h3>
          <p>No se encontraron clientes con los filtros aplicados o aún no hay clientes registrados.</p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={onOpenCreate}
          >
            Registrar Primer Cliente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card-glass table-container-card">
      <div className="table-responsive">
        <table className="data-table" id="tabla-clientes">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Fecha de Cumpleaños</th>
              <th>Relación / Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => {
              const inicial = c.nombre_completo ? c.nombre_completo.charAt(0).toUpperCase() : 'C';

              const diaNum =
                c.dia_cumpleanos !== null && c.dia_cumpleanos !== undefined
                  ? Number(c.dia_cumpleanos)
                  : c.dia_cumple !== null && c.dia_cumple !== undefined
                  ? Number(c.dia_cumple)
                  : null;

              let mesNum = null;
              let mesNombre = '';
              const mesVal = c.mes_cumpleanos || c.mes_cumple || c.mes;

              if (mesVal !== null && mesVal !== undefined && mesVal !== '') {
                const parsedMes = parseInt(mesVal, 10);
                if (!isNaN(parsedMes) && parsedMes >= 1 && parsedMes <= 12) {
                  mesNum = parsedMes;
                  mesNombre = nombresMeses[parsedMes] || '';
                } else if (typeof mesVal === 'string') {
                  mesNombre = mesVal;
                  const idx = nombresMeses.findIndex(
                    (m) => m.toLowerCase() === mesVal.toLowerCase()
                  );
                  if (idx > 0) mesNum = idx;
                }
              }

              const esHoy = mesNum === mesActual && diaNum === diaActual;
              const verificacionEliminar = puedeEliminarse(c);

              let textoCumple = 'No registrado';
              if (diaNum && mesNombre) {
                textoCumple = `${diaNum} de ${mesNombre}`;
              } else if (diaNum) {
                textoCumple = `Día ${diaNum}`;
              } else if (mesNombre) {
                textoCumple = mesNombre;
              }

              let estadoPillHtml = (
                <span className="status-pill pill-clean">Sin deudas activas</span>
              );

              if (c.saldo_pendiente > 0 || c.estado_cuenta === 'con_saldo') {
                estadoPillHtml = (
                  <span className="status-pill pill-active">
                    {c.saldo_pendiente > 0
                      ? `Saldo: ₡${Number(c.saldo_pendiente).toLocaleString('es-CR')}`
                      : 'Con saldo pendiente'}
                  </span>
                );
              } else if (c.pedidos_activos > 0) {
                estadoPillHtml = (
                  <span className="status-pill pill-active">
                    {c.pedidos_activos} pedido(s) en curso
                  </span>
                );
              } else if (c.prestamos_abiertos > 0 || c.estado_cuenta === 'atrasado') {
                estadoPillHtml = (
                  <span className="status-pill pill-active">
                    {c.prestamos_abiertos > 0
                      ? `${c.prestamos_abiertos} préstamo(s)`
                      : 'Préstamo activo'}
                  </span>
                );
              }

              return (
                <tr key={c.id}>
                  <td>
                    <div className="client-info-cell">
                      <div className="client-avatar-circle">{inicial}</div>
                      <div>
                        <span className="client-name-text">{c.nombre_completo}</span>
                        <span className="client-id-text">
                          ID: CLI-{String(c.id).padStart(4, '0')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a
                      href={`tel:${c.telefono.replace(/[\s-]/g, '')}`}
                      className="phone-cell"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <span>{c.telefono}</span>
                    </a>
                  </td>
                  <td>
                    <div className={`birthday-cell ${esHoy ? 'today-badge' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                      </svg>
                      <span>
                        {textoCumple}{' '}
                        {esHoy ? '(¡Hoy!)' : ''}
                      </span>
                    </div>
                  </td>
                  <td>{estadoPillHtml}</td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="btn-table-action btn-action-edit"
                        onClick={() => onEdit(c)}
                        title="Editar Cliente"
                        aria-label="Editar Cliente"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`btn-table-action btn-action-delete ${!verificacionEliminar.puede ? 'is-blocked' : ''}`}
                        onClick={() => onDeleteRequest(c)}
                        title={
                          verificacionEliminar.puede
                            ? 'Eliminar Cliente'
                            : 'Eliminación bloqueada por actividad pendiente'
                        }
                        aria-label="Eliminar Cliente"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
