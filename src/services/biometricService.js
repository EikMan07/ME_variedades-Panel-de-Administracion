/**
 * ============================================================================
 * SERVICIO BIOMÉTRICO DE RECONOCIMIENTO FACIAL (face-api.js + WebRTC)
 * ME Variedades - Sistema de Seguridad y Control de Acceso
 * ============================================================================
 */

export class BiometricAuthService {
  constructor() {
    this.modelsLoaded = false;
    this.stream = null;
    this.distanceThreshold = 0.52; // Umbral de distancia euclidiana (<= 0.52 es la misma persona)
    this.MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    this.ALT_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
  }

  /**
   * Carga los pesos de las redes neuronales necesarias en memoria GPU / WebGL
   */
  async cargarModelos(onProgress = null) {
    if (this.modelsLoaded) return true;

    if (typeof window === 'undefined' || typeof window.faceapi === 'undefined') {
      throw new Error('La librería face-api no se encuentra cargada en el navegador.');
    }

    const faceapi = window.faceapi;

    try {
      if (onProgress) onProgress('Descargando modelos biométricos neuronales...');

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.MODEL_URL),
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL)
      ]);

      this.modelsLoaded = true;
      if (onProgress) onProgress('Modelos biométricos listos.');
      return true;
    } catch (error) {
      console.warn('Fallo al cargar desde URL principal, intentando mirror alternativo...', error);
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(this.ALT_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(this.ALT_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(this.ALT_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(this.ALT_URL)
        ]);
        this.modelsLoaded = true;
        if (onProgress) onProgress('Modelos biométricos listos.');
        return true;
      } catch (err2) {
        console.error('Error definitivo cargando modelos de face-api:', err2);
        throw new Error('No se pudieron descargar los modelos de reconocimiento facial. Verifica tu conexión a internet.', { cause: err2 });
      }
    }
  }

  /**
   * Enciende la cámara web usando la API WebRTC nativa (navigator.mediaDevices.getUserMedia)
   */
  async iniciarCamara(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Tu navegador o dispositivo no soporta acceso a la cámara web.');
    }

    this.detenerCamara(videoElement);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoElement) {
        videoElement.srcObject = this.stream;
      }

      return new Promise((resolve, reject) => {
        if (!videoElement) return resolve(this.stream);

        videoElement.onloadedmetadata = () => {
          videoElement.play()
            .then(() => resolve(this.stream))
            .catch(reject);
        };
        videoElement.onerror = reject;
      });
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Permiso de cámara denegado. Concede acceso a la cámara en tu navegador para ingresar.', { cause: err });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No se detectó ninguna cámara web conectada al equipo.', { cause: err });
      } else {
        throw new Error(`Error al iniciar la cámara: ${err.message}`, { cause: err });
      }
    }
  }

  /**
   * Apaga la cámara y libera el hardware de inmediato
   */
  detenerCamara(videoElement) {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignorar error al detener track
        }
      });
      this.stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }

  /**
   * Detección visual rápida en tiempo real para dibujar landmarks y bounding box en el Canvas
   */
  async detectarRostroEnVivo(videoElement) {
    if (!this.modelsLoaded || !videoElement || videoElement.paused || videoElement.ended) {
      return null;
    }

    const faceapi = window.faceapi;
    return await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks();
  }

  /**
   * Dibuja los recuadros y landmarks sobre el canvas superpuesto con soporte para modo espejo
   */
  dibujarDeteccionEnCanvas(deteccion, videoElement, canvasElement, label = 'Rostro Detectado', color = '#d89fa6') {
    if (!canvasElement || !videoElement || !deteccion || !window.faceapi) return;

    const faceapi = window.faceapi;
    const displaySize = { 
      width: videoElement.videoWidth || videoElement.clientWidth || 640, 
      height: videoElement.videoHeight || videoElement.clientHeight || 480 
    };

    if (displaySize.width === 0 || displaySize.height === 0) return;

    faceapi.matchDimensions(canvasElement, displaySize);

    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const resized = faceapi.resizeResults(deteccion, displaySize);
    const rawBox = resized.detection ? resized.detection.box : (resized.box || resized);

    if (!rawBox) return;

    // Posición X en modo espejo para que coincida con el video que tiene transform: scaleX(-1)
    const mirroredX = displaySize.width - (rawBox.x + rawBox.width);
    const mirroredBox = new faceapi.Rect(mirroredX, rawBox.y, rawBox.width, rawBox.height);

    new faceapi.draw.DrawBox(mirroredBox, {
      label: label,
      boxColor: color,
      lineWidth: 2
    }).draw(canvasElement);

    if (resized.landmarks && resized.landmarks.positions) {
      ctx.fillStyle = color;
      resized.landmarks.positions.forEach(pt => {
        const mx = displaySize.width - pt.x;
        ctx.beginPath();
        ctx.arc(mx, pt.y, 1.8, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  /**
   * Limpia el contenido del canvas
   */
  limpiarCanvas(canvasElement) {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }

  /**
   * Detecta el rostro y extrae el vector descriptor de 128 dimensiones de alta precisión
   */
  async extraerDescriptor(videoElement) {
    if (!this.modelsLoaded) {
      await this.cargarModelos();
    }

    if (!videoElement || videoElement.paused || videoElement.ended || videoElement.videoWidth === 0) {
      return null;
    }

    const faceapi = window.faceapi;
    const deteccion = await faceapi
      .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.65 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!deteccion) {
      return null;
    }

    return {
      detection: deteccion.detection,
      landmarks: deteccion.landmarks,
      descriptor: deteccion.descriptor // Float32Array[128]
    };
  }

  /**
   * Calcula la Distancia Euclidiana contra los usuarios registrados
   */
  compararRostro(descriptorCapturado, listaUsuariosRegistrados) {
    if (!descriptorCapturado || !listaUsuariosRegistrados || listaUsuariosRegistrados.length === 0 || !window.faceapi) {
      return { match: false, usuario: null, nombre: null, distance: 1.0 };
    }

    const faceapi = window.faceapi;
    let mejorCoincidencia = {
      usuario: null,
      nombre: null,
      distance: Infinity
    };

    for (const user of listaUsuariosRegistrados) {
      if (!user.descriptorFacial || user.descriptorFacial.length !== 128) continue;

      const storedVector = new Float32Array(user.descriptorFacial);
      const distancia = faceapi.euclideanDistance(descriptorCapturado, storedVector);

      if (distancia < mejorCoincidencia.distance) {
        mejorCoincidencia = {
          usuario: user.usuario,
          nombre: user.nombre || user.usuario,
          distance: distancia
        };
      }
    }

    const esValido = mejorCoincidencia.distance <= this.distanceThreshold;

    return {
      match: esValido,
      usuario: esValido ? mejorCoincidencia.usuario : null,
      nombre: esValido ? mejorCoincidencia.nombre : null,
      distance: mejorCoincidencia.distance
    };
  }
}

export const biometricServiceInstance = new BiometricAuthService();
