import { useState, useRef, useCallback, useEffect } from 'react';
import { biometricServiceInstance } from '../services/biometricService';

export function useBiometricAuth() {
  const [modelsLoaded, setModelsLoaded] = useState(biometricServiceInstance.modelsLoaded);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'info', message: '' });
  const [isScanning, setIsScanning] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanLoopTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const isProcessingFrameRef = useRef(false);
  const activeScanningFlagRef = useRef(false);
  const successCallbackRef = useRef(null);
  const failureCallbackRef = useRef(null);

  const setFeedbackStatus = useCallback((type, message) => {
    setFeedback({ type, message });
  }, []);

  const loadModels = useCallback(async (onProgress) => {
    setIsLoading(true);
    try {
      await biometricServiceInstance.cargarModelos((msg) => {
        setFeedbackStatus('loading', msg);
        if (onProgress) onProgress(msg);
      });
      setModelsLoaded(true);
      return true;
    } catch (err) {
      setFeedbackStatus('error', err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setFeedbackStatus]);

  const startCamera = useCallback(async (videoEl) => {
    const targetVideo = videoEl || videoRef.current;
    if (!targetVideo) return null;
    return await biometricServiceInstance.iniciarCamara(targetVideo);
  }, []);

  const stopCamera = useCallback((videoEl) => {
    const targetVideo = videoEl || videoRef.current;
    biometricServiceInstance.detenerCamara(targetVideo);
    if (canvasRef.current) {
      biometricServiceInstance.limpiarCanvas(canvasRef.current);
    }
    if (scanLoopTimeoutRef.current) {
      clearTimeout(scanLoopTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    activeScanningFlagRef.current = false;
    isProcessingFrameRef.current = false;
    setIsScanning(false);
    setIsRetrying(false);
  }, []);

  // Enrolar rostro (extraer 128D descriptor y guardar en localStorage)
  const enrollFace = useCallback(async (nombre, videoEl) => {
    const targetVideo = videoEl || videoRef.current;
    if (!targetVideo) throw new Error('Video feed no disponible');

    setFeedbackStatus('loading', 'Analizando rostro y extrayendo vector biométrico...');

    const resultado = await biometricServiceInstance.extraerDescriptor(targetVideo);
    if (!resultado) {
      setFeedbackStatus('error', 'No se detectó un rostro claro. Centra tu rostro con buena luz.');
      throw new Error('Rostro no detectado');
    }

    if (canvasRef.current) {
      biometricServiceInstance.dibujarDeteccionEnCanvas(
        resultado,
        targetVideo,
        canvasRef.current,
        'Rostro Capturado',
        '#2ed573'
      );
    }

    const usuarioId = (nombre || 'Usuario').toLowerCase().replace(/\s+/g, '_');
    const vectorSerializado = Array.from(resultado.descriptor);

    const nuevoRegistro = {
      usuario: usuarioId,
      nombre: nombre || 'Usuario',
      descriptorFacial: vectorSerializado,
      fechaRegistro: new Date().toISOString()
    };

    const listaBiometria = JSON.parse(localStorage.getItem('me_usuarios_biometria') || '[]');
    const indexExistente = listaBiometria.findIndex(u => u.usuario === usuarioId);
    if (indexExistente !== -1) {
      listaBiometria[indexExistente] = nuevoRegistro;
    } else {
      listaBiometria.push(nuevoRegistro);
    }
    localStorage.setItem('me_usuarios_biometria', JSON.stringify(listaBiometria));

    setFeedbackStatus('success', `¡Rostro de ${nombre} registrado con éxito!`);
    return nuevoRegistro;
  }, [setFeedbackStatus]);

  // Escaneo en vivo con ciclo de detección continua y reintentos automáticos
  const startLiveScan = useCallback((onSuccess, onFailure) => {
    const usuariosBiometricos = JSON.parse(localStorage.getItem('me_usuarios_biometria') || '[]');
    if (usuariosBiometricos.length === 0) {
      setFeedbackStatus('info', 'No hay rostros registrados. Por favor registra tu rostro primero.');
      if (onFailure) onFailure('NO_REGISTERED_USERS');
      return;
    }

    if (onSuccess) successCallbackRef.current = onSuccess;
    if (onFailure) failureCallbackRef.current = onFailure;

    // Limpiar temporizadores anteriores
    if (scanLoopTimeoutRef.current) clearTimeout(scanLoopTimeoutRef.current);
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);

    activeScanningFlagRef.current = true;
    isProcessingFrameRef.current = false;
    setIsScanning(true);
    setIsRetrying(false);
    setFeedbackStatus('loading', 'Posiciona tu rostro frente a la cámara...');

    let conteoFramesSinRostro = 0;

    const runFrame = async () => {
      if (!activeScanningFlagRef.current || !videoRef.current) return;

      if (isProcessingFrameRef.current) {
        scanLoopTimeoutRef.current = setTimeout(runFrame, 80);
        return;
      }

      isProcessingFrameRef.current = true;

      try {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;

        // Detección rápida visual para la interfaz
        const deteccionEnVivo = await biometricServiceInstance.detectarRostroEnVivo(videoEl);
        if (!activeScanningFlagRef.current) return;

        if (deteccionEnVivo && canvasEl) {
          biometricServiceInstance.dibujarDeteccionEnCanvas(
            deteccionEnVivo,
            videoEl,
            canvasEl,
            'Escaneando...',
            '#d89fa6'
          );
        } else if (canvasEl) {
          biometricServiceInstance.limpiarCanvas(canvasEl);
        }

        // Extracción del descriptor biométrico
        const resultado = await biometricServiceInstance.extraerDescriptor(videoEl);
        if (!activeScanningFlagRef.current) return;

        if (!resultado) {
          conteoFramesSinRostro++;
          if (conteoFramesSinRostro > 2) {
            setFeedbackStatus('loading', 'Buscando rostro... Mantén la mirada fija al frente.');
          }
          isProcessingFrameRef.current = false;
          scanLoopTimeoutRef.current = setTimeout(runFrame, 180);
          return;
        }

        conteoFramesSinRostro = 0;
        setFeedbackStatus('loading', 'Rostro detectado. Verificando identidad...');

        // Comparación con la base de datos de usuarios autorizados
        const matchResult = biometricServiceInstance.compararRostro(
          resultado.descriptor,
          usuariosBiometricos
        );

        if (matchResult.match) {
          // Coincidencia exitosa: Acceso autorizado
          activeScanningFlagRef.current = false;
          setIsScanning(false);
          setIsRetrying(false);

          if (canvasEl) {
            biometricServiceInstance.dibujarDeteccionEnCanvas(
              resultado,
              videoEl,
              canvasEl,
              'Rostro Verificado',
              '#2ed573'
            );
          }
          setFeedbackStatus('success', '¡Identidad confirmada! Bienvenido/a.');

          if (successCallbackRef.current) {
            successCallbackRef.current(matchResult);
          }
          return;
        } else {
          // El rostro no coincide: Detener proceso actual sin desmontar cámara y activar reintento
          activeScanningFlagRef.current = false;
          setIsScanning(false);
          setIsRetrying(true);

          if (canvasEl) {
            biometricServiceInstance.dibujarDeteccionEnCanvas(
              resultado,
              videoEl,
              canvasEl,
              'No Reconocido',
              '#ff4d4d'
            );
          }

          // Mensaje exacto requerido por el usuario
          setFeedbackStatus('error', 'Rostro no registrado. Intente otra vez para verificar');

          // Programar reactivación automática del flujo sin necesidad de recargar la página
          retryTimeoutRef.current = setTimeout(() => {
            if (canvasEl) {
              biometricServiceInstance.limpiarCanvas(canvasEl);
            }
            // Disparar reintento manteniendo la cámara activa
            setRetryTrigger(prev => prev + 1);
          }, 2400);

          return;
        }
      } catch (err) {
        console.error('Error durante el análisis biométrico:', err);
      } finally {
        isProcessingFrameRef.current = false;
        if (activeScanningFlagRef.current) {
          scanLoopTimeoutRef.current = setTimeout(runFrame, 180);
        }
      }
    };

    runFrame();
  }, [setFeedbackStatus]);

  // Efecto reactivo para reiniciar el escaneo automáticamente en reintentos
  useEffect(() => {
    if (retryTrigger > 0 && !isScanning && !activeScanningFlagRef.current && videoRef.current) {
      startLiveScan();
    }
  }, [retryTrigger, isScanning, startLiveScan]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      activeScanningFlagRef.current = false;
      if (scanLoopTimeoutRef.current) {
        clearTimeout(scanLoopTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      biometricServiceInstance.detenerCamara();
    };
  }, []);

  return {
    modelsLoaded,
    isLoading,
    isScanning,
    isRetrying,
    feedback,
    videoRef,
    canvasRef,
    loadModels,
    startCamera,
    stopCamera,
    enrollFace,
    startLiveScan,
    setFeedbackStatus
  };
}
