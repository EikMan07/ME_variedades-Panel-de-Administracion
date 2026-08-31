import { formatMoneda, formatFecha, calcularPorcentajePagado, getEstadoClass, getEstadoLabel, getProgressClass } from './pagosUtils';
import { calcularEstadoPago } from '../../context/PagosContext';

/**
 * Tabla responsiva de pagos y cuentas por cobrar.
 * RF-21: Semaforo visual automatico por estado.
 */
export default function PagosTable({ pagos, onVerDetalle, onAbono, onEditar, onEliminar, onCrear }) {
  if (pagos.length === 0) {
    return (
      <div className="card-glass">
        <div className="pagos-empty-state">
          <div className="pagos-empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
              <line x1="6" y1="15" x2="10" y2="15"></line>
              <line x1="6" y1="18" x2="8" y2="18"></line>
            </svg>
          </div>
          <h3>Modulo de Pagos Listo</h3>
          <p>
            Aun no hay cuentas por cobrar registradas. Pulsa el boton para ingresar el primer pago o cuenta de ME Variedades.
          </p>
          <button type="button" className="btn-primary-action" onClick={onCrear} id="btn-empty-registrar-pago">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Registrar primer pago</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass table-container-card">
      <div className="table-responsive">
        <table className="data-table" aria-label="Tabla de pagos y cuentas por cobrar">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Concepto / Origen</th>
              <th>Monto Total</th>
              <th>Saldo Pendiente</th>
              <th>Fecha Acordada</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => {
              const estadoClass = getEstadoClass(pago);
              const estadoLabel = getEstadoLabel(pago);
              const porcentaje = calcularPorcentajePagado(pago);
              const progressClass = getProgressClass(pago);
              const estadoValor = calcularEstadoPago(pago);
              const fechaClass = estadoValor === 'vencido' ? 'fecha-vencida' : estadoValor === 'proximo' ? 'fecha-proxima' : '';

              const nombreCliente =
                pago.cliente_nombre ||
                pago.clientes?.nombre_completo ||
                pago.cliente?.nombre_completo ||
                'Cliente registrado';
              const telCliente =
                pago.cliente_telefono ||
                pago.clientes?.telefono ||
                pago.cliente?.telefono ||
                'Sin teléfono';

              return (
                <tr key={pago.id}>
                  {/* Cliente */}
                  <td>
                    <div className="pago-cliente-cell">
                      <div className="pago-avatar" aria-hidden="true">
                        {nombreCliente.charAt(0).toUpperCase()}
                      </div>
                      <div className="pago-cliente-info">
                        <span className="pago-cliente-nombre">{nombreCliente}</span>
                        <span className="pago-cliente-tel">{telCliente}</span>
                      </div>
                    </div>
                  </td>

                  {/* Concepto */}
                  <td>
                    <div className="pago-concepto-cell">
                      <span className="pago-concepto-text" title={pago.concepto}>{pago.concepto}</span>
                      {pago.pedido_asociado && (
                        <span className="pago-pedido-tag">Pedido: {pago.pedido_asociado}</span>
                      )}
                    </div>
                  </td>

                  {/* Monto Total */}
                  <td>
                    <div className="pagos-monto-cell">
                      <span className="monto-principal">{formatMoneda(pago.monto_total)}</span>
                      <span className="monto-label">Total</span>
                    </div>
                  </td>

                  {/* Saldo Pendiente */}
                  <td>
                    <div className="pagos-monto-cell">
                      <span className={`monto-principal saldo-amount ${pago.saldo_pendiente <= 0 ? 'saldo-zero' : 'saldo-positivo'}`}>
                        {formatMoneda(pago.saldo_pendiente)}
                      </span>
                      <div className="progress-bar-wrapper">
                        <div className={`progress-bar-fill ${progressClass}`} style={{ width: `${porcentaje}%` }}></div>
                      </div>
                      <span className="monto-label">{porcentaje}% pagado</span>
                    </div>
                  </td>

                  {/* Fecha Acordada */}
                  <td>
                    <span className={`fecha-cell ${fechaClass}`}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {formatFecha(pago.fecha_acordada)}
                    </span>
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`estado-badge ${estadoClass}`}>{estadoLabel}</span>
                  </td>

                  {/* Acciones */}
                  <td className="text-right">
                    <div className="action-buttons-group">
                      {/* Ver detalle */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Ver historial de abonos"
                        onClick={() => onVerDetalle(pago)}
                        id={`btn-detalle-pago-${pago.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>

                      {/* Registrar abono (solo si hay saldo) */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title={pago.saldo_pendiente > 0 ? 'Registrar abono' : 'Cuenta saldada'}
                        onClick={() => onAbono(pago)}
                        disabled={pago.saldo_pendiente <= 0}
                        style={{ opacity: pago.saldo_pendiente <= 0 ? 0.4 : 1 }}
                        id={`btn-abono-pago-${pago.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Editar pago"
                        onClick={() => onEditar(pago)}
                        id={`btn-editar-pago-${pago.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        className="btn-table-action btn-action-delete"
                        title="Eliminar pago"
                        onClick={() => onEliminar(pago)}
                        id={`btn-eliminar-pago-${pago.id}`}
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
