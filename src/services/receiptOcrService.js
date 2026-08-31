/**
 * SERVICIO DE EXTRACCIÓN INTELIGENTE DE COMPROBANTES Y FACTURAS (OCR / VISIÓN IA)
 * ME VARIEDADES — DIGITALIZACIÓN Y RECONOCIMIENTO AVANZADO
 * 
 * Extrae con alta precisión:
 * 1. referenceNumber (Nº de comprobante, referencia, autorización, clave)
 * 2. amount (Monto normalizado a float limpio, ej: "₡2.600,00" -> 2600, "₡12,287.38" -> 12287.38)
 * 3. date (Fecha normalizada a formato ISO YYYY-MM-DD, ej: "22 de agosto, 2026" -> "2026-08-22")
 */

// Palabras genéricas y términos de parada que NUNCA deben asignarse como número de referencia
const PALABRAS_PROHIBIDAS = new Set([
  'transferencia',
  'sinpe',
  'sinpe movil',
  'pago',
  'comprobante',
  'detalle',
  'movimiento',
  'exitoso',
  'exitosa',
  'banco',
  'colones',
  'dolares',
  'monto',
  'fecha',
  'hora',
  'destino',
  'origen',
  'titular',
  'cliente',
  'cuenta',
  'tarjeta',
  'recibo',
  'factura',
  'documento',
  'aprobacion',
  'autorizacion',
  'aprobada',
  'numero',
  'ref',
  'total',
  'moneda',
  'codigo',
  'descripcion',
  'cedula',
  'identificacion',
  'favor',
  'guardar',
  'servicio',
  'bancario',
  'gestion',
  'general',
  'costa',
  'rica',
  'bn',
  'bcr',
  'bac',
  'davivienda',
  'popular',
  'promerica',
  'scotiabank',
  'subtotal',
  'saldo',
  'pendiente',
  'debito',
  'credito',
  'transaccion'
]);

const MAPA_MESES = {
  enero: '01', ene: '01',
  febrero: '02', feb: '02',
  marzo: '03', mar: '03',
  abril: '04', abr: '04',
  mayo: '05', may: '05',
  junio: '06', jun: '06',
  julio: '07', jul: '07',
  agosto: '08', ago: '08',
  septiembre: '09', sep: '09', sept: '09', setiembre: '09', set: '09',
  octubre: '10', oct: '10',
  noviembre: '11', nov: '11',
  diciembre: '12', dic: '12'
};

/**
 * Normaliza y valida que un string sea un código de referencia legítimo
 */
export function validarYLimpiarReferencia(candidato) {
  if (!candidato || typeof candidato !== 'string') return null;

  // Limpiar caracteres de puntuación al inicio/final
  let limpio = candidato.trim().replace(/^[:#\-\s.,;()]+|[:#\-\s.,;()]+$/g, '').trim();

  // Si contiene espacios múltiples, tomar el bloque relevante
  if (limpio.includes(' ')) {
    const partes = limpio.split(/\s+/);
    // Si la primera parte parece una etiqueta como "No." o "#", tomar la segunda
    if (/^(?:no|n[oº]|#|num|numero)$/i.test(partes[0]) && partes.length > 1) {
      limpio = partes[1];
    } else if (partes.length === 1) {
      limpio = partes[0];
    }
  }

  const enMinuscula = limpio.toLowerCase().trim();

  // 1. Descartar si es una palabra genérica prohibida
  if (PALABRAS_PROHIBIDAS.has(enMinuscula)) {
    return null;
  }

  // 2. Descartar si solo contiene letras y tiene menos de 5 caracteres sin dígitos
  if (/^[A-Za-z]+$/.test(limpio) && limpio.length < 8) {
    return null;
  }

  // 3. Debe tener entre 4 y 50 caracteres y contener al menos 1 número o ser un código estructurado
  if (limpio.length >= 4 && limpio.length <= 50 && (/\d/.test(limpio) || /^[A-Z0-9\-_]{6,}$/i.test(limpio))) {
    return limpio;
  }

  return null;
}

/**
 * Normaliza montos con alta precisión:
 * - Limpia explícitamente símbolos de moneda (₡, $, USD, CRC, ¢) y artefactos de OCR (₡ leído como 2 o 21).
 * - Distingue formato latino (12.300,00) vs formato estándar (12,307.38).
 */
export function normalizarMonto(rawMonto) {
  if (rawMonto === null || rawMonto === undefined || rawMonto === '') return null;
  if (typeof rawMonto === 'number' && !isNaN(rawMonto)) return rawMonto > 0 ? rawMonto : null;

  let str = String(rawMonto).trim();

  // 1. Limpieza explícita de símbolos de moneda, palabras y prefijos ANTES de extraer dígitos
  str = str.replace(/[₡¢$€£¥]/g, ' ');
  str = str.replace(/\b(?:CRC|USD|colones|dolares|monto|total|debitado|transferido|pagado|importe|valor)\b/gi, ' ');
  str = str.replace(/[:=]/g, ' ').trim();

  // 2. Limpieza de artefactos OCR donde ₡ se reconoce como '2', '21' o 'C' antes de un número
  str = str.replace(/^(?:21|2|c|e|¢)\s+(?=\d)/i, '');

  // Eliminar espacios intermedios
  str = str.replace(/\s+/g, '');

  const matchNum = str.match(/[\d.,]+/);
  if (!matchNum) return null;
  str = matchNum[0];
  str = str.replace(/^[.,]+|[.,]+$/g, '');
  if (!str) return null;

  // A) Si el monto tiene punto Y coma:
  if (str.includes('.') && str.includes(',')) {
    const primerPunto = str.indexOf('.');
    const primeraComa = str.indexOf(',');
    if (primerPunto < primeraComa) {
      // Punto antes de coma (ej: "2.600,00" o "12.300,00"): punto es miles, coma es decimal -> 2600.00 / 12300.00
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // Coma antes de punto (ej: "12,287.38" o "12,307.38"): coma es miles, punto es decimal -> 12287.38 / 12307.38
      str = str.replace(/,/g, '');
    }
  }
  // B) Si solo tiene coma:
  else if (str.includes(',')) {
    const partes = str.split(',');
    // Si la última parte tiene 2 dígitos (ej: "2600,00" o "287,38" o "12307,38") -> decimal
    if (partes.length === 2 && partes[1].length === 2) {
      str = partes[0].replace(/\./g, '') + '.' + partes[1];
    }
    // Si tiene 3 dígitos (ej: "2,600" o "12,300" o "25,000") -> miles
    else if (partes.length >= 2 && partes[partes.length - 1].length === 3) {
      str = str.replace(/,/g, '');
    }
    // Otro caso con coma (ej: decimales con 1 dígito "2600,5")
    else if (partes.length === 2) {
      str = partes[0] + '.' + partes[1];
    }
  }
  // C) Si solo tiene punto:
  else if (str.includes('.')) {
    const partes = str.split('.');
    // Si solo tiene punto seguido de 2 dígitos al final (ej: "2600.00" o "287.38" o "12307.38") -> decimal
    if (partes.length === 2 && partes[1].length === 2) {
      str = partes[0] + '.' + partes[1];
    }
    // Si solo tiene punto seguido de 3 dígitos (ej: "2.600" o "12.300" o "25.000") -> miles
    else if (partes.length === 2 && partes[1].length === 3) {
      str = str.replace(/\./g, '');
    }
    // Si tiene múltiples puntos (ej: "1.200.000") -> miles
    else if (partes.length > 2) {
      str = str.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(str);
  return (!isNaN(parsed) && parsed > 0) ? Math.round(parsed * 100) / 100 : null;
}

/**
 * Parsea fechas en español y formatos comunes a ISO YYYY-MM-DD
 * Ejemplos: "22 de agosto, 2026" -> "2026-08-22" | "22/08/2026" -> "2026-08-22" | "2026-08-22" -> "2026-08-22"
 */
export function normalizarFechaEspanol(rawFecha) {
  if (!rawFecha || typeof rawFecha !== 'string') return null;

  const str = rawFecha.trim().toLowerCase();

  // 1. Formato ISO ya válido: YYYY-MM-DD
  const matchIso = str.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
  if (matchIso) {
    return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
  }

  // 2. Formato natural en español: "22 de agosto, 2026" o "22 de agosto del 2026" o "22 de agosto de 2026"
  const matchNatural = str.match(/\b(0?[1-9]|[12]\d|3[01])\s*(?:de|\/|-)?\s*([a-záéíóú]+)\s*(?:,|\.|de|del)?\s*(20\d{2})\b/i);
  if (matchNatural) {
    const dia = matchNatural[1].padStart(2, '0');
    const mesTexto = matchNatural[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const anio = matchNatural[3];
    const mesNum = MAPA_MESES[mesTexto];
    if (mesNum) {
      return `${anio}-${mesNum}-${dia}`;
    }
  }

  // 3. Formato mes primero en español: "Agosto 22, 2026"
  const matchMesPrimero = str.match(/\b([a-záéíóú]+)\s*(0?[1-9]|[12]\d|3[01])\s*(?:,|\.|de|del)?\s*(20\d{2})\b/i);
  if (matchMesPrimero) {
    const mesTexto = matchMesPrimero[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const dia = matchMesPrimero[2].padStart(2, '0');
    const anio = matchMesPrimero[3];
    const mesNum = MAPA_MESES[mesTexto];
    if (mesNum) {
      return `${anio}-${mesNum}-${dia}`;
    }
  }

  // 4. Formato numérico latino: DD/MM/YYYY o DD-MM-YYYY
  const matchLatino = str.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (matchLatino) {
    const dia = matchLatino[1].padStart(2, '0');
    const mes = matchLatino[2].padStart(2, '0');
    const anio = matchLatino[3];
    return `${anio}-${mes}-${dia}`;
  }

  // 5. Formato corto: DD/MM/YY (ej: 22/08/26)
  const matchCorto = str.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](2\d)\b/);
  if (matchCorto) {
    const dia = matchCorto[1].padStart(2, '0');
    const mes = matchCorto[2].padStart(2, '0');
    const anio = `20${matchCorto[3]}`;
    return `${anio}-${mes}-${dia}`;
  }

  return null;
}

/**
 * Intento de extracción con Gemini 1.5 Flash Vision AI si la API Key está configurada
 */
async function extraerConGeminiVision(fileOrDataUrl, apiKey) {
  if (!apiKey) return null;

  try {
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const match = fileOrDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    if (!base64Data) return null;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
Actúa como un sistema OCR y Visión de datos financieros para comprobantes bancarios (SINPE Móvil, transferencias bancarias, recibos y facturas).
Analiza cuidadosamente la imagen y extrae:

1. "referenceNumber": El código numérico o alfanumérico EXACTO del comprobante (ej: "2026082215284002178009698", "78009698", "SINPE-94827103", "AUT-582914", "FAC-001-00293").
   - IMPORTANTE: NUNCA devuelvas palabras genéricas como "Transferencia", "SINPE", "Pago", "Comprobante", "Detalle", "Monto", etc.
   - Si no hay un código numérico o alfanumérico específico, devuelve null.
2. "amount": El valor del monto total transferido o pagado como un número decimal limpio sin símbolos de moneda ni letras (ej: "₡2.600,00" -> 2600.0, "₡12,287.38" -> 12287.38, "₡25.000" -> 25000.0).
   - IMPORTANTE: NUNCA confundas el símbolo de colones ₡ con los dígitos 2 o 21. Si dice ₡2.600,00 el monto es 2600, NO 22600. Si dice ₡12,287.38 el monto es 12287.38, NO 212287.38.
   - Si no se detecta el monto, devuelve null.
3. "date": La fecha del comprobante en formato ISO estricto YYYY-MM-DD (ej: "22 de agosto, 2026" -> "2026-08-22", "31/08/2026" -> "2026-08-31").
   - Si no se detecta la fecha, devuelve null.

Responde EXCLUSIVAMENTE con un JSON válido con esta estructura:
{
  "referenceNumber": string | null,
  "amount": number | null,
  "date": string | null
}
`.trim();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json'
        }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);

    return {
      referenceNumber: validarYLimpiarReferencia(parsed.referenceNumber),
      amount: normalizarMonto(parsed.amount),
      date: normalizarFechaEspanol(parsed.date)
    };
  } catch (err) {
    console.warn('Fallo en extracción Gemini Vision (usando fallback OCR local):', err);
    return null;
  }
}

/**
 * Parser determinista y de alta precisión sobre texto extraído con Tesseract OCR
 */
function parsearTextoOCR(rawText) {
  if (!rawText) {
    return { referenceNumber: null, amount: null, date: null };
  }

  const lineas = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let referenceNumber = null;
  let amount = null;
  let date = null;

  // 1. Patrones de etiquetas estrictas para Referencia
  const regexEtiquetasRef = /(?:n[oº°]?\.?\s*(?:de\s*)?(?:referencia|ref|comprobante|transacci[oó]n|autorizaci[oó]n|aprobaci[oó]n|documento|doc|consecutivo|clave)|comprobante\s*#?|referencia\s*#?|ref\s*#?|aut\s*#?|clave\s*num[eé]rica)\s*[:#\-]?\s*([A-Za-z0-9\-_]{4,50})/i;

  for (const linea of lineas) {
    // A) Buscar en la misma línea
    const match = linea.match(regexEtiquetasRef);
    if (match && match[1]) {
      const candidato = validarYLimpiarReferencia(match[1]);
      if (candidato) {
        referenceNumber = candidato;
        break;
      }
    }
  }

  // Si no se encontró en la misma línea, buscar si la etiqueta está en una línea y el valor en la siguiente
  if (!referenceNumber) {
    for (let i = 0; i < lineas.length - 1; i++) {
      const lineaActual = lineas[i];
      if (/(?:n[oº°]?\.?\s*(?:de\s*)?(?:referencia|comprobante|transacci[oó]n|autorizaci[oó]n|documento)|referencia|comprobante)\s*[:#\-]?$/i.test(lineaActual)) {
        const lineaSiguiente = lineas[i + 1];
        const candidato = validarYLimpiarReferencia(lineaSiguiente);
        if (candidato) {
          referenceNumber = candidato;
          break;
        }
      }
    }
  }

  // Fallback: Buscar códigos SINPE / transaccionales largos tipo "2026082215284002178009698" o "SINPE-94827103"
  if (!referenceNumber) {
    for (const linea of lineas) {
      const matchLargo = linea.match(/\b([0-9]{8,35})\b/) || linea.match(/\b([A-Z]{2,6}-[0-9]{4,15})\b/i);
      if (matchLargo && matchLargo[1]) {
        const candidato = validarYLimpiarReferencia(matchLargo[1]);
        if (candidato) {
          referenceNumber = candidato;
          break;
        }
      }
    }
  }

  // 2. Búsqueda de Monto (Campos prioritarios: "Monto total pagado", "Monto transferido", "Monto pagado", "Monto debitado", "Total")
  const regexMontosPrioritarios = /(?:monto\s*(?:total\s*)?(?:transferido|pagado|debitado|enviado)?|total\s*(?:transferido|pagado|debitado)?|importe|valor\s*(?:total)?)\s*[:=]?\s*([^\n\r]+)/i;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const match = linea.match(regexMontosPrioritarios);
    if (match && match[1]) {
      const m = normalizarMonto(match[1]);
      if (m) {
        amount = m;
        break;
      }
    }
    // Si la etiqueta está sola en la línea, verificar la siguiente línea
    if (/(?:monto\s*(?:total\s*)?(?:transferido|pagado|debitado)?|total)\s*[:=]?$/i.test(linea) && i < lineas.length - 1) {
      const mSig = normalizarMonto(lineas[i + 1]);
      if (mSig) {
        amount = mSig;
        break;
      }
    }
  }

  // Fallback de monto: buscar cualquier símbolo ₡ seguido de número
  if (!amount) {
    for (const linea of lineas) {
      const matchSimbolo = linea.match(/(?:₡|¢|CRC|USD|\$)\s*([\d.,\s]+)/i);
      if (matchSimbolo && matchSimbolo[1]) {
        const m = normalizarMonto(matchSimbolo[1]);
        if (m) {
          amount = m;
          break;
        }
      }
    }
  }

  // 3. Búsqueda de Fecha en todo el texto (priorizando el encabezado)
  for (let i = 0; i < lineas.length; i++) {
    const f = normalizarFechaEspanol(lineas[i]);
    if (f) {
      date = f;
      break;
    }
  }

  return {
    referenceNumber: referenceNumber || null,
    amount: amount || null,
    date: date || null
  };
}

/**
 * Función principal unificada de extracción automática de datos de comprobantes.
 * Intenta Visión IA primero y realiza fallback transparente al OCR de Tesseract.
 * 
 * @param {string|File|Blob} fileOrDataUrl - Imagen del comprobante
 * @param {Function} onProgress - Callback para barra de progreso
 * @returns {Promise<{ referenceNumber: string | null, amount: number | null, date: string | null }>}
 */
export async function extraerDatosComprobante(fileOrDataUrl, onProgress = null) {
  if (!fileOrDataUrl) {
    return { referenceNumber: null, amount: null, date: null };
  }

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('me_gemini_api_key') || '';

    // Intento 1: Visión con Gemini 1.5 Flash si hay API key
    if (apiKey) {
      if (onProgress) onProgress(30, 'Analizando comprobante con Visión IA...');
      const resultadoGemini = await extraerConGeminiVision(fileOrDataUrl, apiKey);
      if (resultadoGemini && (resultadoGemini.referenceNumber || resultadoGemini.amount || resultadoGemini.date)) {
        if (onProgress) onProgress(100, 'Comprobante extraído con IA');
        console.log('🤖 Extracción con Gemini Vision IA completada:', resultadoGemini);
        return resultadoGemini;
      }
    }

    // Intento 2: OCR local de alta precisión con Tesseract.js
    if (onProgress) onProgress(20, 'Iniciando escáner OCR local...');

    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker(['spa', 'eng'], undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(30 + (m.progress || 0) * 60);
          onProgress(pct, `Escaneando texto (${Math.min(95, pct)}%)...`);
        }
      }
    });

    const { data: { text } } = await worker.recognize(fileOrDataUrl);
    await worker.terminate();

    if (onProgress) onProgress(95, 'Interpretando datos financieros...');

    const resultadoOCR = parsearTextoOCR(text);

    if (onProgress) onProgress(100, 'Análisis completado');

    console.log('📄 Extracción con Tesseract OCR completada:', resultadoOCR);

    return resultadoOCR;
  } catch (error) {
    console.warn('⚠️ No se pudieron extraer datos del comprobante (continuando normalmente):', error);
    return { referenceNumber: null, amount: null, date: null };
  }
}
