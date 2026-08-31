import { useCobros } from '../../context/CobrosContext';
import { formatMoneda, formatFecha, getBadgeAntiguedad, getMetodoInfo } from './cobrosUtils';
import Modal from '../common/Modal';

/**
 * Modal con vista de historial detallado de cobros por cliente.
 * RF-24 y RF-25.
 */
export default function ModalHistorialCliente({ isOpen, onClose, cobroSeleccionado }) {
  const { obtenerHistorialCliente } = useCobros();

  if (!cobroSeleccionado) return null;

  const historial = obtenerHistorialCliente(cobroSeleccionado.cliente_id);
  const totalCobradoCliente = historial.reduce((sum, c) => sum + (Number(c.monto_cobrado) || 0), 0);

  const iconoHistorial = (
    <div className="icon-circle-badge slate-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Cobros"
      subtitle={`Movimientos registrados de ${cobroSeleccionado.cliente_nombre}`}
      icon={iconoHistorial}
      cardClassName="modal-card-lg"
      footer={
        <button type="button" className="btn-secondary-action" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {/* Resumen del Cliente */}
      <div className="historial-cliente-header">
        <div className="historial-cliente-profile">
          <div className="cobro-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>
            {(cobroSeleccionado.cliente_nombre || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-texto-principal)', display: 'block' }}>
              {cobroSeleccionado.cliente_nombre}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
              Tel: {cobroSeleccionado.cliente_telefono || 'No especificado'}
            </span>
          </div>
        </div>

        <div className="historial-stats-chips">
          <div className="historial-stat-item">
            <span className="historial-stat-label">Total Cobrado</span>
            <span className="historial-stat-value" style={{ color: '#88c985' }}>
              {formatMoneda(totalCobradoCliente)}
            </span>
          </div>
          <div className="historial-stat-item">
            <span className="historial-stat-label">Cobros Realizados</span>
            <span className="historial-stat-value">
              {historial.length} {historial.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista / Timeline de Cobros */}
      <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
        Registro cronológico de cobros
      </label>

      {historial.length > 0 ? (
        <div className="historial-timeline">
          {historial.map((c) => {
            const badgeAntiguedad = getBadgeAntiguedad(c.fecha_cobro);
            const metodoInfo = getMetodoInfo(c.metodo_cobro);

            return (
              <div key={c.id} className="historial-timeline-item">
                <div className="historial-item-left">
                  <div className="historial-item-meta">
                    <span className="historial-item-date">
                      {formatFecha(c.fecha_cobro)}
                    </span>
                    <span className={`badge-antiguedad ${badgeAntiguedad.className}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                      {badgeAntiguedad.texto}
                    </span>
                    <span className={`badge-metodo ${metodoInfo.className}`}>
                      {metodoInfo.label}
                    </span>
                  </div>
                  <span className="historial-item-nota">
                    {c.concepto_nota}
                  </span>
                  {c.numero_recibo && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-texto-apagado)' }}>
                      Recibo / Referencia: {c.numero_recibo}
                    </span>
                  )}
                </div>

                <div className="historial-item-right">
                  <span className="historial-item-amount">
                    +{formatMoneda(c.monto_cobrado)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-texto-apagado)' }}>
                    ID #{c.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-texto-apagado)' }}>
          No hay cobros registrados para este cliente.
        </div>
      )}
    </Modal>
  );
}
