import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import { useProducts } from '../../context/ProductContext';
import { useToast } from '../common/Toast';

function ProductFormContent({ productToEdit, onClose }) {
  const { agregarProducto, actualizarProducto } = useProducts();
  const { showToast } = useToast();

  const [nombre, setNombre] = useState(() => productToEdit?.nombre || '');
  const [tipo, setTipo] = useState(() => productToEdit?.tipo || '');
  const [genero, setGenero] = useState(() => productToEdit?.genero || '');
  const [costo, setCosto] = useState(() => (productToEdit?.costo !== undefined ? String(productToEdit.costo) : ''));
  const [stock, setStock] = useState(() => (productToEdit?.stock !== undefined ? String(productToEdit.stock) : ''));
  const [imagenUrl, setImagenUrl] = useState(() => productToEdit?.imagen_url || '');
  const [errores, setErrores] = useState({});
  const [nombreFeedback, setNombreFeedback] = useState('');

  // Estados de la Cámara WebRTC Nativa
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detener la cámara y liberar el hardware
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
    setCameraError('');
  }, []);

  // Limpieza al desmontar o cerrar modal
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Iniciar cámara usando WebRTC getUserMedia
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador o dispositivo no admite acceso directo a la cámara.');
      setCameraLoading(false);
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback genérico para Smart TVs o dispositivos con constraints estrictos
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Conectar stream al elemento video una vez que el DOM esté listo
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch((err) => {
            console.warn('Error en video.play():', err);
          });
        }
      }, 50);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Habilita los permisos en tu navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No se detectó ninguna cámara disponible en el dispositivo.');
      } else {
        setCameraError(`No se pudo iniciar la cámara: ${err.message || 'Error desconocido'}`);
      }
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Alternar entre cámara frontal y trasera (móviles / tablets)
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Capturar fotograma actual del stream de video en un canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setImagenUrl(dataUrl);
      showToast('Fotografía capturada exitosamente', 'success');
    }

    stopCameraStream();
  };

  // Manejador de subida desde Galería / Explorador de archivos
  const handleImageFile = (e) => {
    stopCameraStream();
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setImagenUrl(uploadEvent.target.result);
      showToast('Imagen cargada correctamente', 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 1. Manejo del input "Nombre del Producto": solo letras y espacios
  const handleNombreChange = (e) => {
    const rawValue = e.target.value;

    // Detectar números o caracteres especiales no permitidos
    if (/\d/.test(rawValue)) {
      setNombreFeedback('El nombre solo debe contener letras y espacios, no números.');
    } else if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(rawValue)) {
      setNombreFeedback('No se permiten caracteres especiales ni símbolos.');
    } else {
      setNombreFeedback('');
    }

    // Filtrar estrictamente: conservar solo letras del alfabeto y espacios
    const sanitized = rawValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    setNombre(sanitized);

    if (errores.producto_nombre) {
      setErrores((prev) => ({ ...prev, producto_nombre: '' }));
    }
  };

  const handleNombreKeyDown = (e) => {
    // Teclas de navegación y edición permitidas
    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) {
      return;
    }

    // Bloquear números con aviso inmediato
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
      setNombreFeedback('El nombre solo debe contener letras y espacios, no números.');
      return;
    }

    // Bloquear caracteres que no sean letras ni espacios
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key)) {
      e.preventDefault();
      setNombreFeedback('No se permiten caracteres especiales ni símbolos.');
      return;
    }
  };

  const handleTipoChange = (e) => {
    const nuevoTipo = e.target.value;
    setTipo(nuevoTipo);
    if (nuevoTipo === 'maquillaje') {
      setGenero('');
      if (errores.producto_genero) {
        setErrores((prev) => ({ ...prev, producto_genero: '' }));
      }
    }
    if (errores.producto_tipo) {
      setErrores((prev) => ({ ...prev, producto_tipo: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    stopCameraStream();

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      setErrores((prev) => ({ ...prev, producto_nombre: 'El nombre del producto es obligatorio.' }));
      return;
    }

    const datos = {
      nombre: trimmedNombre,
      tipo,
      genero: tipo === 'maquillaje' ? null : genero,
      costo: costo !== '' ? parseFloat(costo) : null,
      stock: stock !== '' ? parseInt(stock, 10) : null,
      imagen_url: imagenUrl || null,
    };

    try {
      if (productToEdit) {
        const res = await actualizarProducto(productToEdit.id, datos);
        if (res && !res.success) {
          setErrores(res.errores || {});
          return;
        }
        showToast({
          tipo: 'success',
          mensaje: 'Producto actualizado exitosamente.'
        });
      } else {
        const res = await agregarProducto(datos);
        if (res && !res.success) {
          setErrores(res.errores || {});
          return;
        }
        showToast({
          tipo: 'success',
          mensaje: 'Producto registrado exitosamente.'
        });
      }

      // Resetear campos y cerrar modal inmediatamente
      setNombre('');
      setTipo('');
      setGenero('');
      setCosto('');
      setStock('');
      setImagenUrl('');
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar producto:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al guardar el producto. Por favor intenta de nuevo.'
      });
    }
  };

  const handleCancel = () => {
    stopCameraStream();
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <form id="form-producto" className="product-form-container product-modal-body modal-product-grid modal-form-grid" onSubmit={handleSubmit} noValidate>
      <div className="photo-upload-container photo-column product-photo-section">
        <label className="form-label">Foto del Producto</label>

        <div className={`image-preview-box product-photo-dropzone ${isCameraActive ? 'camera-active-mode' : ''}`}>
            {isCameraActive ? (
              <div className="camera-live-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-stream"
                />
                <div className="camera-live-indicator">
                  <span className="camera-live-dot"></span>
                  <span>CÁMARA EN VIVO</span>
                </div>
              </div>
            ) : cameraLoading ? (
              <div className="image-placeholder-content">
                <div className="spinner"></div>
                <span className="camera-status-text">Conectando con la cámara...</span>
              </div>
            ) : imagenUrl ? (
              <div className="image-preview-wrapper">
                <img src={imagenUrl} alt="Previsualización del producto" className="preview-product-img" />
              </div>
            ) : (
              <div className="image-placeholder-content">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Toma una foto o sube una imagen</span>
              </div>
            )}
          </div>

          {/* Mensaje de error de cámara si ocurre */}
          {cameraError && (
            <div className="camera-error-banner" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{cameraError}</span>
            </div>
          )}

          {/* Controles de Foto / Cámara */}
          {isCameraActive ? (
            <div className="camera-active-controls">
              <button
                type="button"
                className="btn-camera-snap"
                onClick={capturePhoto}
                title="Capturar foto ahora"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4" fill="currentColor"></circle>
                </svg>
                <span>Capturar foto</span>
              </button>

              <div className="camera-sub-controls">
                <button
                  type="button"
                  className="btn-camera-tool"
                  onClick={toggleCameraFacing}
                  title="Cambiar entre cámara trasera y frontal"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                  <span>Girar cámara</span>
                </button>

                <button
                  type="button"
                  className="btn-camera-tool btn-camera-cancel"
                  onClick={stopCameraStream}
                  title="Cerrar vista de cámara"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="photo-actions-row product-photo-actions">
              <button
                type="button"
                className="btn-photo-action btn-upload-action btn-camera-trigger"
                onClick={() => startCamera()}
                title="Acceder a la cámara del dispositivo"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Cámara</span>
              </button>

              <button
                type="button"
                className="btn-photo-action btn-upload-action btn-gallery-trigger"
                onClick={() => fileInputRef.current?.click()}
                title="Subir imagen desde galería o archivos"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>Galería</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                id="input-foto-galeria"
                accept="image/*"
                onChange={handleImageFile}
                style={{ display: 'none' }}
              />

              {imagenUrl && (
                <button
                  type="button"
                  className="btn-photo-action btn-photo-remove"
                  onClick={() => setImagenUrl('')}
                  title="Eliminar fotografía"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            Columna / Sección: Campos del Formulario
           ======================================================== */}
        <div className="fields-column product-form-fields">
          {/* Campo 1: Nombre del Producto (Validación estricta de letras y espacios) */}
          <div className="form-group form-group-modal">
            <label htmlFor="producto_nombre" className="form-label">
              Nombre del Producto <span className="required-star">*</span>
            </label>
            <div className="input-feedback-container">
              <input
                type="text"
                id="producto_nombre"
                className={`input-form ${errores.producto_nombre || nombreFeedback ? 'input-error' : ''}`}
                placeholder="Ej. Perfume Bella Rosa"
                value={nombre}
                onChange={handleNombreChange}
                onKeyDown={handleNombreKeyDown}
                autoComplete="off"
                aria-invalid={Boolean(errores.producto_nombre || nombreFeedback)}
                aria-describedby="feedback_producto_nombre"
              />
              {nombreFeedback && (
                <div id="feedback_producto_nombre" className="input-warning-msg visible">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{nombreFeedback}</span>
                </div>
              )}
              {errores.producto_nombre && !nombreFeedback && (
                <div id="feedback_producto_nombre" className="input-error-msg visible">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <span>{errores.producto_nombre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Campo 2: Tipo de Producto */}
          <div className="form-group form-group-modal">
            <label htmlFor="producto_tipo" className="form-label">
              Tipo de Producto <span className="required-star">*</span>
            </label>
            <select
              id="producto_tipo"
              className={`select-glass select-form ${errores.producto_tipo ? 'input-error' : ''}`}
              value={tipo}
              onChange={handleTipoChange}
            >
              <option value="">Selecciona tipo...</option>
              <option value="perfume">Perfume</option>
              <option value="camisa">Camisa</option>
              <option value="short">Short</option>
              <option value="pantalón">Pantalón</option>
              <option value="vestido">Vestido</option>
              <option value="zapato">Zapato</option>
              <option value="crocs">Crocs</option>
              <option value="maquillaje">Maquillaje</option>
              <option value="accesorio">Accesorio</option>
              <option value="aparato electrónico">Aparato electrónico</option>
            </select>
            {errores.producto_tipo && (
              <span className="input-error-msg visible">{errores.producto_tipo}</span>
            )}
          </div>

          {/* Campo 3: Género (Omitido para categoría maquillaje) */}
          {tipo !== 'maquillaje' && (
            <div className="form-group form-group-modal">
              <label htmlFor="producto_genero" className="form-label">
                Género <span className="required-star">*</span>
              </label>
              <select
                id="producto_genero"
                className={`select-glass select-form ${errores.producto_genero ? 'input-error' : ''}`}
                value={genero}
                onChange={(e) => {
                  setGenero(e.target.value);
                  if (errores.producto_genero) setErrores((prev) => ({ ...prev, producto_genero: '' }));
                }}
              >
                <option value="">Selecciona género...</option>
                <option value="Mujer">Mujer</option>
                <option value="Hombre">Hombre</option>
                <option value="Unisex">Unisex</option>
              </select>
              {errores.producto_genero && (
                <span className="input-error-msg visible">{errores.producto_genero}</span>
              )}
            </div>
          )}

          {/* Fila Doble: Costo y Stock Inicial */}
          <div className="form-row-2 product-pricing-row">
            <div className="form-group form-group-modal">
              <label htmlFor="producto_costo" className="form-label">
                Costo / Precio (₡) <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="producto_costo"
                className={`input-form ${errores.producto_costo ? 'input-error' : ''}`}
                placeholder="Ej. 28000"
                min="1"
                step="100"
                value={costo}
                onChange={(e) => {
                  setCosto(e.target.value);
                  if (errores.producto_costo) setErrores((prev) => ({ ...prev, producto_costo: '' }));
                }}
              />
              {errores.producto_costo && (
                <span className="input-error-msg visible">{errores.producto_costo}</span>
              )}
            </div>

            <div className="form-group form-group-modal">
              <label htmlFor="producto_stock" className="form-label">
                Stock Inicial <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="producto_stock"
                className={`input-form ${errores.producto_stock ? 'input-error' : ''}`}
                placeholder="Ej. 10"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (errores.producto_stock) setErrores((prev) => ({ ...prev, producto_stock: '' }));
                }}
              />
              {errores.producto_stock && (
                <span className="input-error-msg visible">{errores.producto_stock}</span>
              )}
            </div>
          </div>
        </div>

      {/* ========================================================
          Footer del Modal con Botones de Acción
         ======================================================== */}
      <div className="product-modal-footer">
        <button type="button" className="btn-secondary-action" onClick={handleCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary-action">
          <span>{productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}</span>
        </button>
      </div>
    </form>
  );
}

export default function ProductModal({ isOpen, onClose, productToEdit }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto' : 'Registrar Nuevo Producto'}
      subtitle={
        productToEdit
          ? 'Actualiza los detalles del artículo, fotografía y su stock disponible.'
          : 'Especifica los detalles del artículo, imagen e inventario inicial.'
      }
      cardClassName="modal-card-large modal-product-dialog modal-product product-modal-container"
      icon={
        <div className="icon-circle-badge rose-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          </svg>
        </div>
      }
    >
      <ProductFormContent
        key={productToEdit ? `edit-${productToEdit.id}` : 'new-product'}
        productToEdit={productToEdit}
        onClose={onClose}
      />
    </Modal>
  );
}
