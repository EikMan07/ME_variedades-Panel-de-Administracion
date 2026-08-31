import { formatMoneda, formatFecha, getBadgeAntiguedad, getMetodoInfo } from './cobrosUtils';

/**
 * Tabla interactiva de cobros con semáforo de días transcurridos y acciones.
 * RF-24 y RF-25.
 */
export default function CobrosTable({
  cobros,
  onVerHistorial,
  onEditar,
  onEliminar,
  onCrear
}) {
  if (cobros.length === 0) {
    return (
      <div className="card-glass">
        <div className="cobros-empty-state">
          <div className="cobros-empty-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3>Registro de Cobros Listo</h3>
          <p>
            Aún no hay cobros registrados en la plataforma. Pulsa el botón para ingresar el primer cobro recibido en ME Variedades.
          </p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={onCrear}
            id="btn-empty-registrar-cobro"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Registrar Primer Cobro</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass table-container-card">
      <div className="table-responsive">
        <table className="data-table" aria-label="Tabla de registro y control de cobros">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Monto Cobrado</th>
              <th>Fecha del Cobro</th>
              <th>Días Transcurridos</th>
              <th>Método y Detalle</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cobros.map((cobro) => {
              const badgeAntiguedad = getBadgeAntiguedad(cobro.fecha_cobro);
              const metodoInfo = getMetodoInfo(cobro.metodo_cobro);

              const nombreCliente =
                cobro.cliente_nombre ||
                cobro.clientes?.nombre_completo ||
                cobro.cliente?.nombre_completo ||
                'Cliente registrado';
              const telCliente =
                cobro.cliente_telefono ||
                cobro.clientes?.telefono ||
                cobro.cliente?.telefono ||
                'Sin teléfono';

              return (
                <tr key={cobro.id}>
                  {/* Cliente */}
                  <td>
                    <div className="cobro-cliente-cell">
                      <div className="cobro-avatar" aria-hidden="true">
                        {nombreCliente.charAt(0).toUpperCase()}
                      </div>
                      <div className="cobro-cliente-info">
                        <span className="cobro-cliente-nombre">{nombreCliente}</span>
                        <span className="cobro-cliente-tel">{telCliente}</span>
                      </div>
                    </div>
                  </td>

                  {/* Monto Cobrado */}
                  <td>
                    <span className="cobro-monto-principal">
                      {formatMoneda(cobro.monto_cobrado)}
                    </span>
                  </td>

                  {/* Fecha del Cobro */}
                  <td>
                    <span className="fecha-cell">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatFecha(cobro.fecha_cobro)}
                    </span>
                  </td>

                  {/* Días Transcurridos (Semáforo Dinámico) */}
                  <td>
                    <span
                      className={`badge-antiguedad ${badgeAntiguedad.className}`}
                      title={badgeAntiguedad.descripcion}
                    >
                      {badgeAntiguedad.texto}
                    </span>
                  </td>

                  {/* Método y Detalle */}
                  <td>
                    <div className="cobro-concepto-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className={`badge-metodo ${metodoInfo.className}`}>
                          {metodoInfo.label}
                        </span>
                      </div>
                      <span className="cobro-concepto-text" title={cobro.concepto_nota}>
                        {cobro.concepto_nota}
                      </span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="text-right">
                    <div className="action-buttons-group">
                      {/* Ver Historial del Cliente */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title={`Ver historial de cobros de ${cobro.cliente_nombre}`}
                        onClick={() => onVerHistorial(cobro)}
                        id={`btn-historial-cobro-${cobro.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </button>

                      {/* Editar Cobro */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Editar cobro"
                        onClick={() => onEditar(cobro)}
                        id={`btn-editar-cobro-${cobro.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      {/* Eliminar Cobro */}
                      <button
                        type="button"
                        className="btn-table-action btn-action-delete"
                        title="Eliminar registro de cobro"
                        onClick={() => onEliminar(cobro)}
                        id={`btn-eliminar-cobro-${cobro.id}`}
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
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
