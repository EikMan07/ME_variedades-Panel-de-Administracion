/**
 * SERVICIO DE EXTRACCIÓN INTELIGENTE DE COMPROBANTES Y FACTURAS (OCR / VISIÓN IA)
 * ME VARIEDADES — DIGITALIZACIÓN Y RECONOCIMIENTO AVANZADO
 * 
 * Extrae con alta precisión:
 * 1. referenceNumber (Nº de comprobante, referencia, autorización, clave)
 * 2. amount (Monto normalizado a float limpio, ej: "₡2.600,00" -> 2600)
 * 3. date (Fecha normalizada a formato ISO YYYY-MM-DD)
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
  'credito'
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
  septiembre: '09', sep: '09', sept: '09',
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

  // Si contiene espacios múltiples, tomar el primer bloque o limpiar
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
 * Normaliza montos en colones o dólares con distintos separadores de miles y decimales
 * Ejemplos: "₡2.600,00" -> 2600 | "₡ 25,000.00" -> 25000 | "¢15.000" -> 15000 | "2600,50" -> 2600.5
 */
export function normalizarMonto(rawMonto) {
  if (rawMonto === null || rawMonto === undefined || rawMonto === '') return null;
  if (typeof rawMonto === 'number' && !isNaN(rawMonto)) return rawMonto > 0 ? rawMonto : null;

  let str = String(rawMonto).trim();

  // Limpiar símbolos de moneda y caracteres no numéricos excepto puntos, comas y espacios
  str = str.replace(/[₡¢$€]|CRC|USD|colones|dolares|monto|total|:/gi, '').trim();

  if (!str) return null;

  // Eliminar espacios intermedios
  str = str.replace(/\s+/g, '');

  // Caso 1: Tiene tanto punto como coma (ej: 2.600,00 o 2,600.00)
  if (str.includes('.') && str.includes(',')) {
    const ultimoPunto = str.lastIndexOf('.');
    const ultimaComa = str.lastIndexOf(',');

    if (ultimoPunto > ultimaComa) {
      // Formato US: 2,600.00 -> quitar comas
      str = str.replace(/,/g, '');
    } else {
      // Formato Europeo/Latino: 2.600,00 -> quitar puntos y coma a punto
      str = str.replace(/\./g, '').replace(/,/g, '.');
    }
  }
  // Caso 2: Solo tiene comas (ej: 2,600 o 2600,00 o 25,000)
  else if (str.includes(',')) {
    const partes = str.split(',');
    if (partes.length === 2 && partes[1].length === 2) {
      // Decimal con 2 dígitos: 2600,00 -> 2600.00
      str = partes[0].replace(/\./g, '') + '.' + partes[1];
    } else {
      // Separador de miles: 25,000 -> 25000
      str = str.replace(/,/g, '');
    }
  }
  // Caso 3: Solo tiene puntos (ej: 2.600 o 25.000 o 2600.00)
  else if (str.includes('.')) {
    const partes = str.split('.');
    if (partes.length === 2 && partes[1].length === 2) {
      // Decimal con 2 dígitos: 2600.00 -> 2600.00
      str = partes[0] + '.' + partes[1];
    } else if (partes.length >= 2 && (partes[1].length === 3 || partes.length > 2)) {
      // Separador de miles: 2.600 -> 2600
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

  // 3. Formato numérico latino: DD/MM/YYYY o DD-MM-YYYY
  const matchLatino = str.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (matchLatino) {
    const dia = matchLatino[1].padStart(2, '0');
    const mes = matchLatino[2].padStart(2, '0');
    const anio = matchLatino[3];
    return `${anio}-${mes}-${dia}`;
  }

  // 4. Formato corto: DD/MM/YY (ej: 22/08/26)
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
Actúa como un sistema OCR de visión computacional de alta precisión especializado en comprobantes bancarios (SINPE Móvil, transferencias, tiquetes y facturas).
Analiza la imagen del comprobante y extrae:

1. "referenceNumber": El código numérico o alfanumérico EXACTO del documento (ejemplos: "2026082215284002178009698", "78009698", "SINPE-94827103", "AUT-582914", "FAC-001-00293").
   - NUNCA devuelvas palabras genéricas como "Transferencia", "SINPE", "Pago", "Comprobante", "Detalle", "Monto", etc.
   - Si no hay un número de referencia o código específico, devuelve null.
2. "amount": El valor del monto transferido o total como número decimal limpio sin símbolos de moneda (ej: "₡2.600,00" -> 2600.0, "₡25.000" -> 25000.0). Si no se detecta, devuelve null.
3. "date": La fecha del comprobante en formato YYYY-MM-DD (ej: "22 de agosto, 2026" -> "2026-08-22"). Si no se detecta, devuelve null.

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

  // 2. Búsqueda de Monto (ej: "Monto transferido: ₡2.600,00" o "Total: ₡25.000")
  const regexMontos = /(?:monto(?:\s*transferido|\s*debitado|\s*enviado|\s*pagado)?|total|importe|valor)\s*[:=]?\s*([₡¢$€A-Za-z\s]*[\d.,\s]+)/i;

  for (const linea of lineas) {
    const match = linea.match(regexMontos);
    if (match && match[1]) {
      const m = normalizarMonto(match[1]);
      if (m) {
        amount = m;
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

  // 3. Búsqueda de Fecha (ej: "22 de agosto, 2026" o "22/08/2026")
  for (const linea of lineas) {
    const f = normalizarFechaEspanol(linea);
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
