import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

export default function FaceEnrollModal({ isOpen, onClose, onEnrolled }) {
  const [nombre, setNombre] = useState('María');
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
      const initEnroll = async () => {
        try {
          setFeedbackStatus('loading', 'Cargando modelos biométricos...');
          await loadModels();

          if (!isMountedRef.current) return;

          setFeedbackStatus('loading', 'Iniciando cámara para captura...');
          await startCamera();

          if (!isMountedRef.current) return;

          setFeedbackStatus('info', 'Centra tu rostro con buena iluminación y presiona "Capturar y Guardar".');
        } catch (err) {
          setFeedbackStatus('error', err.message);
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

  const handleCapture = async () => {
    setCapturing(true);
    try {
      await enrollFace(nombre);
      setTimeout(() => {
        stopCamera();
        if (onEnrolled) onEnrolled(nombre);
        onClose();
      }, 1500);
    } catch {
      // Error manejado en hook
    } finally {
      setCapturing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Rostro"
      subtitle="Enrolamiento de credencial biométrica"
      cardClassName="modal-face-card"
      icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="8.5" cy="7.5" r="4"></circle>
          <line x1="20" y1="8" x2="20" y2="14"></line>
          <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>
      }
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={handleCapture}
            disabled={capturing}
          >
            <span>{capturing ? 'Capturando vector...' : 'Capturar y Guardar'}</span>
          </button>
        </>
      }
    >
      <div className="face-scanner-body">
        <div className="grupo-campo" style={{ width: '100%', marginBottom: '0.85rem' }}>
          <label htmlFor="enroll-nombre-input" className="etiqueta">
            Nombre del Usuario
          </label>
          <input
            type="text"
            id="enroll-nombre-input"
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. María"
          />
        </div>

        <div className="camera-scanner-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
          <canvas ref={canvasRef} className="overlay-detection-canvas" />
          <div className="face-oval-guide" />
        </div>

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
