import Modal from '../common/Modal';

export default function ClientBlockedModal({ isOpen, onClose, client, motivos = [] }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminación No Permitida"
      subtitle="Regla de integridad comercial"
      cardClassName="modal-card-warning"
      icon={
        <div className="icon-circle-badge warning-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
      }
      footer={
        <button type="button" className="btn-primary-action" onClick={onClose}>
          Entendido
        </button>
      }
    >
      <div className="modal-body-content" style={{ padding: 0 }}>
        <p className="warning-text-lead">
          No es posible eliminar a &quot;{client?.nombre_completo}&quot; debido a que mantiene registros activos con la empresa:
        </p>

        <div className="active-relations-box">
          {motivos.map((m, idx) => (
            <div key={idx} className="relation-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{m}</span>
            </div>
          ))}
        </div>

        <p className="note-explanation">
          Para poder dar de baja a un cliente, es necesario que sus pedidos hayan sido completados, sus cobros estén al día y sus préstamos se encuentren totalmente cancelados.
        </p>
      </div>
    </Modal>
  );
}
