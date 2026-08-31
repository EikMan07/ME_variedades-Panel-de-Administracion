import { useState, useEffect, useRef } from 'react';
import { useClients } from '../../context/ClientContext';
import { useCobros } from '../../context/CobrosContext';
import { useToast } from '../common/Toast';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';

/**
 * Modal interactivo para registrar un nuevo cobro o editar uno existente.
 * RF-23 y RF-25.
 */
export default function ModalRegistrarCobro({ isOpen, onClose, cobroToEdit = null }) {
  const { clientes } = useClients();
  const { agregarCobro, editarCobro } = useCobros();
  const { showToast } = useToast();

  const esEdicion = !!cobroToEdit;

  const initialForm = {
    clienteBusqueda: '',
    cliente_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    monto_cobrado: '',
    fecha_cobro: new Date().toISOString().split('T')[0],
    metodo_cobro: 'Efectivo',
    numero_recibo: '',
    concepto_nota: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const autocompleteRef = useRef(null);

  // Cargar datos al abrir o editar
  useEffect(() => {
    if (isOpen) {
      if (cobroToEdit) {
        setForm({
          clienteBusqueda: cobroToEdit.cliente_nombre || '',
          cliente_id: cobroToEdit.cliente_id || '',
          cliente_nombre: cobroToEdit.cliente_nombre || '',
          cliente_telefono: cobroToEdit.cliente_telefono || '',
          monto_cobrado: cobroToEdit.monto_cobrado || '',
          fecha_cobro: cobroToEdit.fecha_cobro || new Date().toISOString().split('T')[0],
          metodo_cobro: cobroToEdit.metodo_cobro || 'Efectivo',
          numero_recibo: cobroToEdit.numero_recibo || '',
          concepto_nota: cobroToEdit.concepto_nota || '',
        });
      } else {
        setForm(initialForm);
      }
      setErrores({});
      setShowAutocomplete(false);
    }
  }, [isOpen, cobroToEdit]);

  // Cerrar lista autocompletada al hacer click fuera
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
    setForm(prev => ({
      ...prev,
      clienteBusqueda: valor,
      cliente_id: '',
      cliente_nombre: '',
      cliente_telefono: ''
    }));

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

    if (errores.cliente_id) {
      setErrores(prev => ({ ...prev, cliente_id: null }));
    }
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
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const datos = {
      cliente_id: form.cliente_id,
      cliente_nombre: form.cliente_nombre,
      cliente_telefono: form.cliente_telefono,
      monto_cobrado: form.monto_cobrado,
      fecha_cobro: form.fecha_cobro,
      metodo_cobro: form.metodo_cobro,
      concepto_nota: form.concepto_nota,
    };

    try {
      let resultado;
      if (esEdicion) {
        resultado = await editarCobro(cobroToEdit.id, datos);
      } else {
        resultado = await agregarCobro(datos);
      }

      if (resultado && !resultado.success) {
        setErrores(resultado.errores || {});
        return;
      }

      showToast({
        tipo: 'success',
        mensaje: esEdicion ? 'Cobro actualizado exitosamente.' : 'Cobro registrado exitosamente.'
      });

      setForm(initialForm);
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar cobro:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el cobro. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoModal = (
    <div className="icon-circle-badge gold-badge">
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
      title={esEdicion ? 'Editar Registro de Cobro' : 'Nuevo Cobro'}
      subtitle={esEdicion ? 'Actualiza los detalles del cobro registrado' : 'Ingresa el cobro recibido de un cliente'}
      icon={iconoModal}
      cardClassName="modal-card-lg"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-cobro"
            className="btn-primary-action"
            id="btn-guardar-cobro"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>{esEdicion ? 'Guardar Cambios' : 'Registrar Cobro'}</span>
          </button>
        </>
      }
    >
      <form id="form-cobro" onSubmit={handleSubmit} noValidate>
        {/* Selector de Cliente con Autocomplete */}
        <div className="form-group">
          <label className="form-label" htmlFor="input-cliente-cobro">
            Cliente <span className="required-star">*</span>
          </label>
          <div className="autocomplete-wrapper" ref={autocompleteRef}>
            <input
              id="input-cliente-cobro"
              type="text"
              className={`input-form ${errores.cliente_id ? 'input-error' : ''}`}
              placeholder="Escribe el nombre o teléfono del cliente..."
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
                    <div className="autocomplete-avatar">
                      {c.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="autocomplete-nombre">{c.nombre_completo}</div>
                      <div className="autocomplete-tel">{c.telefono}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errores.cliente_id && (
            <span className="input-error-msg visible">{errores.cliente_id}</span>
          )}
          {clientes.length === 0 && (
            <span className="input-error-msg visible" style={{ color: 'var(--color-advertencia)' }}>
              No hay clientes registrados. Regístralos en el módulo de Clientes para vincularlos.
            </span>
          )}
        </div>

        {/* Fila 1: Monto Cobrado y Fecha del Cobro */}
        <div className="form-row-2col">
          {/* Monto Cobrado */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-monto-cobrado">
              Monto Cobrado (₡) <span className="required-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <input
                id="input-monto-cobrado"
                type="number"
                min="1"
                step="1"
                className={`input-form ${errores.monto_cobrado ? 'input-error' : ''}`}
                placeholder="0"
                value={form.monto_cobrado}
                onChange={(e) => handleChange('monto_cobrado', e.target.value)}
              />
              <span className="input-icon-suffix">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
            </div>
            {errores.monto_cobrado && (
              <span className="input-error-msg visible">{errores.monto_cobrado}</span>
            )}
          </div>

          {/* Fecha del Cobro */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-cobro">
              Fecha del Cobro <span className="required-star">*</span>
            </label>
            <CustomDatePicker
              id="input-fecha-cobro"
              value={form.fecha_cobro}
              onChange={(val) => handleChange('fecha_cobro', val)}
              hasError={!!errores.fecha_cobro}
              placeholder="Seleccionar fecha del cobro..."
            />
            {errores.fecha_cobro && (
              <span className="input-error-msg visible">{errores.fecha_cobro}</span>
            )}
          </div>
        </div>

        {/* Fila 2: Método de Cobro y Concepto / Nota */}
        <div className="form-row-2col">
          {/* Método de Cobro */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-metodo-cobro">
              Método de Pago <span className="required-star">*</span>
            </label>
            <select
              id="select-metodo-cobro"
              className="select-glass input-form"
              value={form.metodo_cobro}
              onChange={(e) => handleChange('metodo_cobro', e.target.value)}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="SINPE Móvil">SINPE Móvil</option>
              <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Depósito">Depósito en Cuenta</option>
              <option value="Otro">Otro medio</option>
            </select>
          </div>

          {/* Concepto / Nota Detallada */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-concepto-cobro">
              Concepto o Detalle <span className="required-star">*</span>
            </label>
            <input
              id="input-concepto-cobro"
              type="text"
              className={`input-form ${errores.concepto_nota ? 'input-error' : ''}`}
              placeholder="Ej: Abono quincenal de mercadería..."
              value={form.concepto_nota}
              onChange={(e) => handleChange('concepto_nota', e.target.value)}
            />
            {errores.concepto_nota && (
              <span className="input-error-msg visible">{errores.concepto_nota}</span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
