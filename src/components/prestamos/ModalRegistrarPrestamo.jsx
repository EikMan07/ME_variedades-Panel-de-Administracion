import { useState, useEffect, useRef, useMemo } from 'react';
import { useClients } from '../../context/ClientContext';
import { usePrestamos } from '../../context/PrestamosContext';
import { useToast } from '../common/Toast';
import { formatMoneda } from './prestamosUtils';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';
import { calcularFechasYCuotas, formatearMoneda, formatearFecha } from '../../utils/utils';

/**
 * Modal para registrar o editar préstamos a clientes o terceros con motor de cuotas exacto.
 * Integra:
 * - Selección de beneficiario (Cliente o Tercero)
 * - Capital y Tasa de Interés (%)
 * - Fecha de Entrega con CustomDatePicker
 * - Tipo de Plazo (Semana, Quincena, Mes) y Número de Plazos
 * - Cálculo automático: Total = Capital + (Capital * Tasa / 100)
 * - Cronograma de cuotas dinámico y editable manualmente antes de guardar
 */
export default function ModalRegistrarPrestamo({ isOpen, onClose, prestamoToEdit = null }) {
  const { clientes } = useClients();
  const { agregarPrestamo, editarPrestamo } = usePrestamos();
  const { showToast } = useToast();

  const esEdicion = !!prestamoToEdit;
  const [tipoBeneficiario, setTipoBeneficiario] = useState('cliente'); // 'cliente' | 'tercero'

  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const initialForm = {
    clienteBusqueda: '',
    cliente_id: '',
    beneficiario_nombre: '',
    beneficiario_telefono: '',
    monto_capital: '',
    tasa_interes: '10', // 10% por defecto
    fecha_entrega: hoyStr,
    tipo_plazo: 'mes', // 'semana' | 'quincena' | 'mes'
    num_plazos: 2,
    moratoria_tipo: 'semana', // 'dia' | 'semana' | 'mes'
    moratoria_monto: '',
    notas: '',
  };

  const [form, setForm] = useState(initialForm);
  const [cuotas, setCuotas] = useState([]);
  const [esPrestamoAntiguo, setEsPrestamoAntiguo] = useState(false);
  const [errores, setErrores] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const autocompleteRef = useRef(null);

  // Inicializar o cargar datos
  useEffect(() => {
    if (isOpen) {
      if (prestamoToEdit) {
        setTipoBeneficiario(prestamoToEdit.cliente_id ? 'cliente' : 'tercero');
        const tieneTipoPlazo = Boolean(prestamoToEdit.tipo_plazo);
        const tieneNumPlazos = Boolean(prestamoToEdit.num_plazos);
        const tieneCuotas = Array.isArray(prestamoToEdit.cuotas) && prestamoToEdit.cuotas.length > 0;

        setForm({
          clienteBusqueda: prestamoToEdit.cliente_id ? prestamoToEdit.beneficiario_nombre : '',
          cliente_id: prestamoToEdit.cliente_id || '',
          beneficiario_nombre: prestamoToEdit.beneficiario_nombre || '',
          beneficiario_telefono: prestamoToEdit.beneficiario_telefono || '',
          monto_capital: prestamoToEdit.monto_capital || '',
          tasa_interes: prestamoToEdit.tasa_interes !== undefined ? String(prestamoToEdit.tasa_interes) : '10',
          fecha_entrega: prestamoToEdit.fecha_entrega || hoyStr,
          tipo_plazo: prestamoToEdit.tipo_plazo || 'mes',
          num_plazos: prestamoToEdit.num_plazos || (tieneCuotas ? prestamoToEdit.cuotas.length : 2),
          moratoria_tipo: prestamoToEdit.moratoria_tipo || 'semana',
          moratoria_monto: prestamoToEdit.moratoria_monto !== undefined && prestamoToEdit.moratoria_monto !== null ? String(prestamoToEdit.moratoria_monto) : '',
          notas: prestamoToEdit.notas || '',
        });

        if (tieneCuotas) {
          setCuotas(prestamoToEdit.cuotas);
          setEsPrestamoAntiguo(false);
        } else if (tieneTipoPlazo && tieneNumPlazos) {
          // Reconstruir en memoria a partir de fecha_entrega, tipo_plazo, num_plazos y monto_total
          try {
            const cap = Number(prestamoToEdit.monto_capital) || 0;
            const tasa = Number(prestamoToEdit.tasa_interes) || 0;
            const tot = Number(prestamoToEdit.total_devolver || prestamoToEdit.monto_total) || (cap + (cap * (tasa / 100)));
            const res = calcularFechasYCuotas(
              prestamoToEdit.fecha_entrega || hoyStr,
              prestamoToEdit.tipo_plazo,
              Number(prestamoToEdit.num_plazos),
              tot
            );
            setCuotas(res.cuotas.map(c => ({
              numeroCuota: c.numeroCuota,
              fechaVencimiento: c.fechaVencimiento,
              montoSugerido: c.montoSugerido,
              montoRealAcordado: c.montoSugerido,
              editadoManualmente: false,
            })));
            setEsPrestamoAntiguo(false);
          } catch (e) {
            console.warn('Error al reconstruir cuotas en memoria:', e);
            setCuotas([]);
            setEsPrestamoAntiguo(true);
          }
        } else {
          // Préstamo verdaderamente antiguo sin tipo_plazo ni num_plazos
          setCuotas([]);
          setEsPrestamoAntiguo(true);
        }
      } else {
        setTipoBeneficiario('cliente');
        setForm(initialForm);
        setCuotas([]);
        setEsPrestamoAntiguo(false);
      }
      setErrores({});
      setShowAutocomplete(false);
    }
  }, [isOpen, prestamoToEdit, hoyStr]);

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
        (c.nombre_completo || c.nombre || '').toLowerCase().includes(q) ||
        (c.telefono || '').replace(/[\s-]/g, '').includes(q.replace(/[\s-]/g, ''))
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
    const nombre = cliente.nombre_completo || cliente.nombre || '';
    setForm(prev => ({
      ...prev,
      clienteBusqueda: nombre,
      cliente_id: cliente.id,
      beneficiario_nombre: nombre,
      beneficiario_telefono: cliente.telefono || '',
    }));
    setShowAutocomplete(false);
    setErrores(prev => ({ ...prev, beneficiario_nombre: null, beneficiario_telefono: null }));
  };

  const handleChange = (campo, valor) => {
    if (campo === 'tipo_plazo' || campo === 'num_plazos' || campo === 'monto_capital') {
      setEsPrestamoAntiguo(false);
    }
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores(prev => ({ ...prev, [campo]: null }));
    }
  };

  const handleNumPlazosChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      handleChange('num_plazos', '');
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      handleChange('num_plazos', parsed);
    }
  };

  const handleNumPlazosBlur = () => {
    if (form.num_plazos === '' || Number(form.num_plazos) < 1) {
      handleChange('num_plazos', 1);
    }
  };

  // Cálculos financieros
  const capitalNum = Number(form.monto_capital) || 0;
  const tasaNum = Number(form.tasa_interes) || 0;
  const interesCalculado = Math.round(capitalNum * (tasaNum / 100));
  const totalADevolver = capitalNum + interesCalculado;

  // Proyección automática de cuotas con calcularFechasYCuotas
  useEffect(() => {
    if (esEdicion && esPrestamoAntiguo) {
      return;
    }

    const plazosValidos = parseInt(form.num_plazos, 10);
    if (capitalNum <= 0 || !form.fecha_entrega || !form.tipo_plazo) {
      setCuotas([]);
      return;
    }
    if (!plazosValidos || plazosValidos < 1) {
      // Si el campo está vacío mientras el usuario escribe, no borrar abruptamente
      return;
    }

    try {
      const res = calcularFechasYCuotas(form.fecha_entrega, form.tipo_plazo, plazosValidos, totalADevolver);

      setCuotas(prevCuotas => {
        return res.cuotas.map((c, idx) => {
          const anterior = prevCuotas[idx];
          const montoAcordado = anterior?.editadoManualmente
            ? Number(anterior.montoRealAcordado)
            : c.montoSugerido;

          return {
            numeroCuota: c.numeroCuota,
            fechaVencimiento: c.fechaVencimiento,
            montoSugerido: c.montoSugerido,
            montoRealAcordado: montoAcordado,
            editadoManualmente: Boolean(anterior?.editadoManualmente),
          };
        });
      });
    } catch (err) {
      console.warn('Error al calcular cuotas de préstamo:', err);
      setCuotas([]);
    }
  }, [capitalNum, tasaNum, totalADevolver, form.fecha_entrega, form.tipo_plazo, form.num_plazos, esEdicion, esPrestamoAntiguo]);

  // Edición manual del monto acordado en cada cuota
  const handleCuotaChange = (index, nuevoValor) => {
    const valNumerico = parseFloat(nuevoValor) || 0;
    setCuotas((prev) => {
      const copia = [...prev];
      if (copia[index]) {
        copia[index] = {
          ...copia[index],
          montoRealAcordado: valNumerico,
          editadoManualmente: true,
        };
      }
      return copia;
    });
  };

  const sumaCuotasAcordadas = cuotas.reduce((acc, c) => acc + (Number(c.montoRealAcordado) || 0), 0);
  const diferenciaCuotas = totalADevolver - sumaCuotasAcordadas;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fechaLimiteCalculada = cuotas.length > 0
      ? cuotas[cuotas.length - 1].fechaVencimiento
      : form.fecha_entrega;

    const datos = {
      cliente_id: tipoBeneficiario === 'cliente' ? form.cliente_id : null,
      beneficiario_nombre: form.beneficiario_nombre,
      beneficiario_telefono: form.beneficiario_telefono,
      monto_capital: capitalNum,
      tasa_interes: tasaNum,
      interes_monto: interesCalculado,
      total_devolver: totalADevolver,
      monto_total: totalADevolver,
      fecha_entrega: form.fecha_entrega,
      fecha_limite: fechaLimiteCalculada,
      tipo_plazo: form.tipo_plazo,
      num_plazos: Math.max(1, parseInt(form.num_plazos, 10) || 1),
      moratoria_tipo: form.moratoria_tipo || 'semana',
      moratoria_monto: Number(form.moratoria_monto) || 0,
      cuotas,
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
        mensaje: esEdicion ? 'Préstamo actualizado exitosamente.' : 'Préstamo registrado exitosamente.'
      });

      setForm(initialForm);
      setCuotas([]);
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
    <div className="icon-circle-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
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
      subtitle={esEdicion ? 'Modifica capital, tasa de interés o cronograma de cuotas' : 'Registro comercial de crédito con cálculo de intereses y plazos exactos'}
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
          <div className="beneficiario-type-tabs" style={{ marginBottom: '1.25rem' }}>
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
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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
                  {clientesFiltrados.map((c) => {
                    const nombreCliente = c.nombre_completo || c.nombre || 'Cliente';
                    const inicial = nombreCliente.charAt(0).toUpperCase();
                    return (
                      <div
                        key={c.id}
                        className="autocomplete-item"
                        role="option"
                        onClick={() => seleccionarCliente(c)}
                      >
                        <div className="autocomplete-avatar">{inicial}</div>
                        <div>
                          <div className="autocomplete-nombre">{nombreCliente}</div>
                          <div className="autocomplete-tel">{c.telefono || 'Sin teléfono'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {errores.beneficiario_nombre && (
              <span className="input-error-msg visible">{errores.beneficiario_nombre}</span>
            )}
            {form.beneficiario_telefono && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-dorado, #f59e0b)', marginTop: '0.2rem', display: 'block' }}>
                Teléfono asociado: {form.beneficiario_telefono}
              </span>
            )}
          </div>
        ) : (
          <div className="form-row-2col" style={{ marginBottom: '1.25rem' }}>
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
        <div className="form-row-2col" style={{ marginBottom: '1.25rem' }}>
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
              <span className="input-icon-suffix" style={{ color: 'var(--color-dorado, #f59e0b)', fontWeight: 700 }}>₡</span>
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
              <span className="input-icon-suffix" style={{ fontWeight: 700, color: 'var(--color-dorado, #f59e0b)' }}>%</span>
            </div>
            {errores.tasa_interes && (
              <span className="input-error-msg visible">{errores.tasa_interes}</span>
            )}
          </div>
        </div>

        {/* Resumen Financiero en Tiempo Real */}
        <div className="calculator-preview-box" style={{ marginBottom: '1.25rem' }}>
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
              <span className="calculator-item-label">Interés ({tasaNum}%)</span>
              <span className="calculator-item-val val-green">+{formatMoneda(interesCalculado)}</span>
            </div>
            <div className="calculator-item">
              <span className="calculator-item-label">Total a Devolver</span>
              <span className="calculator-item-val val-gold">{formatMoneda(totalADevolver)}</span>
            </div>
          </div>
        </div>

        {/* Fila: Fecha de Entrega (DatePicker), Tipo de Plazo y Número de Plazos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {/* Fecha de Entrega con CustomDatePicker */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-fecha-entrega-prestamo">
              Fecha de Entrega <span className="required-star">*</span>
            </label>
            <CustomDatePicker
              id="input-fecha-entrega-prestamo"
              value={form.fecha_entrega}
              onChange={(val) => handleChange('fecha_entrega', val)}
              hasError={!!errores.fecha_entrega}
              placeholder="Seleccionar fecha..."
            />
            {errores.fecha_entrega && (
              <span className="input-error-msg visible">{errores.fecha_entrega}</span>
            )}
          </div>

          {/* Tipo de Plazo */}
          <div className="form-group">
            <label className="form-label" htmlFor="select-tipo-plazo-prestamo">
              Tipo de Plazo <span className="required-star">*</span>
            </label>
            <select
              id="select-tipo-plazo-prestamo"
              className="select-glass input-form"
              value={form.tipo_plazo}
              onChange={(e) => handleChange('tipo_plazo', e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
            >
              <option value="semana">Semana (7 días exactos)</option>
              <option value="quincena">Quincena (15 días exactos)</option>
              <option value="mes">Mes (30 días exactos)</option>
            </select>
          </div>

          {/* Número de Plazos */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-num-plazos-prestamo">
              Número de Plazos / Cuotas <span className="required-star">*</span>
            </label>
            <input
              id="input-num-plazos-prestamo"
              type="number"
              min="1"
              max="48"
              className="input-form"
              value={form.num_plazos}
              onChange={handleNumPlazosChange}
              onBlur={handleNumPlazosBlur}
              placeholder="1"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
            />
          </div>
        </div>

        {/* Política de Moratoria por Atraso */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          background: 'rgba(234, 179, 8, 0.04)',
          padding: '0.85rem',
          borderRadius: '10px',
          border: '1px solid rgba(234, 179, 8, 0.15)',
        }}>
          {/* Período de Moratoria */}
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }} htmlFor="select-moratoria-tipo-prestamo">
              Período de Moratoria
            </label>
            <select
              id="select-moratoria-tipo-prestamo"
              value={form.moratoria_tipo}
              onChange={(e) => handleChange('moratoria_tipo', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: '#fff',
                padding: '0.55rem 0.75rem',
                fontSize: '0.86rem',
              }}
            >
              <option value="dia">Por cada día completo de atraso</option>
              <option value="semana">Por cada semana completa (7 días)</option>
              <option value="mes">Por cada mes completo (30 días)</option>
            </select>
          </div>

          {/* Monto Fijo de Moratoria por Período */}
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }} htmlFor="input-moratoria-monto-prestamo">
              Recargo de Moratoria (₡ por período)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: 700 }}>₡</span>
              <input
                id="input-moratoria-monto-prestamo"
                type="number"
                min="0"
                step="100"
                placeholder="0 (Sin moratoria)"
                value={form.moratoria_monto}
                onChange={(e) => handleChange('moratoria_monto', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.55rem 0.75rem 0.55rem 1.75rem',
                  fontSize: '0.86rem',
                }}
              />
            </div>
          </div>
        </div>

        {/* Contenedor del Cronograma (Siempre visible con estado dinámico) */}
        <div style={{
          marginBottom: '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
              Plan de Pagos y Cronograma de Cuotas
            </span>
            {cuotas.length > 0 && !esPrestamoAntiguo && (
              <span style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                background: Math.abs(diferenciaCuotas) < 1 ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.2)',
                color: Math.abs(diferenciaCuotas) < 1 ? 'var(--color-exito, #10b981)' : 'var(--color-alerta-ambar-suave, #fbbf24)',
              }}>
                {Math.abs(diferenciaCuotas) < 1 ? '✓ Balance Exacto' : `Diferencia: ₡${diferenciaCuotas.toFixed(2)}`}
              </span>
            )}
          </div>

          {/* Estado A: Préstamo creado antes de la actualización (sin parámetros de cuotas) */}
          {esEdicion && esPrestamoAntiguo ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.15rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              color: 'var(--color-alerta-ambar-suave, #fbbf24)',
              fontSize: '0.84rem',
              lineHeight: 1.45
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Cronograma no disponible para este préstamo, fue creado antes de esta actualización y no cuenta con periodicidad registrada.
              </span>
            </div>
          ) : cuotas.length === 0 ? (
            /* Estado B: Capital en $0 o en blanco (Placeholder informativo) */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '1.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Ingresa el monto de capital para previsualizar y ajustar el cronograma de cuotas sugeridas.
              </span>
            </div>
          ) : (
            /* Estado C: Tabla interactiva de cuotas */
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary, #cbd5e1)', textAlign: 'left' }}>
                    <th style={{ padding: '0.55rem 0.75rem', width: '60px' }}>#</th>
                    <th style={{ padding: '0.55rem 0.75rem' }}>Fecha Vencimiento</th>
                    <th style={{ padding: '0.55rem 0.75rem' }}>Monto Sugerido (Ref)</th>
                    <th style={{ padding: '0.55rem 0.75rem' }}>Monto Acordado</th>
                    <th style={{ padding: '0.55rem 0.75rem', width: '90px' }}>Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((cuota, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: cuota.editadoManualmente ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
                      <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--color-dorado, #f59e0b)' }}>
                        #{cuota.numeroCuota}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: '#fff' }}>
                        {formatearFecha(cuota.fechaVencimiento, 'corto')}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted, #94a3b8)', fontFamily: 'monospace' }}>
                        {formatearMoneda(cuota.montoSugerido)}
                      </td>
                      <td style={{ padding: '0.4rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ color: 'var(--text-muted, #94a3b8)' }}>₡</span>
                          <input
                            type="number"
                            step="100"
                            min="0"
                            value={cuota.montoRealAcordado}
                            onChange={(e) => handleCuotaChange(idx, e.target.value)}
                            style={{
                              background: cuota.editadoManualmente ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                              border: cuota.editadoManualmente ? '1px solid var(--color-dorado, #f59e0b)' : '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '6px',
                              color: '#fff',
                              padding: '0.35rem 0.55rem',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              width: '130px',
                              fontFamily: 'monospace',
                            }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        {cuota.editadoManualmente ? (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.2)', color: 'var(--color-dorado, #f59e0b)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            Manual
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted, #94a3b8)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                            Sugerido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.3)', fontWeight: 700 }}>
                    <td colSpan="3" style={{ padding: '0.55rem 0.75rem', color: '#fff', textAlign: 'right' }}>
                      Total Cuotas Pactadas:
                    </td>
                    <td colSpan="2" style={{ padding: '0.55rem 0.75rem', color: 'var(--color-dorado, #f59e0b)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      {formatearMoneda(sumaCuotasAcordadas)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Notas / Observaciones */}
        <div className="form-group" style={{ marginBottom: '0.5rem' }}>
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
      </form>
    </Modal>
  );
}
