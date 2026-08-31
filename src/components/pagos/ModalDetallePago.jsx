import { formatMoneda, formatFecha } from './pagosUtils';
import Modal from '../common/Modal';

/**
 * Modal para ver el detalle/historial de abonos de un pago.
 * RF-22: Vista de detalle con historial.
 */
export default function ModalDetallePago({ isOpen, onClose, pago }) {
  if (!pago) return null;
  const totalAbonado = pago.monto_total - (pago.saldo_pendiente || 0);
  const porcentaje = pago.monto_total > 0 ? Math.min(100, Math.round((totalAbonado / pago.monto_total) * 100)) : 100;

  const iconoDetalle = (
    <div className="icon-circle-badge slate-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Pago"
      subtitle="Historial completo de abonos"
      icon={iconoDetalle}
      cardClassName="modal-card-md"
      footer={
        <button type="button" className="btn-secondary-action" onClick={onClose}>Cerrar</button>
      }
    >
      <div className="saldo-resumen-box" style={{ marginBottom: '1.25rem' }}>
        <div className="saldo-resumen-item">
          <span className="saldo-resumen-label">Cliente</span>
          <span className="saldo-resumen-value" style={{ fontSize: '0.85rem' }}>{pago.cliente_nombre}</span>
        </div>
        <div className="saldo-resumen-item">
          <span className="saldo-resumen-label">Monto Total</span>
          <span className="saldo-resumen-value">{formatMoneda(pago.monto_total)}</span>
        </div>
        <div className="saldo-resumen-item">
          <span className="saldo-resumen-label">Saldo Pendiente</span>
          <span className={`saldo-resumen-value ${pago.saldo_pendiente <= 0 ? 'valor-verde' : 'valor-rojo'}`}>
            {formatMoneda(pago.saldo_pendiente)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>Progreso de pago</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)' }}>{porcentaje}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${porcentaje}%`,
            borderRadius: '3px',
            background: porcentaje === 100
              ? 'linear-gradient(90deg, #6e8f6b, #88c985)'
              : 'linear-gradient(90deg, var(--color-rosa-empolvado), var(--color-dorado))',
            transition: 'width 0.5s ease'
          }}></div>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-apagado)' }}>
          Concepto: <strong style={{ color: 'var(--color-texto-principal)' }}>{pago.concepto}</strong>
        </span>
      </div>
      {pago.fecha_acordada && (
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-texto-apagado)' }}>
            Fecha acordada: <strong style={{ color: 'var(--color-texto-principal)' }}>{formatFecha(pago.fecha_acordada)}</strong>
          </span>
        </div>
      )}

      <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Historial de Abonos</label>
      <div className="modal-abonos-list">
        {pago.abonos && pago.abonos.length > 0 ? (
          pago.abonos.map((a) => (
            <div key={a.id} className="abono-item">
              <div className="abono-item-info">
                <span className="abono-fecha">{formatFecha(a.fecha)}</span>
                {a.nota && <span className="abono-nota">{a.nota}</span>}
              </div>
              <span className="abono-monto">+{formatMoneda(a.monto)}</span>
            </div>
          ))
        ) : (
          <span className="abono-empty-msg">Sin abonos registrados aun.</span>
        )}
      </div>
    </Modal>
  );
}
