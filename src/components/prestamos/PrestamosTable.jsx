import {
  formatMoneda,
  formatFecha,
  calcularDiasRestantes,
  getEstadoBadge,
  calcularPorcentajeRetorno,
  getProgressClass
} from './prestamosUtils';

/**
 * Tabla interactiva de préstamos con cálculo de amortización y semáforo.
 * RF-42, RF-43 y RF-44.
 */
export default function PrestamosTable({
  prestamos,
  onAbono,
  onVerAmortizacion,
  onEditar,
  onEliminar,
  onCrear
}) {
  if (prestamos.length === 0) {
    return (
      <div className="card-glass">
        <div className="prestamos-empty-state">
          <div className="prestamos-empty-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <h3>Gestión de Préstamos Lista</h3>
          <p>
            Aún no hay préstamos registrados en el sistema. Pulsa el botón para registrar el primer préstamo de dinero a clientes o terceros en ME Variedades.
          </p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={onCrear}
            id="btn-empty-registrar-prestamo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Registrar Primer Préstamo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-glass table-container-card">
      <div className="table-responsive">
        <table className="data-table" aria-label="Tabla de préstamos a terceros">
          <thead>
            <tr>
              <th>Beneficiario</th>
              <th>Capital e Interés</th>
              <th>Monto Total y Saldo</th>
              <th>Plazo y Vencimiento</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prestamos.map((prestamo) => {
              const estadoBadge = getEstadoBadge(prestamo);
              const porcentajeRetorno = calcularPorcentajeRetorno(prestamo);
              const progressClass = getProgressClass(prestamo);
              const diasInfo = calcularDiasRestantes(prestamo.fecha_limite);
              const esLiquidado = prestamo.saldo_pendiente <= 0;

              const nombreBeneficiario =
                prestamo.beneficiario_nombre ||
                prestamo.clientes?.nombre_completo ||
                prestamo.cliente?.nombre_completo ||
                prestamo.nombre_tercero ||
                'Beneficiario';
              const telBeneficiario =
                prestamo.beneficiario_telefono ||
                prestamo.clientes?.telefono ||
                prestamo.cliente?.telefono ||
                prestamo.telefono ||
                'Sin teléfono';
              const esCliente = Boolean(prestamo.cliente_id || prestamo.clientes);

              return (
                <tr key={prestamo.id}>
                  {/* Beneficiario */}
                  <td>
                    <div className="prestamo-beneficiario-cell">
                      <div
                        className={`prestamo-avatar ${!esCliente ? 'prestamo-avatar-tercero' : ''}`}
                        aria-hidden="true"
                      >
                        {nombreBeneficiario.charAt(0).toUpperCase()}
                      </div>
                      <div className="prestamo-beneficiario-info">
                        <span className="prestamo-nombre">{nombreBeneficiario}</span>
                        <span className="prestamo-tel">{telBeneficiario}</span>
                        <span className={`badge-beneficiario-tag ${esCliente ? 'tag-cliente' : 'tag-tercero'}`}>
                          {esCliente ? 'Cliente Registrado' : 'Tercero'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Capital e Interés */}
                  <td>
                    <div className="prestamo-capital-cell">
                      <span className="prestamo-monto-principal">
                        {formatMoneda(prestamo.monto_capital)}
                      </span>
                      <span className="prestamo-tasa-badge">
                        Tasa: {prestamo.tasa_interes}% (+{formatMoneda(prestamo.monto_interes)})
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)' }}>
                        Entrega: {formatFecha(prestamo.fecha_entrega)}
                      </span>
                    </div>
                  </td>

                  {/* Monto Total y Saldo Pendiente */}
                  <td>
                    <div className="pagos-monto-cell">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className={`prestamo-saldo-amount ${esLiquidado ? 'saldo-liquidado' : 'saldo-activo'}`}>
                          {formatMoneda(prestamo.saldo_pendiente)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-apagado)' }}>
                          de {formatMoneda(prestamo.monto_total)}
                        </span>
                      </div>
                      <div className="progress-bar-wrapper" style={{ width: '100%' }}>
                        <div
                          className={`progress-bar-fill ${progressClass}`}
                          style={{ width: `${porcentajeRetorno}%` }}
                        ></div>
                      </div>
                      <span className="monto-label">
                        {porcentajeRetorno}% retornado
                      </span>
                    </div>
                  </td>

                  {/* Plazo y Vencimiento */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span className={`fecha-cell ${diasInfo.atrasado && !esLiquidado ? 'fecha-vencida' : ''}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {formatFecha(prestamo.fecha_limite)}
                      </span>
                      {!esLiquidado && (
                        <span style={{ fontSize: '0.72rem', color: diasInfo.atrasado ? '#e06070' : 'var(--color-texto-apagado)', fontWeight: diasInfo.atrasado ? 600 : 400 }}>
                          {diasInfo.texto} • {prestamo.frecuencia_pago}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td>
                    <span className={`badge-prestamo ${estadoBadge.className}`}>
                      {estadoBadge.label}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="text-right">
                    <div className="action-buttons-group">
                      {/* Registrar Abono */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title={esLiquidado ? 'Préstamo liquidado' : 'Registrar abono a capital o interés'}
                        onClick={() => onAbono(prestamo)}
                        disabled={esLiquidado}
                        style={{ opacity: esLiquidado ? 0.35 : 1 }}
                        id={`btn-abono-prestamo-${prestamo.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      </button>

                      {/* Ver Amortización / Historial */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Ver detalle y tabla de amortización"
                        onClick={() => onVerAmortizacion(prestamo)}
                        id={`btn-amortizacion-prestamo-${prestamo.id}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                      </button>

                      {/* Editar Términos */}
                      <button
                        type="button"
                        className="btn-table-action"
                        title="Editar términos del préstamo"
                        onClick={() => onEditar(prestamo)}
                        id={`btn-editar-prestamo-${prestamo.id}`}
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
                        title="Eliminar préstamo"
                        onClick={() => onEliminar(prestamo)}
                        id={`btn-eliminar-prestamo-${prestamo.id}`}
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
