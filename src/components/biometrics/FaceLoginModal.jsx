import { useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

export default function FaceLoginModal({ isOpen, onClose, onSuccess }) {
  const {
    feedback,
    isRetrying,
    videoRef,
    canvasRef,
    loadModels,
    startCamera,
    stopCamera,
    startLiveScan,
    setFeedbackStatus
  } = useBiometricAuth();

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      const initScan = async () => {
        try {
          setFeedbackStatus('loading', 'Cargando modelos biométricos neuronales...');
          await loadModels();

          if (!isMountedRef.current) return;

          setFeedbackStatus('loading', 'Iniciando cámara web...');
          await startCamera();

          if (!isMountedRef.current) return;

          setFeedbackStatus('loading', 'Posiciona tu rostro frente a la cámara...');
          startLiveScan(
            (match) => {
              setTimeout(() => {
                stopCamera();
                onSuccess(match.nombre);
              }, 800);
            },
            (reason) => {
              if (reason === 'NO_REGISTERED_USERS') {
                setTimeout(() => {
                  stopCamera();
                  onClose('OPEN_ENROLL');
                }, 2000);
              }
            }
          );
        } catch (err) {
          setFeedbackStatus('error', err.message);
        }
      };

      initScan();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, loadModels, startCamera, stopCamera, startLiveScan, setFeedbackStatus, onSuccess, onClose]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Autenticación Biométrica"
      subtitle="Posiciónate frente a la cámara"
      cardClassName="modal-face-card"
      icon={
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3H5a2 2 0 0 0-2 2v2m18-4h-2a2 2 0 0 0-2-2m-14 18H5a2 2 0 0 1-2-2v-2m18 4h-2a2 2 0 0 1-2-2v-2"></path>
          <circle cx="9" cy="9" r="1"></circle>
          <circle cx="15" cy="9" r="1"></circle>
          <path d="M10 15h4"></path>
        </svg>
      }
    >
      <div className="face-scanner-body">
        <div className="camera-scanner-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
          <canvas ref={canvasRef} className="overlay-detection-canvas" />
          <div className={`face-oval-guide ${isRetrying ? 'guide-warning' : ''}`} />
          {!isRetrying && <div className="scanner-laser-line" />}
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
          <span dangerouslySetInnerHTML={{ __html: feedback.message || 'Iniciando escaneo facial...' }} />
        </div>
      </div>
    </Modal>
  );
}
