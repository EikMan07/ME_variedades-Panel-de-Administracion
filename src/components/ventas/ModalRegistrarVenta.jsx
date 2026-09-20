import { useState, useEffect, useMemo, useRef } from 'react';
import Modal from '../common/Modal';
import CustomDatePicker from '../common/CustomDatePicker';
import { useClients } from '../../context/ClientContext';
import { useProducts } from '../../context/ProductContext';
import { useVentas } from '../../context/VentasContext';
import { calcularFechasYCuotas, formatearMoneda, formatearFecha } from '../../utils/utils';

export default function ModalRegistrarVenta({ isOpen, onClose, ventaToEdit = null }) {
  const { clientes = [] } = useClients();
  const { productos = [] } = useProducts();
  const { procesarVenta, actualizarVenta } = useVentas();

  const esEdicion = Boolean(ventaToEdit);
  const autocompleteRef = useRef(null);

  // Estados de datos generales
  const [clienteId, setClienteId] = useState('');
  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);

  // Precios (RF-34)
  const [precioFacturacion, setPrecioFacturacion] = useState('');
  const [precioVentaReal, setPrecioVentaReal] = useState('');

  // Modalidad (Contado o A Crédito)
  const [modalidad, setModalidad] = useState('contado');

  // Configuración de crédito (RF-35)
  const hoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [fechaVenta, setFechaVenta] = useState(hoyStr);
  const [tipoPlazo, setTipoPlazo] = useState('quincena');
  const [numPlazos, setNumPlazos] = useState(2);
  const [moratoriaTipo, setMoratoriaTipo] = useState('semana');
  const [moratoriaMonto, setMoratoriaMonto] = useState('');

  // Desglose de cuotas híbrido (RF-36 a RF-38)
  const [cuotas, setCuotas] = useState([]);

  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Producto actualmente seleccionado
  const productoSeleccionado = useMemo(() => {
    return productos.find((p) => String(p.id) === String(productoId)) || null;
  }, [productos, productoId]);

  // Stock disponible
  const stockDisponible = Number(productoSeleccionado?.stock || 0);

  // Inicialización y reset al abrir modal
  useEffect(() => {
    if (isOpen) {
      if (ventaToEdit) {
        setClienteId(ventaToEdit.clienteId || ventaToEdit.cliente_id || '');
        const cl = clientes.find((c) => String(c.id) === String(ventaToEdit.clienteId || ventaToEdit.cliente_id));
        setClienteBusqueda(cl ? `${cl.nombre_completo || cl.nombre} (${cl.telefono || 'Sin tel'})` : '');
        setProductoId(ventaToEdit.productoId || ventaToEdit.producto_id || '');
        setCantidad(Number(ventaToEdit.cantidad || 1));
        setPrecioFacturacion(ventaToEdit.precioFacturacion !== undefined ? String(ventaToEdit.precioFacturacion) : '');
        setPrecioVentaReal(ventaToEdit.precioVentaReal !== undefined ? String(ventaToEdit.precioVentaReal) : String(ventaToEdit.total || ''));
        setModalidad(ventaToEdit.modalidad || 'contado');

        if (ventaToEdit.creditoData) {
          setFechaVenta(ventaToEdit.creditoData.fechaInicio || hoyStr);
          setTipoPlazo(ventaToEdit.creditoData.tipoPlazo || 'quincena');
          setNumPlazos(ventaToEdit.creditoData.numPlazos || 2);
          setCuotas(ventaToEdit.creditoData.cuotas || []);
        } else {
          setFechaVenta(hoyStr);
          setTipoPlazo('quincena');
          setNumPlazos(2);
          setCuotas([]);
        }
        setMoratoriaTipo(ventaToEdit.moratoria_tipo || ventaToEdit.moratoriaTipo || 'semana');
        setMoratoriaMonto(ventaToEdit.moratoria_monto !== undefined && ventaToEdit.moratoria_monto !== null ? String(ventaToEdit.moratoria_monto) : (ventaToEdit.moratoriaMonto ? String(ventaToEdit.moratoriaMonto) : ''));
      } else {
        setClienteId('');
        setClienteBusqueda('');
        setProductoId('');
        setCantidad(1);
        setPrecioFacturacion('');
        setPrecioVentaReal('');
        setModalidad('contado');
        setFechaVenta(hoyStr);
        setTipoPlazo('quincena');
        setNumPlazos(2);
        setMoratoriaTipo('semana');
        setMoratoriaMonto('');
        setCuotas([]);
      }
      setShowDropdown(false);
      setErrores({});
      setIsSubmitting(false);
    }
  }, [isOpen, ventaToEdit, clientes, hoyStr]);

  // Al seleccionar producto, autocompletar precio de facturación si existe
  const handleSelectProducto = (e) => {
    const id = e.target.value;
    setProductoId(id);
    const prod = productos.find((p) => String(p.id) === String(id));
    if (prod) {
      if (!precioFacturacion || precioFacturacion === '0') {
        setPrecioFacturacion(String(prod.costo || 0));
      }
      if (!precioVentaReal || precioVentaReal === '0') {
        setPrecioVentaReal(String(prod.costo ? Math.round(Number(prod.costo) * 1.3) : ''));
      }
    }
  };

  // Manejo desacoplado de Cantidad (permisivo en edición y normalizado en blur)
  const handleCantidadChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCantidad('');
      if (errores.cantidad) setErrores(prev => ({ ...prev, cantidad: null }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setCantidad(parsed);
      if (errores.cantidad) setErrores(prev => ({ ...prev, cantidad: null }));
    }
  };

  const handleCantidadBlur = () => {
    if (cantidad === '' || Number(cantidad) < 1) {
      setCantidad(1);
    } else if (stockDisponible > 0 && Number(cantidad) > stockDisponible) {
      setCantidad(stockDisponible);
    }
  };

  // Manejo desacoplado de Número de Plazos / Cuotas
  const handleNumPlazosChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setNumPlazos('');
      if (errores.numPlazos) setErrores(prev => ({ ...prev, numPlazos: null }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setNumPlazos(parsed);
      if (errores.numPlazos) setErrores(prev => ({ ...prev, numPlazos: null }));
    }
  };

  const handleNumPlazosBlur = () => {
    if (numPlazos === '' || Number(numPlazos) < 1) {
      setNumPlazos(1);
    }
  };

  // Cerrar dropdown de búsqueda al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Clientes filtrados por autocompletado
  const clientesFiltrados = useMemo(() => {
    const q = clienteBusqueda.trim().toLowerCase();
    if (!q) return [];
    return clientes.filter((c) => {
      const nombre = (c.nombre_completo || c.nombre || '').toLowerCase();
      const tel = (c.telefono || '').replace(/\D/g, '');
      return nombre.includes(q) || tel.includes(q);
    });
  }, [clientes, clienteBusqueda]);

  // Cálculo reactivo de cuotas con el Motor Central (RNF-08 & RF-36 a RF-38)
  useEffect(() => {
    if (modalidad !== 'credito') {
      setCuotas([]);
      return;
    }

    const cantValida = parseInt(cantidad, 10);
    const plazosValidos = parseInt(numPlazos, 10);
    const precioValido = Number(precioVentaReal) || 0;

    if (precioValido <= 0 || !fechaVenta) {
      setCuotas([]);
      return;
    }

    if (!cantValida || cantValida <= 0 || !plazosValidos || plazosValidos <= 0) {
      // Si el usuario tiene temporalmente el input vacío mientras escribe, no borrar abruptamente
      return;
    }

    const montoTotalVenta = precioValido * cantValida;

    try {
      const resultado = calcularFechasYCuotas(fechaVenta, tipoPlazo, plazosValidos, montoTotalVenta);

      // Mapear preservando ediciones manuales previas (RF-38)
      setCuotas((prevCuotas) => {
        return resultado.cuotas.map((c, idx) => {
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
      console.warn('Error al proyectar cuotas con calcularFechasYCuotas:', err);
      setCuotas([]);
    }
  }, [modalidad, precioVentaReal, cantidad, fechaVenta, tipoPlazo, numPlazos]);

  // Modificación manual de cuota por María (RF-38)
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

  // Cálculos de balance financiero
  const cantidadValida = Number(cantidad) || 0;
  const subtotalFacturacion = (Number(precioFacturacion) || 0) * (cantidadValida || 1);
  const totalVentaRealCalculado = (Number(precioVentaReal) || 0) * (cantidadValida || 1);
  const gananciaEstimada = totalVentaRealCalculado - subtotalFacturacion;
  const porcentajeMargen = subtotalFacturacion > 0 ? ((gananciaEstimada / subtotalFacturacion) * 100).toFixed(1) : 0;
  const sumaCuotasAcordadas = cuotas.reduce((acc, c) => acc + (Number(c.montoRealAcordado) || 0), 0);
  const diferenciaCuotas = totalVentaRealCalculado - sumaCuotasAcordadas;

  // Validación y envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    if (!clienteId) {
      nuevosErrores.clienteId = 'Debe seleccionar un cliente del directorio.';
    }

    if (!productoId) {
      nuevosErrores.productoId = 'Debe seleccionar un producto del inventario.';
    }

    if (!cantidad || Number(cantidad) <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0.';
    } else if (Number(cantidad) > stockDisponible) {
      nuevosErrores.cantidad = `Stock insuficiente. Solo hay ${stockDisponible} disponible(s).`;
    }

    if (precioFacturacion === '' || Number(precioFacturacion) < 0) {
      nuevosErrores.precioFacturacion = 'Indique el precio de facturación base.';
    }

    if (!precioVentaReal || Number(precioVentaReal) <= 0) {
      nuevosErrores.precioVentaReal = 'Indique el precio de venta real acordado.';
    }

    if (modalidad === 'credito') {
      if (!numPlazos || Number(numPlazos) <= 0) {
        nuevosErrores.numPlazos = 'El número de plazos debe ser mayor a 0.';
      }
      if (cuotas.length === 0) {
        nuevosErrores.cuotas = 'Debe configurarse el cronograma de cuotas.';
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setIsSubmitting(true);
    setErrores({});

    try {
      const payloadVenta = {
        clienteId,
        productoId,
        cantidad: Math.max(1, parseInt(cantidad, 10) || 1),
        precioFacturacion: Number(precioFacturacion),
        precioVentaReal: Number(precioVentaReal),
        modalidad,
        fechaVenta,
        tipoPlazo,
        numPlazos: modalidad === 'credito' ? Math.max(1, parseInt(numPlazos, 10) || 1) : null,
        cuotas,
        moratoria_tipo: modalidad === 'credito' ? moratoriaTipo : null,
        moratoria_monto: modalidad === 'credito' ? (Number(moratoriaMonto) || 0) : 0,
      };

      let res;
      if (esEdicion) {
        res = await actualizarVenta(ventaToEdit.id, payloadVenta);
      } else {
        res = await procesarVenta(payloadVenta);
      }

      if (res?.success) {
        onClose();
      } else if (res?.errores) {
        setErrores(res.errores);
      }
    } catch (err) {
      console.error('Error al guardar venta:', err);
      setErrores({ global: 'Ocurrió un error al guardar la venta.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="modal-content-panel" style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* 1. ENCABEZADO */}
        <div className="modal-header-section" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ color: 'var(--color-violeta-neon, #a855f7)' }}>◆</span>
            {esEdicion ? 'Editar Registro de Venta' : 'Registrar Nueva Venta'}
          </h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
            {esEdicion
              ? 'Modifique cantidades, precios o cronograma de cuotas acordadas.'
              : 'Asocie un cliente con un producto, defina precios y configure cuotas si es a crédito.'}
          </p>
        </div>

        {errores.global && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errores.global}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* 2. DATOS GENERALES: CLIENTE, PRODUCTO Y CANTIDAD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Buscador de Cliente con Autocompletado (RF-32) */}
            <div className="form-group" ref={autocompleteRef} style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.35rem' }}>
                Cliente Titular *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o teléfono..."
                value={clienteBusqueda}
                onChange={(e) => {
                  setClienteBusqueda(e.target.value);
                  setClienteId('');
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  if (clienteBusqueda.trim()) setShowDropdown(true);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: errores.clienteId ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
              {errores.clienteId && <small style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.clienteId}</small>}

              {/* Menú de sugerencias */}
              {showDropdown && clientesFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#181430',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '8px',
                  zIndex: 200,
                  maxHeight: '180px',
                  overflowY: 'auto',
                  marginTop: '4px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                }}>
                  {clientesFiltrados.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => {
                        setClienteId(cli.id);
                        setClienteBusqueda(`${cli.nombre_completo || cli.nombre} (${cli.telefono || 'Sin tel'})`);
                        setShowDropdown(false);
                      }}
                      style={{
                        padding: '0.55rem 0.85rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.85rem',
                        color: '#fff',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <strong>{cli.nombre_completo || cli.nombre}</strong>
                      <small style={{ color: 'var(--text-muted, #94a3b8)', display: 'block', fontSize: '0.75rem' }}>
                        Tel: {cli.telefono || 'Sin teléfono'}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selector de Producto */}
            <div className="form-group">
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.35rem' }}>
                Producto en Inventario *
              </label>
              <select
                className="form-control"
                value={productoId}
                onChange={handleSelectProducto}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: errores.productoId ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              >
                <option value="">-- Seleccionar Producto --</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id} disabled={Number(p.stock) <= 0}>
                    {p.nombre} (Stock: {p.stock}) {Number(p.stock) <= 0 ? '- AGOTADO' : ''}
                  </option>
                ))}
              </select>
              {errores.productoId && <small style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.productoId}</small>}
            </div>

            {/* Cantidad a Vender con Control Estricto (RF-39) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
                  Cantidad a Vender *
                </label>
                {productoSeleccionado && (
                  <span style={{ fontSize: '0.74rem', color: stockDisponible > 0 ? 'var(--color-exito, #10b981)' : '#f43f5e' }}>
                    Disponible: {stockDisponible}
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={stockDisponible || 999}
                value={cantidad}
                onChange={handleCantidadChange}
                onBlur={handleCantidadBlur}
                placeholder="1"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: errores.cantidad ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: '#fff',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
              {errores.cantidad && <small style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '0.2rem', display: 'block' }}>{errores.cantidad}</small>}
            </div>
          </div>

          {/* 3. PRECIOS: FACTURACIÓN Y VENTA REAL (RF-34) */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.35rem' }}>
                  Precio de Facturación (Costo base) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }}>₡</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0.00"
                    value={precioFacturacion}
                    onChange={(e) => setPrecioFacturacion(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: errores.precioFacturacion ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '0.65rem 0.85rem 0.65rem 1.75rem',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                {errores.precioFacturacion && <small style={{ color: '#f43f5e', fontSize: '0.75rem' }}>{errores.precioFacturacion}</small>}
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.35rem' }}>
                  Precio de Venta Real *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-dorado, #f59e0b)', fontWeight: 700 }}>₡</span>
                  <input
                    type="number"
                    min="1"
                    step="100"
                    placeholder="0.00"
                    value={precioVentaReal}
                    onChange={(e) => setPrecioVentaReal(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: errores.precioVentaReal ? '1px solid #f43f5e' : '1px solid rgba(245,158,11,0.35)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '0.65rem 0.85rem 0.65rem 1.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
                {errores.precioVentaReal && <small style={{ color: '#f43f5e', fontSize: '0.75rem' }}>{errores.precioVentaReal}</small>}
              </div>

              {/* Indicador de Margen Proyectado */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>Margen / Ganancia</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: gananciaEstimada >= 0 ? 'var(--color-exito, #10b981)' : '#f43f5e' }}>
                  +{formatearMoneda(gananciaEstimada)} ({porcentajeMargen}%)
                </span>
                <small style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.74rem' }}>
                  Total venta: {formatearMoneda(totalVentaRealCalculado)}
                </small>
              </div>

            </div>
          </div>

          {/* 4. MODALIDAD: CONTADO O A CRÉDITO */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.45rem' }}>
              Modalidad de Pago *
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: modalidad === 'contado' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                background: modalidad === 'contado' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <input
                  type="radio"
                  name="modalidad"
                  value="contado"
                  checked={modalidad === 'contado'}
                  onChange={() => setModalidad('contado')}
                />
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.88rem' }}>Contado</strong>
                  <small style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>Pago total inmediato</small>
                </div>
              </label>

              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: modalidad === 'credito' ? '1px solid var(--color-dorado, #f59e0b)' : '1px solid rgba(255,255,255,0.1)',
                background: modalidad === 'credito' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <input
                  type="radio"
                  name="modalidad"
                  value="credito"
                  checked={modalidad === 'credito'}
                  onChange={() => setModalidad('credito')}
                />
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.88rem' }}>A Crédito</strong>
                  <small style={{ display: 'block', color: 'var(--text-muted, #94a3b8)', fontSize: '0.75rem' }}>Cuotas en plazos exactos</small>
                </div>
              </label>
            </div>
          </div>

          {/* 5. CONFIGURACIÓN DE CRÉDITO Y TABLA DINÁMICA */}
          {modalidad === 'credito' && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-dorado, #f59e0b)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Configuración de Crédito y Plazos
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                
                {/* Fecha de Inicio / Venta con CustomDatePicker */}
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }}>
                    Fecha Inicial de Venta *
                  </label>
                  <CustomDatePicker
                    id="input-fecha-venta"
                    value={fechaVenta}
                    onChange={(val) => setFechaVenta(val)}
                    placeholder="Seleccionar fecha..."
                  />
                </div>

                {/* Tipo de Plazo */}
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }}>
                    Tipo de Plazo *
                  </label>
                  <select
                    value={tipoPlazo}
                    onChange={(e) => setTipoPlazo(e.target.value)}
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
                    <option value="quincena">Quincena (15 días exactos)</option>
                    <option value="semana">Semana (7 días exactos)</option>
                    <option value="mes">Mes (30 días exactos)</option>
                  </select>
                </div>

                {/* Número de Plazos */}
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }}>
                    Número de Plazos / Cuotas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={numPlazos}
                    onChange={handleNumPlazosChange}
                    onBlur={handleNumPlazosBlur}
                    placeholder="1"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>

                {/* Política de Moratoria por Atraso */}
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '1rem',
                  background: 'rgba(234, 179, 8, 0.04)',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(234, 179, 8, 0.15)',
                  marginTop: '0.25rem',
                }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }}>
                      Período de Moratoria
                    </label>
                    <select
                      value={moratoriaTipo}
                      onChange={(e) => setMoratoriaTipo(e.target.value)}
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

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #cbd5e1)', display: 'block', marginBottom: '0.3rem' }}>
                      Recargo de Moratoria (₡ por período)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: 700 }}>₡</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0 (Sin moratoria)"
                        value={moratoriaMonto}
                        onChange={(e) => setMoratoriaMonto(e.target.value)}
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

              </div>

              {/* 6. TABLA DINÁMICA DE CUOTAS EDITABLES */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    Cronograma de Cuotas Acordadas (Haz clic para editar el monto real de cualquier cuota)
                  </span>
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    background: Math.abs(diferenciaCuotas) < 1 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                    color: Math.abs(diferenciaCuotas) < 1 ? 'var(--color-exito, #10b981)' : 'var(--color-alerta-ambar-suave, #fbbf24)',
                  }}>
                    {Math.abs(diferenciaCuotas) < 1 ? '✓ Balance Exacto' : `Diferencia: ₡${diferenciaCuotas.toFixed(2)}`}
                  </span>
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary, #cbd5e1)', textAlign: 'left' }}>
                        <th style={{ padding: '0.55rem 0.75rem', width: '60px' }}>N°</th>
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
              </div>

            </div>
          )}

          {/* 7. ACCIONES DEL MODAL */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-action"
              disabled={isSubmitting}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary-action"
              disabled={isSubmitting}
              style={{
                background: 'var(--gradient-electric, linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%))',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.5rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
              }}
            >
              {isSubmitting ? 'Guardando...' : esEdicion ? 'Guardar Cambios de Venta' : 'Confirmar y Procesar Venta'}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}

// Re-export compatible para cualquier referencia previa a OrderModal
export const OrderModal = ModalRegistrarVenta;
