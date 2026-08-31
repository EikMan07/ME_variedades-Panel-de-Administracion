import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../common/Modal';

/**
 * Modal de Captura de Cámara en Vivo para comprobantes y facturas.
 * Utiliza navigator.mediaDevices.getUserMedia para fotos instantáneas.
 */
export default function ModalCapturaCamara({ isOpen, onClose, onFotoAceptada }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [fotoSize, setFotoSize] = useState(0);
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState(null);

  // Detener la cámara activa
  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Iniciar la transmisión de la cámara
  const iniciarCamara = useCallback(async (mode) => {
    detenerCamara();
    setErrorCamara(null);
    setCargandoCamara(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorCamara('Tu navegador o dispositivo no admite acceso a la cámara en vivo.');
      setCargandoCamara(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Detectar si hay más de una cámara
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {
        setHasMultipleCameras(false);
      }

      setCargandoCamara(false);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      let mensaje = 'No se pudo acceder a la cámara. ';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        mensaje += 'Por favor permite el acceso a la cámara en los permisos de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        mensaje += 'No se encontró ningún dispositivo de cámara conectado.';
      } else {
        mensaje += 'Verifica que otra aplicación no esté utilizando la cámara.';
      }
      setErrorCamara(mensaje);
      setCargandoCamara(false);
    }
  }, [detenerCamara]);

  // Al abrir o cerrar el modal
  useEffect(() => {
    if (isOpen) {
      setFotoCapturada(null);
      setFotoSize(0);
      iniciarCamara(facingMode);
    } else {
      detenerCamara();
    }

    return () => {
      detenerCamara();
    };
  }, [isOpen, facingMode, iniciarCamara, detenerCamara]);

  // Alternar entre cámara trasera y frontal
  const handleToggleCamara = () => {
    const nuevoModo = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nuevoModo);
  };

  // Capturar snapshot del video
  const handleCapturarFoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Si es cámara frontal, opcionalmente espejar
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    // Tamaño estimado en bytes
    const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
    const sizeInBytes = Math.round((base64Length * 3) / 4);

    setFotoCapturada(dataUrl);
    setFotoSize(sizeInBytes);
    detenerCamara();
  };

  // Repetir toma
  const handleRepetirFoto = () => {
    setFotoCapturada(null);
    setFotoSize(0);
    iniciarCamara(facingMode);
  };

  // Aceptar foto tomada
  const handleUsarFoto = () => {
    if (!fotoCapturada) return;

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const nombreArchivo = `foto_comprobante_${timestamp}.jpg`;

    onFotoAceptada({
      archivo_nombre: nombreArchivo,
      archivo_tipo: 'image',
      archivo_data: fotoCapturada,
      archivo_size: fotoSize,
    });

    detenerCamara();
    onClose();
  };

  const iconoModal = (
    <div className="icon-circle-badge gold-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        detenerCamara();
        onClose();
      }}
      title="Cámara Directa — Capturar Comprobante"
      subtitle={fotoCapturada ? 'Revisa la fotografía tomada antes de guardarla' : 'Enfoca la factura, recibo o comprobante'}
      icon={iconoModal}
      cardClassName="modal-card-lg"
      footer={
        fotoCapturada ? (
          <>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={handleRepetirFoto}
              id="btn-camara-repetir"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 .49-3.52"></path>
              </svg>
              <span>Repetir Foto</span>
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handleUsarFoto}
              id="btn-camara-usar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Usar Esta Foto</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => {
                detenerCamara();
                onClose();
              }}
            >
              Cancelar
            </button>
            {hasMultipleCameras && !errorCamara && (
              <button
                type="button"
                className="btn-secondary-action"
                onClick={handleToggleCamara}
                title="Cambiar entre cámara trasera y frontal"
                id="btn-camara-toggle"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                <span>Cambiar Cámara</span>
              </button>
            )}
          </>
        )
      }
    >
      <div className="camera-modal-content">
        {/* Error de Cámara */}
        {errorCamara && (
          <div className="camera-error-banner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Error de Acceso a Cámara</strong>
              <p>{errorCamara}</p>
            </div>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => iniciarCamara(facingMode)}
              style={{ marginTop: '0.5rem' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Visor de Video en Vivo */}
        {!fotoCapturada && !errorCamara && (
          <div className="camera-viewport-container">
            {cargandoCamara && (
              <div className="camera-loading-overlay">
                <div className="spinner-gold"></div>
                <span>Conectando con la cámara...</span>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-live-video"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Guías de Encuadre */}
            <div className="camera-frame-guides">
              <span className="camera-guide-corner top-left"></span>
              <span className="camera-guide-corner top-right"></span>
              <span className="camera-guide-corner bottom-left"></span>
              <span className="camera-guide-corner bottom-right"></span>
            </div>

            {/* Badge En Vivo */}
            <div className="camera-live-badge">
              <span className="camera-live-dot"></span>
              <span>Cámara Activa</span>
            </div>

            {/* Botón Central de Obturador */}
            {!cargandoCamara && (
              <div className="camera-shutter-bar">
                <button
                  type="button"
                  className="btn-camera-shutter"
                  onClick={handleCapturarFoto}
                  title="Capturar Foto"
                  id="btn-camara-capturar"
                >
                  <div className="shutter-inner-circle"></div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vista Previa de la Foto Capturada */}
        {fotoCapturada && (
          <div className="camera-preview-container">
            <img src={fotoCapturada} alt="Foto capturada" className="camera-captured-img" />
            <div className="camera-preview-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Foto Capturada</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
