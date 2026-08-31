import { useState, useEffect, useRef } from 'react';
import { useClients } from '../../context/ClientContext';
import { usePagos } from '../../context/PagosContext';
import { useToast } from '../common/Toast';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';

/**
 * Modal para registrar un nuevo pago o editar uno existente.
 * RF-17: Autocomplete de clientes.
 * RF-18: Fijar fecha limite.
 * RF-19: Monto total y calculo de saldo.
 */
export default function ModalRegistrarPago({ isOpen, onClose, pagoToEdit = null }) {
  const { clientes } = useClients();
  const { agregarPago, editarPago } = usePagos();
  const { showToast } = useToast();

  const esEdicion = !!pagoToEdit;

  const initialForm = {
    clienteBusqueda: '',
    cliente_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    concepto: '',
    pedido_asociado: '',
    monto_total: '',
    fecha_acordada: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const autocompleteRef = useRef(null);

  // Poblar formulario al editar
  useEffect(() => {
    if (isOpen) {
      if (pagoToEdit) {
        setForm({
          clienteBusqueda: pagoToEdit.cliente_nombre || '',
          cliente_id: pagoToEdit.cliente_id || '',
          cliente_nombre: pagoToEdit.cliente_nombre || '',
          cliente_telefono: pagoToEdit.cliente_telefono || '',
          concepto: pagoToEdit.concepto || '',
          pedido_asociado: pagoToEdit.pedido_asociado || '',
          monto_total: pagoToEdit.monto_total || '',
          fecha_acordada: pagoToEdit.fecha_acordada || '',
        });
      } else {
        setForm(initialForm);
      }
      setErrores({});
    }
  }, [isOpen, pagoToEdit]);

  // Cerrar autocomplete al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClienteSearch = (valor) => {
    setForm(prev => ({ ...prev, clienteBusqueda: valor, cliente_id: '', cliente_nombre: '', cliente_telefono: '' }));
    if (valor.trim().length >= 1) {
      const q = valor.toLowerCase();
      const filtrados = clientes.filter(c =>
        c.nombre_completo.toLowerCase().includes(q) ||
        c.telefono.replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, ''))
      ).slice(0, 6);
      setClientesFiltrados(filtrados);
      setShowAutocomplete(filtrados.length > 0);
    } else {
      setShowAutocomplete(false);
    }
    if (errores.cliente_id) setErrores(prev => ({ ...prev, cliente_id: null }));
  };

  const seleccionarCliente = (cliente) => {
    setForm(prev => ({
      ...prev,
      clienteBusqueda: cliente.nombre_completo,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_completo,
      cliente_telefono: cliente.telefono,
    }));
    setShowAutocomplete(false);
    setErrores(prev => ({ ...prev, cliente_id: null }));
  };

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores(prev => ({ ...prev, [campo]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const datos = {
      cliente_id: form.cliente_id,
      cliente_nombre: form.cliente_nombre,
      cliente_telefono: form.cliente_telefono,
      concepto: form.concepto,
      pedido_asociado: form.pedido_asociado,
      monto_total: form.monto_total,
      fecha_acordada: form.fecha_acordada,
    };

    try {
      let resultado;
      if (esEdicion) {
        resultado = await editarPago(pagoToEdit.id, datos);
      } else {
        resultado = await agregarPago(datos);
      }

      if (resultado && !resultado.success) {
        setErrores(resultado.errores || {});
        return;
      }

      showToast({
        tipo: 'success',
        mensaje: esEdicion ? 'Pago actualizado exitosamente.' : 'Pago registrado exitosamente.'
      });

      setForm(initialForm);
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar pago:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el pago. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoPago = (
    <div className="icon-circle-badge rose-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Pago' : 'Registrar Pago'}
      subtitle={esEdicion ? 'Modifica los datos de la cuenta por cobrar' : 'Nueva cuenta por cobrar en ME Variedades'}
      icon={iconoPago}
      cardClassName="modal-card-lg"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>Cancelar</button>
          <button type="submit" form="form-pago" className="btn-primary-action" id="btn-guardar-pago">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>{esEdicion ? 'Guardar Cambios' : 'Registrar Pago'}</span>
          </button>
        </>
      }
    >
      <form id="form-pago" onSubmit={handleSubmit} noValidate>
        {/* Cliente — RF-17 Autocomplete */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-cliente-pago">
            Cliente <span className="required-star">*</span>
          </label>
          <div className="autocomplete-wrapper" ref={autocompleteRef}>
            <input
              id="input-cliente-pago"
              type="text"
              className={`input-form ${errores.cliente_id ? 'input-error' : ''}`}
              placeholder="Buscar cliente por nombre o telefono..."
              value={form.clienteBusqueda}
              onChange={(e) => handleClienteSearch(e.target.value)}
              autoComplete="off"
            />
            {showAutocomplete && (
              <div className="autocomplete-list" role="listbox">
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.id}
                    className="autocomplete-item"
                    role="option"
                    onClick={() => seleccionarCliente(c)}
                  >
                    <div className="autocomplete-avatar">{c.nombre_completo.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="autocomplete-nombre">{c.nombre_completo}</div>
                      <div className="autocomplete-tel">{c.telefono}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errores.cliente_id && <span className="input-error-msg visible">{errores.cliente_id}</span>}
          {clientes.length === 0 && (
            <span className="input-error-msg visible" style={{ color: 'var(--color-advertencia)' }}>
              No hay clientes registrados. Registra un cliente primero desde el modulo de Clientes.
            </span>
          )}
        </div>

        {/* Concepto */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-concepto-pago">
            Concepto / Descripcion <span className="required-star">*</span>
          </label>
          <input
            id="input-concepto-pago"
            type="text"
            className={`input-form ${errores.concepto ? 'input-error' : ''}`}
            placeholder="Ej: Deuda por compra de ropa, saldo de pedido #5..."
            value={form.concepto}
            onChange={(e) => handleChange('concepto', e.target.value)}
          />
          {errores.concepto && <span className="input-error-msg visible">{errores.concepto}</span>}
        </div>

        <div className="form-row-2col">
          {/* Monto Total — RF-19 */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-monto-pago">
              Monto Total (₡) <span className="required-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <input
                id="input-monto-pago"
                type="number"
                min="1"
                step="1"
                className={`input-form ${errores.monto_total ? 'input-error' : ''}`}
                placeholder="0"
                value={form.monto_total}
                onChange={(e) => handleChange('monto_total', e.target.value)}
              />
              <span className="input-icon-suffix">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
            </div>
            {errores.monto_total && <span className="input-error-msg visible">{errores.monto_total}</span>}
          </div>

          {/* Fecha Acordada — RF-18 */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-pago">
              Fecha Acordada de Pago
            </label>
            <CustomDatePicker
              id="input-fecha-pago"
              value={form.fecha_acordada}
              onChange={(val) => handleChange('fecha_acordada', val)}
              placeholder="Seleccionar fecha acordada..."
            />
          </div>
        </div>

        {/* Pedido Asociado (Opcional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-pedido-pago">
            Pedido Asociado (Opcional)
          </label>
          <input
            id="input-pedido-pago"
            type="text"
            className="input-form"
            placeholder="Ej: #012 — referencia del pedido vinculado"
            value={form.pedido_asociado}
            onChange={(e) => handleChange('pedido_asociado', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
