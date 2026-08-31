/**
 * SERVICIO DE EXTRACCIÓN AUTOMÁTICA DE DATOS (OCR / VISIÓN)
 * ME VARIEDADES — DIGITALIZACIÓN INTELIGENTE DE COMPROBANTES
 * 
 * Analiza comprobantes bancarios, transferencias SINPE Móvil y facturas
 * para extraer automáticamente el número de comprobante, referencia o autorización.
 */

/**
 * Patrones de expresiones regulares para identificar códigos de comprobantes bancarios y fiscales
 */
const PATRONES_REFERENCIA = [
  // 1. SINPE Móvil (Comprobante / Referencia / Autorización)
  /(?:comprobante|num(?:\.|ero)?\s*comprobante|n[oº]\.?\s*comprobante)\s*[:#\-]?\s*([A-Za-z0-9\-]{5,25})/i,
  /(?:n[oº]\.?\s*de\s*referencia|referencia|ref(?:\.|\b))\s*[:#\-]?\s*([A-Za-z0-9\-]{5,25})/i,
  /(?:n[oº]\.?\s*autorizaci[oó]n|autorizaci[oó]n|aut(?:\.|\b)|n[oº]\.?\s*aprobaci[oó]n|aprobaci[oó]n)\s*[:#\-]?\s*([A-Za-z0-9\-]{5,20})/i,
  /(?:n[oº]\.?\s*transacci[oó]n|transacci[oó]n|transacc\b)\s*[:#\-]?\s*([A-Za-z0-9\-]{5,25})/i,
  /(?:sinpe(?:\s*m[oó]vil)?)\s*[:#\-]?\s*([0-9]{5,20})/i,

  // 2. Facturas Electrónicas y Recibos
  /(?:factura\s*(?:electr[oó]nica)?|fac(?:\.|\b))\s*[:#\-]?\s*([A-Za-z0-9\-]{3,25})/i,
  /(?:consecutivo|n[oº]\.?\s*consecutivo)\s*[:#\-]?\s*([0-9]{10,25})/i,
  /(?:recibo(?:\s*de\s*dinero)?|rec(?:\.|\b))\s*[:#\-]?\s*([A-Za-z0-9\-]{3,20})/i,
  /(?:documento|n[oº]\.?\s*doc(?:\.|\b)|doc(?:\.|\b))\s*[:#\-]?\s*([A-Za-z0-9\-]{4,20})/i,

  // 3. Clave numérica de Hacienda (Costa Rica 50 dígitos)
  /(?:clave(?:\s*num[eé]rica)?)\s*[:#\-]?\s*([0-9]{20,50})/i
];

/**
 * Patrones para detección de monto aproximado
 */
const PATRONES_MONTO = [
  /(?:monto(?:\s*transferido|\s*enviado|\s*pagado)?|total|importe)\s*[:=]?\s*(?:₡|CRC|¢|\$)?\s*([\d.,]+)/i,
  /(?:₡|¢|CRC)\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i
];

/**
 * Limpia y normaliza el código de referencia extraído
 */
function limpiarCodigoReferencia(texto) {
  if (!texto) return null;
  const limpio = texto.replace(/^[:#\-\s]+|[:#\-\s]+$/g, '').trim();
  // Validar longitud mínima razonable
  if (limpio.length >= 3 && limpio.length <= 35) {
    return limpio;
  }
  return null;
}

/**
 * Extrae texto y datos estructurados de un archivo (Imagen o DataURL) usando OCR en segundo plano.
 * Carga dinámica de tesseract.js bajo demanda.
 * 
 * @param {string|File|Blob} fileOrDataUrl - Imagen a analizar
 * @param {Function} onProgress - Callback opcional para reportar progreso
 * @returns {Promise<{ referenceNumber: string | null, monto: number | null, rawText: string }>}
 */
export async function extraerDatosComprobante(fileOrDataUrl, onProgress = null) {
  if (!fileOrDataUrl) {
    return { referenceNumber: null, monto: null, rawText: '' };
  }

  try {
    if (onProgress) onProgress(10, 'Iniciando motor de reconocimiento OCR...');

    // Importación dinámica de Tesseract para mantener el bundle principal liviano
    const { createWorker } = await import('tesseract.js');

    if (onProgress) onProgress(30, 'Cargando modelos de lectura visual...');

    const worker = await createWorker(['spa', 'eng'], undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(30 + (m.progress || 0) * 60);
          onProgress(pct, `Analizando comprobante (${Math.min(95, pct)}%)...`);
        }
      }
    });

    if (onProgress) onProgress(50, 'Escaneando texto y códigos del comprobante...');

    const { data: { text } } = await worker.recognize(fileOrDataUrl);
    await worker.terminate();

    if (onProgress) onProgress(95, 'Extrayendo número de referencia...');

    const rawText = text || '';
    let referenceNumber = null;
    let monto = null;

    // 1. Búsqueda de referencia / comprobante por patrones regex
    for (const patron of PATRONES_REFERENCIA) {
      const match = rawText.match(patron);
      if (match && match[1]) {
        const candidato = limpiarCodigoReferencia(match[1]);
        if (candidato) {
          referenceNumber = candidato;
          break;
        }
      }
    }

    // 2. Si no encontró por etiqueta directa, buscar bloques de código aislados (como SINPE-XXXXXXXX)
    if (!referenceNumber) {
      const lineas = rawText.split('\n');
      for (const linea of lineas) {
        const l = linea.trim();
        // Detectar si la línea contiene un código típico como "2024083100123" o "REF1234567"
        if (/^(?:ref|sinpe|aut|comp)?[#:\-\s]*([A-Z0-9]{6,20})$/i.test(l)) {
          const match = l.match(/([A-Z0-9]{6,20})/i);
          if (match) {
            referenceNumber = match[1];
            break;
          }
        }
      }
    }

    // 3. Búsqueda de monto sugerido
    for (const patron of PATRONES_MONTO) {
      const match = rawText.match(patron);
      if (match && match[1]) {
        // Normalizar número eliminando separadores de miles
        const montoStr = match[1].replace(/\s/g, '');
        // Si tiene comas como miles y puntos como decimales o viceversa
        let parsedMonto = 0;
        if (montoStr.includes(',') && montoStr.includes('.')) {
          parsedMonto = parseFloat(montoStr.replace(/,/g, ''));
        } else if (montoStr.includes(',')) {
          parsedMonto = parseFloat(montoStr.replace(/,/g, '.'));
        } else {
          parsedMonto = parseFloat(montoStr);
        }

        if (!isNaN(parsedMonto) && parsedMonto > 0) {
          monto = parsedMonto;
          break;
        }
      }
    }

    if (onProgress) onProgress(100, 'Análisis completado');

    console.log('✅ Resultado OCR de Comprobante:', {
      referenceNumber,
      monto,
      rawTextPreview: rawText.substring(0, 150)
    });

    return {
      referenceNumber: referenceNumber || null,
      monto: monto || null,
      rawText
    };
  } catch (error) {
    console.warn('⚠️ OCR no pudo procesar la imagen (continuando normalmente sin bloquear):', error);
    return { referenceNumber: null, monto: null, rawText: '' };
  }
}
