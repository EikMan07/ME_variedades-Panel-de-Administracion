import { useState, useEffect, useRef } from 'react';
import { useClients } from '../../context/ClientContext';
import { useFacturas } from '../../context/FacturasContext';
import { useToast } from '../common/Toast';
import { formatBytes } from './facturasUtils';
import CustomDatePicker from '../common/CustomDatePicker';
import Modal from '../common/Modal';
import ModalCapturaCamara from './ModalCapturaCamara';
import { extraerDatosComprobante } from '../../services/receiptOcrService';

/**
 * Modal para digitalizar y subir una nueva Factura o Comprobante con OCR inteligente.
 */
export default function ModalNuevaFactura({ isOpen, onClose, clientePreseleccionado = null }) {
  const { clientes } = useClients();
  const { agregarFactura } = useFacturas();
  const { showToast } = useToast();

  const fileInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrSuccess, setOcrSuccess] = useState(false);

  const initialForm = {
    clienteBusqueda: '',
    cliente_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    tipo_categoria: 'pedidos',
    referencia_id: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    monto: '',
    archivo_nombre: '',
    archivo_tipo: 'image',
    archivo_data: null,
    archivo_size: 0,
    notas: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errores, setErrores] = useState({});
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsOcrAnalyzing(false);
      setOcrSuccess(false);
      setOcrStatus('');
      if (clientePreseleccionado) {
        setForm({
          ...initialForm,
          cliente_id: clientePreseleccionado.id,
          cliente_nombre: clientePreseleccionado.nombre_completo,
          cliente_telefono: clientePreseleccionado.telefono || '',
          clienteBusqueda: `${clientePreseleccionado.nombre_completo}${clientePreseleccionado.telefono ? ` (${clientePreseleccionado.telefono})` : ''}`
        });
      } else {
        setForm(initialForm);
      }
      setErrores({});
      setShowAutocomplete(false);
    }
  }, [isOpen, clientePreseleccionado]);

  // Cerrar autocomplete al hacer clic fuera
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
      cliente_nombre: valor,
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

  // Extracción automática OCR / Visión de datos en segundo plano
  const ejecutarOcrComprobante = async (fileOrDataUrl) => {
    if (!fileOrDataUrl) return;

    try {
      setIsOcrAnalyzing(true);
      setOcrSuccess(false);
      setOcrStatus('Analizando comprobante...');

      const resultado = await extraerDatosComprobante(fileOrDataUrl, (progreso, msg) => {
        setOcrStatus(msg);
      });

      if (resultado && (resultado.referenceNumber || resultado.amount || resultado.date)) {
        setForm(prev => ({
          ...prev,
          referencia_id: resultado.referenceNumber || prev.referencia_id,
          monto: resultado.amount !== null && resultado.amount !== undefined ? String(resultado.amount) : prev.monto,
          fecha_emision: resultado.date || prev.fecha_emision
        }));
        setOcrSuccess(true);

        const detalles = [];
        if (resultado.referenceNumber) detalles.push(`Ref: ${resultado.referenceNumber}`);
        if (resultado.amount) detalles.push(`Monto: ₡${resultado.amount.toLocaleString('es-CR')}`);
        if (resultado.date) detalles.push(`Fecha: ${resultado.date}`);

        showToast({
          tipo: 'success',
          mensaje: `Comprobante analizado: ${detalles.join(' | ')}`
        });
      }
    } catch (err) {
      console.warn('Escaneo de comprobante completado sin datos detectados:', err);
    } finally {
      setIsOcrAnalyzing(false);
    }
  };

  // Procesamiento del archivo a Base64 Data URL
  const procesarArchivo = (file) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      setErrores(prev => ({
        ...prev,
        archivo_data: 'Formato no admitido. Sube una imagen (PNG, JPG, WEBP) o un documento PDF.'
      }));
      return;
    }

    // Límite de 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrores(prev => ({
        ...prev,
        archivo_data: 'El archivo supera el límite de 5 MB. Intenta con un archivo más ligero.'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setForm(prev => ({
        ...prev,
        archivo_nombre: file.name,
        archivo_tipo: isPdf ? 'pdf' : 'image',
        archivo_data: dataUrl,
        archivo_size: file.size,
      }));
      setErrores(prev => ({ ...prev, archivo_data: null }));

      // Ejecutar OCR en segundo plano si es imagen
      if (isImg) {
        ejecutarOcrComprobante(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleRemoveFile = () => {
    setForm(prev => ({
      ...prev,
      archivo_nombre: '',
      archivo_tipo: 'image',
      archivo_data: null,
      archivo_size: 0,
    }));
    setOcrSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFotoDesdeCamara = ({ archivo_nombre, archivo_tipo, archivo_data, archivo_size }) => {
    setForm(prev => ({
      ...prev,
      archivo_nombre,
      archivo_tipo,
      archivo_data,
      archivo_size,
    }));
    setErrores(prev => ({ ...prev, archivo_data: null }));
    showToast({
      tipo: 'success',
      mensaje: 'Fotografía capturada y adjuntada.'
    });
    ejecutarOcrComprobante(archivo_data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const resultado = await agregarFactura(form);
      if (resultado && !resultado.success) {
        if (resultado.errores) setErrores(resultado.errores);
        else if (resultado.error) showToast({ tipo: 'error', mensaje: resultado.error });
        return;
      }

      showToast({
        tipo: 'success',
        mensaje: 'Comprobante digitalizado y guardado exitosamente.'
      });

      setForm(initialForm);
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar comprobante:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al digitalizar el comprobante. Por favor intenta de nuevo.'
      });
    }
  };

  const iconoModal = (
    <div className="icon-circle-badge gold-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nueva Factura o Comprobante"
        subtitle="Carga y almacenamiento digital de comprobantes fiscales y recibos"
        icon={iconoModal}
        cardClassName="modal-card-lg"
        footer={
          <>
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-factura"
              className="btn-primary-action"
              id="btn-guardar-factura"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>Guardar Comprobante</span>
            </button>
          </>
        }
      >
        <form id="form-factura" onSubmit={handleSubmit} noValidate>
          {/* Selector de Cliente con Autocomplete */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-cliente-factura">
              Cliente Asociado <span className="required-star">*</span>
            </label>
            <div className="autocomplete-wrapper" ref={autocompleteRef}>
              <input
                id="input-cliente-factura"
                type="text"
                className={`input-form ${errores.cliente_id ? 'input-error' : ''}`}
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
          </div>

          {/* Fila: Categoría / Tipo e Identificador */}
          <div className="form-row-2col">
            {/* Tipo / Categoría */}
            <div className="form-group">
              <label className="form-label" htmlFor="select-tipo-factura">
                Categoría / Módulo <span className="required-star">*</span>
              </label>
              <select
                id="select-tipo-factura"
                className="select-glass input-form"
                value={form.tipo_categoria}
                onChange={(e) => handleChange('tipo_categoria', e.target.value)}
              >
                <option value="pedidos">Facturas de Pedidos</option>
                <option value="pagos">Pagos y Cuentas</option>
                <option value="cobros">Comprobantes de Cobros</option>
                <option value="prestamos">Comprobantes de Préstamos</option>
              </select>
            </div>

            {/* Identificador / Referencia con OCR */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-ref-factura" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Referencia o N° Documento</span>
                {isOcrAnalyzing && (
                  <span className="ocr-detection-badge ocr-badge-scanning" title={ocrStatus}>
                    <span className="ocr-mini-spinner" />
                    <span>Detectando...</span>
                  </span>
                )}
                {ocrSuccess && !isOcrAnalyzing && (
                  <span className="ocr-detection-badge ocr-badge-success" title="Referencia detectada automáticamente por OCR">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Detectado</span>
                  </span>
                )}
              </label>
              <input
                id="input-ref-factura"
                type="text"
                className="input-form"
                placeholder={isOcrAnalyzing ? 'Escaneando comprobante...' : 'Ej: #PED-001, Factura #458, SINPE #1234'}
                value={form.referencia_id}
                onChange={(e) => {
                  handleChange('referencia_id', e.target.value);
                  if (ocrSuccess) setOcrSuccess(false);
                }}
              />
            </div>
          </div>

          {/* Fila: Fecha de Emisión y Monto */}
          <div className="form-row-2col">
            {/* Fecha de Emisión */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-fecha-emision">
                Fecha de Emisión / Recepción <span className="required-star">*</span>
              </label>
              <CustomDatePicker
                id="input-fecha-emision"
                value={form.fecha_emision}
                onChange={(val) => handleChange('fecha_emision', val)}
                hasError={!!errores.fecha_emision}
                placeholder="Seleccionar fecha..."
              />
              {errores.fecha_emision && (
                <span className="input-error-msg visible">{errores.fecha_emision}</span>
              )}
            </div>

            {/* Monto Asociado (Opcional) */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-monto-factura">
                Monto Asociado (₡) (Opcional)
              </label>
              <div className="input-icon-wrapper">
                <input
                  id="input-monto-factura"
                  type="number"
                  min="0"
                  step="any"
                  className="input-form"
                  placeholder="0"
                  value={form.monto}
                  onChange={(e) => handleChange('monto', e.target.value)}
                />
                <span className="input-icon-suffix">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Carga de Archivos / Cámara */}
          <div className="form-group">
            <label className="form-label">
              Documento o Imagen Adjunta <span className="required-star">*</span>
            </label>

            {/* Input Oculto de Archivos / Galería */}
            <input
              type="file"
              id="file-input-gallery"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
            />

            {!form.archivo_data ? (
              <div
                className={`file-upload-dropzone ${isDragging ? 'has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="file-upload-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <div className="file-upload-title">
                  Arrastra tu archivo aquí o haz clic para explorar
                </div>
                <div className="file-upload-subtitle">
                  Admite imágenes (PNG, JPG, WEBP) o documentos PDF hasta 5 MB
                </div>

                <div className="file-upload-options-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-upload-subaction"
                    id="btn-open-gallery"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Galería / Archivos</span>
                  </button>

                  <button
                    type="button"
                    className="btn-upload-subaction"
                    id="btn-open-camera"
                    onClick={() => setIsCameraModalOpen(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Cámara Directa</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="uploaded-preview-container">
                {form.archivo_tipo === 'image' ? (
                  <img src={form.archivo_data} alt="Vista previa" className="uploaded-thumb-mini" />
                ) : (
                  <div style={{ width: 48, height: 48, background: 'rgba(244, 180, 200, 0.15)', border: '1px solid rgba(244, 180, 200, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4b4c8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                  </div>
                )}

                <div className="uploaded-info-text">
                  <span className="uploaded-name">{form.archivo_nombre}</span>
                  <span className="uploaded-meta">
                    {form.archivo_tipo === 'pdf' ? 'Documento PDF' : 'Imagen'} • {formatBytes(form.archivo_size)}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-remove-uploaded"
                  onClick={handleRemoveFile}
                  title="Quitar archivo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}

            {errores.archivo_data && (
              <span className="input-error-msg visible">{errores.archivo_data}</span>
            )}
          </div>

          {/* Notas / Observaciones */}
          <div className="form-group">
            <label className="form-label" htmlFor="input-notas-factura">
              Notas u Observaciones (Opcional)
            </label>
            <input
              id="input-notas-factura"
              type="text"
              className="input-form"
              placeholder="Ej: Factura timbrada, comprobante de transferencia confirmado..."
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal Independiente de Captura de Cámara en Vivo */}
      <ModalCapturaCamara
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onFotoAceptada={handleFotoDesdeCamara}
      />
    </>
  );
}
