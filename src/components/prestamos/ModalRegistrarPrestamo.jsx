import { useState, useEffect, useRef } from 'react';
import { useClients } from '../../context/ClientContext';
import { usePrestamos } from '../../context/PrestamosContext';
import { useToast } from '../common/Toast';
import { formatMoneda } from './prestamosUtils';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';

/**
 * Modal para registrar o editar préstamos a clientes o terceros.
 * RF-39, RF-40 y RF-41.
 */
export default function ModalRegistrarPrestamo({ isOpen, onClose, prestamoToEdit = null }) {
  const { clientes } = useClients();
  const { agregarPrestamo, editarPrestamo } = usePrestamos();
  const { showToast } = useToast();

  const esEdicion = !!prestamoToEdit;

  const [tipoBeneficiario, setTipoBeneficiario] = useState('cliente'); // 'cliente' | 'tercero'

  const initialForm = {
    clienteBusqueda: '',
    cliente_id: '',
    beneficiario_nombre: '',
    beneficiario_telefono: '',
    monto_capital: '',
    tasa_interes: '10', // 10% por defecto
    fecha_entrega: new Date().toISOString().split('T')[0],
    fecha_limite: '',
    frecuencia_pago: 'Mensual',
    notas: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const autocompleteRef = useRef(null);

  // Inicializar o cargar datos
  useEffect(() => {
    if (isOpen) {
      if (prestamoToEdit) {
        setTipoBeneficiario(prestamoToEdit.cliente_id ? 'cliente' : 'tercero');
        setForm({
          clienteBusqueda: prestamoToEdit.cliente_id ? prestamoToEdit.beneficiario_nombre : '',
          cliente_id: prestamoToEdit.cliente_id || '',
          beneficiario_nombre: prestamoToEdit.beneficiario_nombre || '',
          beneficiario_telefono: prestamoToEdit.beneficiario_telefono || '',
          monto_capital: prestamoToEdit.monto_capital || '',
          tasa_interes: prestamoToEdit.tasa_interes !== undefined ? String(prestamoToEdit.tasa_interes) : '10',
          fecha_entrega: prestamoToEdit.fecha_entrega || new Date().toISOString().split('T')[0],
          fecha_limite: prestamoToEdit.fecha_limite || '',
          frecuencia_pago: prestamoToEdit.frecuencia_pago || 'Mensual',
          notas: prestamoToEdit.notas || '',
        });
      } else {
        setTipoBeneficiario('cliente');
        setForm(initialForm);
      }
      setErrores({});
      setShowAutocomplete(false);
    }
  }, [isOpen, prestamoToEdit]);

  // Cerrar lista autocompletada al hacer clic fuera
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
      beneficiario_nombre: valor,
      beneficiario_telefono: ''
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

    if (errores.beneficiario_nombre) {
      setErrores(prev => ({ ...prev, beneficiario_nombre: null }));
    }
  };

  const seleccionarCliente = (cliente) => {
    setForm(prev => ({
      ...prev,
      clienteBusqueda: cliente.nombre_completo,
      cliente_id: cliente.id,
      beneficiario_nombre: cliente.nombre_completo,
      beneficiario_telefono: cliente.telefono,
    }));
    setShowAutocomplete(false);
    setErrores(prev => ({ ...prev, beneficiario_nombre: null, beneficiario_telefono: null }));
  };

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }));
    }
  };

  // Cálculo en tiempo real (RF-41)
  const capitalNum = Number(form.monto_capital) || 0;
  const tasaNum = Number(form.tasa_interes) || 0;
  const interesCalculado = Math.round(capitalNum * (tasaNum / 100));
  const totalADevolver = capitalNum + interesCalculado;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const datos = {
      cliente_id: tipoBeneficiario === 'cliente' ? form.cliente_id : null,
      beneficiario_nombre: form.beneficiario_nombre,
      beneficiario_telefono: form.beneficiario_telefono,
      monto_capital: form.monto_capital,
      tasa_interes: form.tasa_interes,
      fecha_entrega: form.fecha_entrega,
      fecha_limite: form.fecha_limite,
      frecuencia_pago: form.frecuencia_pago,
      notas: form.notas,
    };

    try {
      let resultado;
      if (esEdicion) {
        resultado = await editarPrestamo(prestamoToEdit.id, datos);
      } else {
        resultado = await agregarPrestamo(datos);
      }

      if (resultado && !resultado.success) {
        setErrores(resultado.errores || {});
        return;
      }

      showToast({
        tipo: 'success',
        mensaje: esEdicion ? 'Términos del préstamo actualizados exitosamente.' : 'Préstamo registrado exitosamente.'
      });

      setForm(initialForm);
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar préstamo:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el préstamo. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoModal = (
    <div className="icon-circle-badge rose-badge">
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
      title={esEdicion ? 'Editar Términos del Préstamo' : 'Nuevo Préstamo a Terceros'}
      subtitle={esEdicion ? 'Modifica capital, tasa de interés o plazo' : 'Registro de préstamo de dinero y cálculo de intereses'}
      icon={iconoModal}
      cardClassName="modal-card-lg"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="form-prestamo"
            className="btn-primary-action"
            id="btn-guardar-prestamo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>{esEdicion ? 'Guardar Cambios' : 'Registrar Préstamo'}</span>
          </button>
        </>
      }
    >
      <form id="form-prestamo" onSubmit={handleSubmit} noValidate>
        {/* Pestañas: Cliente Registrado vs Tercero */}
        {!esEdicion && (
          <div className="beneficiario-type-tabs">
            <button
              type="button"
              className={`btn-tab-beneficiario ${tipoBeneficiario === 'cliente' ? 'active' : ''}`}
              onClick={() => {
                setTipoBeneficiario('cliente');
                setForm(prev => ({ ...prev, cliente_id: '', beneficiario_nombre: '', beneficiario_telefono: '', clienteBusqueda: '' }));
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <span>Cliente Registrado</span>
            </button>
            <button
              type="button"
              className={`btn-tab-beneficiario ${tipoBeneficiario === 'tercero' ? 'active' : ''}`}
              onClick={() => {
                setTipoBeneficiario('tercero');
                setForm(prev => ({ ...prev, cliente_id: '', beneficiario_nombre: '', beneficiario_telefono: '', clienteBusqueda: '' }));
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>Persona Tercera / Externa</span>
            </button>
          </div>
        )}

        {/* Sección Beneficiario */}
        {tipoBeneficiario === 'cliente' ? (
          <div className="form-group">
            <label className="form-label" htmlFor="input-buscar-cliente-prestamo">
              Cliente del Directorio <span className="required-star">*</span>
            </label>
            <div className="autocomplete-wrapper" ref={autocompleteRef}>
              <input
                id="input-buscar-cliente-prestamo"
                type="text"
                className={`input-form ${errores.beneficiario_nombre ? 'input-error' : ''}`}
                placeholder="Buscar cliente por nombre o teléfono..."
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
            {errores.beneficiario_nombre && (
              <span className="input-error-msg visible">{errores.beneficiario_nombre}</span>
            )}
            {form.beneficiario_telefono && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-rosa-suave)', marginTop: '0.2rem', display: 'block' }}>
                Teléfono asociado: {form.beneficiario_telefono}
              </span>
            )}
          </div>
        ) : (
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="input-nombre-tercero">
                Nombre de la Persona <span className="required-star">*</span>
              </label>
              <input
                id="input-nombre-tercero"
                type="text"
                className={`input-form ${errores.beneficiario_nombre ? 'input-error' : ''}`}
                placeholder="Nombre completo del tercero..."
                value={form.beneficiario_nombre}
                onChange={(e) => handleChange('beneficiario_nombre', e.target.value)}
              />
              {errores.beneficiario_nombre && (
                <span className="input-error-msg visible">{errores.beneficiario_nombre}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-tel-tercero">
                Teléfono de Contacto (8 dígitos) <span className="required-star">*</span>
              </label>
              <input
                id="input-tel-tercero"
                type="text"
                className={`input-form ${errores.beneficiario_telefono ? 'input-error' : ''}`}
                placeholder="8888-8888"
                value={form.beneficiario_telefono}
                onChange={(e) => handleChange('beneficiario_telefono', e.target.value)}
              />
              {errores.beneficiario_telefono && (
                <span className="input-error-msg visible">{errores.beneficiario_telefono}</span>
              )}
            </div>
          </div>
        )}

        {/* Fila: Capital y Tasa de Interés */}
        <div className="form-row-2col">
          {/* Monto Capital */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-capital-prestamo">
              Capital Prestado (₡) <span className="required-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <input
                id="input-capital-prestamo"
                type="number"
                min="1"
                step="1000"
                className={`input-form ${errores.monto_capital ? 'input-error' : ''}`}
                placeholder="0"
                value={form.monto_capital}
                onChange={(e) => handleChange('monto_capital', e.target.value)}
              />
              <span className="input-icon-suffix">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span>
            </div>
            {errores.monto_capital && (
              <span className="input-error-msg visible">{errores.monto_capital}</span>
            )}
          </div>

          {/* Tasa de Interés (%) */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-tasa-prestamo">
              Tasa de Interés (%) <span className="required-star">*</span>
            </label>
            <div className="input-icon-wrapper">
              <input
                id="input-tasa-prestamo"
                type="number"
                min="0"
                max="100"
                step="1"
                className={`input-form ${errores.tasa_interes ? 'input-error' : ''}`}
                placeholder="10"
                value={form.tasa_interes}
                onChange={(e) => handleChange('tasa_interes', e.target.value)}
              />
              <span className="input-icon-suffix" style={{ fontWeight: 700 }}>%</span>
            </div>
            {errores.tasa_interes && (
              <span className="input-error-msg visible">{errores.tasa_interes}</span>
            )}
          </div>
        </div>

        {/* Caja de Cálculo en Tiempo Real (RF-41) */}
        <div className="calculator-preview-box">
          <div className="calculator-preview-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2"></rect>
              <line x1="8" y1="6" x2="16" y2="6"></line>
              <line x1="16" y1="14" x2="16" y2="18"></line>
              <path d="M16 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M8 14h.01"></path>
              <path d="M12 18h.01"></path>
              <path d="M8 18h.01"></path>
            </svg>
            <span>Cálculo Automático en Tiempo Real</span>
          </div>

          <div className="calculator-grid">
            <div className="calculator-item">
              <span className="calculator-item-label">Capital Base</span>
              <span className="calculator-item-val">{formatMoneda(capitalNum)}</span>
            </div>
            <div className="calculator-item">
              <span className="calculator-item-label">Interés Ganancia ({tasaNum}%)</span>
              <span className="calculator-item-val val-green">+{formatMoneda(interesCalculado)}</span>
            </div>
            <div className="calculator-item">
              <span className="calculator-item-label">Total a Devolver</span>
              <span className="calculator-item-val val-gold">{formatMoneda(totalADevolver)}</span>
            </div>
          </div>
        </div>

        {/* Fila: Fecha Entrega y Fecha Límite */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-entrega">
              Fecha de Entrega <span className="required-star">*</span>
            </label>
            <CustomDatePicker
              id="input-fecha-entrega"
              value={form.fecha_entrega}
              onChange={(val) => handleChange('fecha_entrega', val)}
              hasError={!!errores.fecha_entrega}
              placeholder="Seleccionar fecha de entrega..."
            />
            {errores.fecha_entrega && (
              <span className="input-error-msg visible">{errores.fecha_entrega}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-limite">
              Fecha Límite / Vencimiento <span className="required-star">*</span>
            </label>
            <CustomDatePicker
              id="input-fecha-limite"
              value={form.fecha_limite}
              onChange={(val) => handleChange('fecha_limite', val)}
              hasError={!!errores.fecha_limite}
              placeholder="Seleccionar fecha límite..."
            />
            {errores.fecha_limite && (
              <span className="input-error-msg visible">{errores.fecha_limite}</span>
            )}
          </div>
        </div>

        {/* Frecuencia de Pago y Notas */}
        <div className="form-row-2col">
          <div className="form-group">
            <label className="form-label" htmlFor="select-frecuencia-prestamo">
              Frecuencia / Modalidad Acordada
            </label>
            <select
              id="select-frecuencia-prestamo"
              className="select-glass input-form"
              value={form.frecuencia_pago}
              onChange={(e) => handleChange('frecuencia_pago', e.target.value)}
            >
              <option value="Semanal">Semanal</option>
              <option value="Quincenal">Quincenal</option>
              <option value="Mensual">Mensual</option>
              <option value="Plazo Fijo / Único">Plazo Fijo / Pago Único</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="input-notas-prestamo">
              Notas / Observaciones (Opcional)
            </label>
            <input
              id="input-notas-prestamo"
              type="text"
              className="input-form"
              placeholder="Ej: Garantía, acuerdo de entrega, etc."
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
