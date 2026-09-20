import {
  formatMoneda,
  formatFecha,
  calcularDiasRestantes,
  getEstadoBadge,
  calcularPorcentajeRetorno,
  getProgressClass
} from './prestamosUtils';
import Modal from '../common/Modal';
import { calcularMoratoriaElemento, formatearMoneda } from '../../utils/utils';

/**
 * Modal para ver la tabla de amortización, términos e historial de abonos de un préstamo.
 * RF-42, RF-43 y RF-44.
 */
export default function ModalAmortizacionPrestamo({ isOpen, onClose, prestamo }) {
  if (!prestamo) return null;

  const estadoBadge = getEstadoBadge(prestamo);
  const porcentaje = calcularPorcentajeRetorno(prestamo);
  const progressClass = getProgressClass(prestamo);
  const diasInfo = calcularDiasRestantes(prestamo.fecha_limite);
  const totalAbonado = Math.max(0, prestamo.monto_total - (prestamo.saldo_pendiente || 0));
  const calculoMora = calcularMoratoriaElemento(prestamo);

  const iconoModal = (
    <div className="icon-circle-badge slate-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle y Amortización del Préstamo"
      subtitle={`Beneficiario: ${prestamo.beneficiario_nombre}`}
      icon={iconoModal}
      cardClassName="modal-card-lg"
      footer={
        <button type="button" className="btn-secondary-action" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {/* Resumen Principal */}
      <div className="amortizacion-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-texto-principal)' }}>
              {prestamo.beneficiario_nombre}
            </span>
            <span className={`badge-prestamo ${estadoBadge.className}`}>
              {estadoBadge.label}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
            Tel: {prestamo.beneficiario_telefono} • {prestamo.es_cliente_registrado ? 'Cliente Registrado' : 'Tercero Externo'}
          </span>
        </div>

        <div className="amortizacion-stats">
          <div className="amortizacion-stat-item">
            <span className="amortizacion-stat-label">Total a Devolver</span>
            <span className="amortizacion-stat-val" style={{ color: 'var(--color-dorado)' }}>
              {formatMoneda(prestamo.monto_total)}
            </span>
          </div>
          <div className="amortizacion-stat-item">
            <span className="amortizacion-stat-label">Saldo Pendiente</span>
            <span
              className="amortizacion-stat-val"
              style={{ color: prestamo.saldo_pendiente <= 0 ? '#f4b4c8' : '#e06070' }}
            >
              {formatMoneda(prestamo.saldo_pendiente)}
            </span>
          </div>
          {calculoMora.moraTotal > 0 && (
            <div className="amortizacion-stat-item">
              <span className="amortizacion-stat-label" style={{ color: '#fb7185' }}>Mora Acumulada</span>
              <span className="amortizacion-stat-val" style={{ color: '#fb7185', fontWeight: 800 }}>
                +{formatMoneda(calculoMora.moraTotal)}
              </span>
            </div>
          )}
          {calculoMora.moraTotal > 0 && (
            <div className="amortizacion-stat-item">
              <span className="amortizacion-stat-label" style={{ color: '#f59e0b' }}>Total Exigible (con mora)</span>
              <span className="amortizacion-stat-val" style={{ color: '#f59e0b', fontWeight: 800 }}>
                {formatMoneda(calculoMora.saldoTotalConMora)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progreso de Retorno */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--color-texto-secundario)' }}>Progreso de retorno de capital e intereses</span>
          <span style={{ fontWeight: 600, color: 'var(--color-texto-principal)' }}>
            {porcentaje}% retornado ({formatMoneda(totalAbonado)} de {formatMoneda(prestamo.monto_total)})
          </span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            className={`progress-bar-fill ${progressClass}`}
            style={{ width: `${porcentaje}%`, height: '100%' }}
          ></div>
        </div>
      </div>

      {/* Términos Financieros Acordados */}
      <div className="calculator-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="calculator-item">
          <span className="calculator-item-label">Capital Base</span>
          <span className="calculator-item-val">{formatMoneda(prestamo.monto_capital)}</span>
        </div>
        <div className="calculator-item">
          <span className="calculator-item-label">Tasa de Interés</span>
          <span className="calculator-item-val val-green">
            {prestamo.tasa_interes}% (+{formatMoneda(prestamo.monto_interes)})
          </span>
        </div>
        <div className="calculator-item">
          <span className="calculator-item-label">Modalidad / Plazo</span>
          <span className="calculator-item-val" style={{ fontSize: '0.9rem' }}>
            {prestamo.frecuencia_pago}
          </span>
        </div>
        {Number(prestamo.moratoria_monto) > 0 && (
          <div className="calculator-item">
            <span className="calculator-item-label">Moratoria por Atraso</span>
            <span className="calculator-item-val" style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
              {formatMoneda(prestamo.moratoria_monto)} / {prestamo.moratoria_tipo || 'semana'}
            </span>
          </div>
        )}
      </div>

      {/* Fechas */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
        <div>
          Fecha de entrega: <strong style={{ color: 'var(--color-texto-principal)' }}>{formatFecha(prestamo.fecha_entrega)}</strong>
        </div>
        <div>
          Fecha límite: <strong style={{ color: diasInfo.atrasado && prestamo.saldo_pendiente > 0 ? '#e06070' : 'var(--color-texto-principal)' }}>
            {formatFecha(prestamo.fecha_limite)}
          </strong>{' '}
          ({diasInfo.texto})
        </div>
      </div>

      {prestamo.notas && (
        <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--color-texto-apagado)' }}>Notas: </span>
          <span style={{ color: 'var(--color-texto-principal)' }}>{prestamo.notas}</span>
        </div>
      )}

      {/* Cronograma de Cuotas Acordadas si existen */}
      {prestamo.cuotas && prestamo.cuotas.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
            Cronograma de Cuotas Acordadas ({prestamo.num_plazos || prestamo.cuotas.length} plazos • {prestamo.tipo_plazo || prestamo.frecuencia_pago})
          </label>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-texto-secundario)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>#</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Fecha Vencimiento</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Monto Acordado</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Ref. Calculada</th>
                </tr>
              </thead>
              <tbody>
                {prestamo.cuotas.map((c, idx) => {
                  const numC = c.numeroCuota || idx + 1;
                  const moraCuota = calculoMora.cuotasConMora.find(m => m.numeroCuota === numC);
                  return (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--color-dorado, #f59e0b)' }}>
                        Cuota #{numC}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#fff' }}>
                        {formatFecha(c.fechaVencimiento)}
                        {moraCuota && (
                          <span style={{
                            display: 'inline-block',
                            marginLeft: '8px',
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(244, 63, 94, 0.18)',
                            color: '#fb7185',
                            fontWeight: 600
                          }}>
                            {moraCuota.diasAtraso}d atraso • +{formatMoneda(moraCuota.montoMora)} mora
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                        {formatMoneda(c.montoRealAcordado || c.monto)}
                        {moraCuota && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>
                            Total: {formatMoneda(moraCuota.montoTotalExigible)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--color-texto-apagado)', fontSize: '0.78rem' }}>
                        {formatMoneda(c.montoSugerido || c.monto)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de Abonos */}
      <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
        Historial de Abonos y Amortizaciones
      </label>

      {prestamo.abonos && prestamo.abonos.length > 0 ? (
        <div className="historial-timeline">
          {prestamo.abonos.map((a) => (
            <div key={a.id} className="historial-timeline-item">
              <div className="historial-item-left">
                <div className="historial-item-meta">
                  <span className="historial-item-date">{formatFecha(a.fecha)}</span>
                  <span className={`abono-destino-tag destino-${a.destino || 'general'}`}>
                    {a.destino === 'capital' ? 'A Capital' : a.destino === 'interes' ? 'A Interés' : 'Abono General'}
                  </span>
                </div>
                {a.nota && <span className="historial-item-nota">{a.nota}</span>}
              </div>

              <div className="historial-item-right">
                <span className="historial-item-amount">+{formatMoneda(a.monto)}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-apagado)' }}>
                  Abono #{a.id}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-texto-apagado)', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
          Sin abonos registrados aún para este préstamo.
        </div>
      )}
    </Modal>
  );
}
