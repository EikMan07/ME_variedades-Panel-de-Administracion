import { useState, useEffect } from 'react';
import { usePagos } from '../../context/PagosContext';
import { useToast } from '../common/Toast';
import Modal from '../common/Modal';
import { formatMoneda, formatFecha } from './pagosUtils';

/**
 * Modal para registrar un abono (pago parcial o total).
 * RF-19: Calcula automaticamente el saldo pendiente.
 * RF-22: Validacion de monto (no puede superar el saldo).
 */
export default function ModalAbono({ isOpen, onClose, pago }) {
  const { registrarAbono } = usePagos();
  const { showToast } = useToast();

  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [errorMonto, setErrorMonto] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setNota('');
      setErrorMonto('');
    }
  }, [isOpen, pago]);

  if (!pago) return null;

  const totalAbonado = pago.monto_total - (pago.saldo_pendiente || 0);
  const montoNum = Number(monto);
  const saldoDespues = monto ? Math.max(0, pago.saldo_pendiente - montoNum) : null;

  const handleMontoChange = (val) => {
    setMonto(val);
    const num = Number(val);
    if (val && (isNaN(num) || num <= 0)) {
      setErrorMonto('El monto del abono debe ser mayor a 0.');
    } else if (val && num > pago.saldo_pendiente) {
      setErrorMonto('El abono no puede superar el saldo pendiente.');
    } else {
      setErrorMonto('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || errorMonto) return;

    try {
      const resultado = await registrarAbono(pago.id, montoNum, nota);
      if (resultado && !resultado.success) {
        setErrorMonto(resultado.error || 'Error al registrar el abono.');
        return;
      }

      showToast({
        tipo: 'success',
        mensaje: 'Abono registrado exitosamente. Saldo actualizado.'
      });

      setMonto('');
      setNota('');
      setErrorMonto('');

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar abono:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el abono. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoAbono = (
    <div className="icon-circle-badge gold-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Abono"
      subtitle={`Cuenta de: ${pago.cliente_nombre}`}
      icon={iconoAbono}
      cardClassName="modal-card-md"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>Cancelar</button>
          <button
            type="submit"
            form="form-abono"
            className="btn-primary-action"
            id="btn-guardar-abono"
            disabled={!monto || !!errorMonto}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Confirmar Abono</span>
          </button>
        </>
      }
    >
      <form id="form-abono" onSubmit={handleSubmit} noValidate>
        {/* Resumen de saldo actual */}
        <div className="saldo-resumen-box">
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Monto Total</span>
            <span className="saldo-resumen-value">{formatMoneda(pago.monto_total)}</span>
          </div>
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Ya Abonado</span>
            <span className="saldo-resumen-value valor-verde">{formatMoneda(totalAbonado)}</span>
          </div>
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Saldo Pendiente</span>
            <span className="saldo-resumen-value valor-rojo">{formatMoneda(pago.saldo_pendiente)}</span>
          </div>
        </div>

        {/* Historial de abonos previos */}
        {pago.abonos && pago.abonos.length > 0 && (
          <div className="form-group">
            <label className="form-label">Historial de abonos anteriores</label>
            <div className="modal-abonos-list">
              {pago.abonos.map((a) => (
                <div key={a.id} className="abono-item">
                  <div className="abono-item-info">
                    <span className="abono-fecha">{formatFecha(a.fecha)}</span>
                    {a.nota && <span className="abono-nota">{a.nota}</span>}
                  </div>
                  <span className="abono-monto">+{formatMoneda(a.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monto del nuevo abono */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-monto-abono">
            Monto del Abono (₡) <span className="required-star">*</span>
          </label>
          <div className="input-icon-wrapper">
            <input
              id="input-monto-abono"
              type="number"
              min="1"
              max={pago.saldo_pendiente}
              step="1"
              className={`input-form ${errorMonto ? 'input-error' : ''}`}
              placeholder="0"
              value={monto}
              onChange={(e) => handleMontoChange(e.target.value)}
              autoFocus
            />
            <span className="input-icon-suffix">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </span>
          </div>
          {errorMonto && <span className="input-error-msg visible">{errorMonto}</span>}
          {saldoDespues !== null && !errorMonto && (
            <span style={{ fontSize: '0.78rem', color: saldoDespues === 0 ? '#88c985' : 'var(--color-texto-apagado)', marginTop: '0.25rem', display: 'block' }}>
              Saldo restante despues del abono: {formatMoneda(saldoDespues)}
              {saldoDespues === 0 && ' — Cuenta saldada'}
            </span>
          )}
        </div>

        {/* Nota del abono (opcional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-nota-abono">
            Nota del Abono (Opcional)
          </label>
          <input
            id="input-nota-abono"
            type="text"
            className="input-form"
            placeholder="Ej: Pago en efectivo, transferencia SINPE..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
