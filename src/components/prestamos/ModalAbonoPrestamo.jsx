import { useState, useEffect } from 'react';
import { usePrestamos } from '../../context/PrestamosContext';
import { useToast } from '../common/Toast';
import { formatMoneda } from './prestamosUtils';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';

/**
 * Modal para registrar abono a un préstamo.
 * RF-43.
 */
export default function ModalAbonoPrestamo({ isOpen, onClose, prestamo }) {
  const { registrarAbono } = usePrestamos();
  const { showToast } = useToast();

  const [monto, setMonto] = useState('');
  const [destino, setDestino] = useState('general');
  const [nota, setNota] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [errorMonto, setErrorMonto] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMonto('');
      setDestino('general');
      setNota('');
      setFecha(new Date().toISOString().split('T')[0]);
      setErrorMonto('');
    }
  }, [isOpen, prestamo]);

  if (!prestamo) return null;

  const saldoActual = Number(prestamo.saldo_pendiente) || 0;
  const montoNum = Number(monto) || 0;
  const saldoRestanteDespues = monto ? Math.max(0, saldoActual - montoNum) : null;
  const totalAbonado = Math.max(0, prestamo.monto_total - saldoActual);

  const handleMontoChange = (val) => {
    setMonto(val);
    const num = Number(val);
    if (val && (isNaN(num) || num <= 0)) {
      setErrorMonto('El monto del abono debe ser mayor a 0.');
    } else if (val && num > saldoActual) {
      setErrorMonto('El abono no puede superar el saldo pendiente.');
    } else {
      setErrorMonto('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || errorMonto) return;

    try {
      const res = await registrarAbono(prestamo.id, {
        monto: montoNum,
        destino,
        nota,
        fecha
      });

      if (res && !res.success) {
        setErrorMonto(res.error || 'Error al registrar el abono.');
        return;
      }

      if (res && res.nuevoSaldo === 0) {
        showToast({
          tipo: 'success',
          mensaje: '¡Préstamo liquidado exitosamente al 100%!'
        });
      } else {
        showToast({
          tipo: 'success',
          mensaje: 'Abono registrado exitosamente. Saldo pendiente actualizado.'
        });
      }

      setMonto('');
      setNota('');
      setErrorMonto('');

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar abono del préstamo:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el abono. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoModal = (
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
      title="Registrar Abono a Préstamo"
      subtitle={`Beneficiario: ${prestamo.beneficiario_nombre}`}
      icon={iconoModal}
      cardClassName="modal-card-md"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-abono-prestamo"
            className="btn-primary-action"
            id="btn-confirmar-abono-prestamo"
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
      <form id="form-abono-prestamo" onSubmit={handleSubmit} noValidate>
        {/* Resumen del Préstamo */}
        <div className="saldo-resumen-box">
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Total a Devolver</span>
            <span className="saldo-resumen-value">{formatMoneda(prestamo.monto_total)}</span>
          </div>
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Ya Retornado</span>
            <span className="saldo-resumen-value valor-verde">{formatMoneda(totalAbonado)}</span>
          </div>
          <div className="saldo-resumen-item">
            <span className="saldo-resumen-label">Saldo Pendiente</span>
            <span className="saldo-resumen-value valor-rojo">{formatMoneda(saldoActual)}</span>
          </div>
        </div>

        {/* Monto del Abono */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-monto-abono-prestamo">
            Monto del Abono (₡) <span className="required-star">*</span>
          </label>
          <div className="input-icon-wrapper">
            <input
              id="input-monto-abono-prestamo"
              type="number"
              min="1"
              max={saldoActual}
              step="500"
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
          {saldoRestanteDespues !== null && !errorMonto && (
            <span
              style={{
                fontSize: '0.78rem',
                color: saldoRestanteDespues === 0 ? '#88c985' : 'var(--color-texto-apagado)',
                marginTop: '0.25rem',
                display: 'block',
                fontWeight: saldoRestanteDespues === 0 ? 600 : 400
              }}
            >
              Saldo restante después del abono: {formatMoneda(saldoRestanteDespues)}
              {saldoRestanteDespues === 0 && ' — ¡Préstamo quedará totalmente Liquidado!'}
            </span>
          )}
        </div>

        {/* Fila: Destino del Abono y Fecha */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="select-destino-abono">
              Destino / Aplicación del Abono
            </label>
            <select
              id="select-destino-abono"
              className="select-glass input-form"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            >
              <option value="general">Abono General a Deuda</option>
              <option value="capital">Abono directo a Capital</option>
              <option value="interes">Abono a Intereses</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-abono-prestamo">
              Fecha del Abono <span className="required-star">*</span>
            </label>
            <CustomDatePicker
              id="input-fecha-abono-prestamo"
              value={fecha}
              onChange={(val) => setFecha(val)}
              placeholder="Seleccionar fecha..."
            />
          </div>
        </div>

        {/* Nota / Detalle del Abono */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-nota-abono-prestamo">
            Nota o Comprobante (Opcional)
          </label>
          <input
            id="input-nota-abono-prestamo"
            type="text"
            className="input-form"
            placeholder="Ej: Pago en efectivo, transferencia SINPE, cuota acordada..."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
