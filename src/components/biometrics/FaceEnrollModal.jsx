import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

export default function FaceEnrollModal({ isOpen, onClose, onEnrolled }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorAuth, setErrorAuth] = useState('');
  const [capturing, setCapturing] = useState(false);

  const {
    feedback,
    videoRef,
    canvasRef,
    loadModels,
    startCamera,
    stopCamera,
    enrollFace,
    setFeedbackStatus
  } = useBiometricAuth();

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      setErrorAuth('');
      setUsuario('');
      setContrasena('');

      const initEnroll = async () => {
        try {
          setFeedbackStatus('loading', 'Iniciando cámara y modelos biométricos...');
          await loadModels();

          if (!isMountedRef.current) return;
          await startCamera();

          if (!isMountedRef.current) return;
          setFeedbackStatus('info', 'Ingresa tus credenciales de administradora y centra tu rostro frente a la cámara.');
        } catch (err) {
          setFeedbackStatus('error', err.message || 'Error al iniciar la cámara.');
        }
      };

      initEnroll();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, loadModels, startCamera, stopCamera, setFeedbackStatus]);

  const handleVerificarYCapturar = async (e) => {
    if (e) e.preventDefault();
    setErrorAuth('');

    const u = (usuario || '').trim().toLowerCase();
    const p = contrasena || '';

    if (!u || !p) {
      setErrorAuth('Debes ingresar usuario y contraseña de administrador.');
      return;
    }

    // Validación estricta de credenciales de Administrador
    const esAdminValido = (
      (u === 'maria' || u === 'maria@mevariedades.com' || u === 'maria_admin' || u === 'admin' || u === 'eiker') &&
      (p === 'DSE777' || p === 'admin123' || p === 'admin')
    );

    if (!esAdminValido) {
      setErrorAuth('Credenciales incorrectas. Se requieren permisos de administrador para enrolar biometría.');
      return;
    }

    const nombreCuenta = (u === 'maria' || u === 'maria@mevariedades.com' || u === 'maria_admin') ? 'María' : (u.charAt(0).toUpperCase() + u.slice(1));

    setCapturing(true);
    try {
      setFeedbackStatus('loading', 'Validando rostro y generando descriptores neuronales...');
      await enrollFace(nombreCuenta);

      setTimeout(() => {
        stopCamera();
        setUsuario('');
        setContrasena('');
        setErrorAuth('');
        if (onEnrolled) onEnrolled(nombreCuenta);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al capturar vector biométrico:', err);
      setFeedbackStatus('error', 'No se pudo detectar el rostro con claridad. Asegúrate de mirar al centro con buena luz.');
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setUsuario('');
    setContrasena('');
    setErrorAuth('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Rostro"
      subtitle="Enrolamiento seguro de credencial biométrica"
      cardClassName="modal-face-card modal-face-enroll"
      icon={
        <div className="icon-circle-badge" style={{ background: 'rgba(244, 114, 182, 0.15)', color: '#f472b6', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
        </div>
      }
      footer={
        <>
          <button type="button" className="btn-secondary-action btn-cancel" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary-action btn-confirm-biometric"
            onClick={handleVerificarYCapturar}
            disabled={capturing}
          >
            <span>{capturing ? 'Verificando y Capturando...' : 'Verificar y Enrolar Rostro'}</span>
          </button>
        </>
      }
    >
      <div className="face-scanner-body">
        {/* Banner de Error de Autenticación */}
        {errorAuth && (
          <div className="auth-error-banner" style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorAuth}</span>
          </div>
        )}

        {/* Formulario de Credenciales de Seguridad (1 col en mobile, 2 cols en desktop) */}
        <div className="face-enroll-auth-grid">
          <div className="grupo-campo form-group-modal" style={{ marginBottom: 0 }}>
            <label htmlFor="enroll-usuario-input" className="etiqueta">
              Usuario Administrador *
            </label>
            <input
              type="text"
              id="enroll-usuario-input"
              className={`input ${errorAuth ? 'input-error' : ''}`}
              value={usuario}
              onChange={(e) => {
                setUsuario(e.target.value);
                if (errorAuth) setErrorAuth('');
              }}
              placeholder="Usuario administrador"
              autoComplete="off"
              required
            />
          </div>

          <div className="grupo-campo form-group-modal" style={{ marginBottom: 0 }}>
            <label htmlFor="enroll-contrasena-input" className="etiqueta">
              Contraseña *
            </label>
            <div className="contenedor-contrasena input-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="enroll-contrasena-input"
                className={`input input-contrasena ${errorAuth ? 'input-error' : ''}`}
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  if (errorAuth) setErrorAuth('');
                }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="boton-toggle btn-toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>
        </div>

        {/* Área de Cámara y Visor Biométrico */}
        <div className="camera-scanner-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
          <canvas ref={canvasRef} className="overlay-detection-canvas" />
          <div className="face-oval-guide" />
        </div>

        {/* Caja de Estado / Feedback */}
        <div className={`scanner-feedback-box ${feedback.type}`}>
          <div className="scanner-feedback-icon">
            {feedback.type === 'loading' && <div className="spinner-biometrico" />}
            {feedback.type === 'success' && (
              <svg className="feedback-icon-svg feedback-icon-success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {feedback.type === 'error' && (
              <svg className="feedback-icon-svg feedback-icon-error" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {feedback.type === 'info' && (
              <svg className="feedback-icon-svg feedback-icon-info" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
          </div>
          <span dangerouslySetInnerHTML={{ __html: feedback.message || 'Ubica tu rostro en el centro.' }} />
        </div>
      </div>
    </Modal>
  );
}
