/**
 * SERVICIO DE EXTRACCIÓN INTELIGENTE DE COMPROBANTES Y FACTURAS (OCR / VISIÓN IA)
 * ME VARIEDADES — DIGITALIZACIÓN Y RECONOCIMIENTO FINANCIERO AVANZADO
 * 
 * Extrae con alta precisión quirúrgica:
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
 * 1. PARSEO ESTRICTO DEL MONTO (Regex + Parser estricto de separadores mixtos y limpieza de ₡)
 * Resuelve la confusión del glifo '₡' interpretado como '2' o '21' por el OCR
 */
export function parseAmountFromOCR(rawText) {
  if (!rawText) return null;
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Priorizar líneas que contengan etiquetas clave de montos
  let targetLine = lines.find(l => /monto\s*(total pagado|transferido|pagado|debitado|enviado)?|total\s*(pagado|transferido|debitado)?|importe|valor/i.test(l)) || rawText;

  // 2. Limpieza de prefijos de moneda y palabras no numéricas
  let cleaned = targetLine
    .replace(/[₡¢$€£¥]/gi, ' ')
    .replace(/\b(?:CRC|USD|colones|dolares|crc|usd)\b/gi, ' ');

  // 3. Extraer todos los bloques numéricos con separadores
  const matches = cleaned.match(/\b\d+(?:[.,]\d+)*\b/g);
  if (!matches) {
    // Si no encontró en la línea prioritaria, buscar en todo el texto
    const allMatches = rawText
      .replace(/[₡¢$€£¥]/gi, ' ')
      .replace(/\b(?:CRC|USD|colones|dolares)\b/gi, ' ')
      .match(/\b\d+(?:[.,]\d+)*\b/g);
    if (!allMatches) return null;
    cleaned = allMatches[allMatches.length - 1];
  } else {
    // Filtrar tokens pequeños que sean artefactos como '2' o '21' aislados antes de un número mayor
    let candidates = matches.map(m => m.trim());
    if (candidates.length >= 2) {
      if ((candidates[0] === '2' || candidates[0] === '21') && candidates[1].length >= 3) {
        candidates = candidates.slice(1);
      }
    }
    cleaned = candidates[candidates.length - 1];
  }

  let rawNumber = cleaned;

  // Normalizar separadores:
  if (rawNumber.includes('.') && rawNumber.includes(',')) {
    if (rawNumber.lastIndexOf(',') > rawNumber.lastIndexOf('.')) {
      // Formato latino: 2.600,00 -> 2600.00
      rawNumber = rawNumber.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato anglosajón: 12,287.38 -> 12287.38
      rawNumber = rawNumber.replace(/,/g, '');
    }
  } else if (rawNumber.includes(',')) {
    const partes = rawNumber.split(',');
    if (partes.length === 2 && partes[1].length === 2) {
      // Decimal latino con 2 dígitos: "2600,00" -> "2600.00"
      rawNumber = partes[0].replace(/\./g, '') + '.' + partes[1];
    } else if (partes.length >= 2 && partes[partes.length - 1].length === 3) {
      // Separador de miles: "25,000" -> "25000"
      rawNumber = rawNumber.replace(/,/g, '');
    } else {
      rawNumber = rawNumber.replace(',', '.');
    }
  } else if (rawNumber.includes('.')) {
    const partes = rawNumber.split('.');
    if (partes.length === 2 && partes[1].length === 3) {
      // Separador de miles con punto: "2.600" -> "2600"
      rawNumber = partes[0] + partes[1];
    } else if (partes.length > 2) {
      // Millones: "1.200.000" -> "1200000"
      rawNumber = rawNumber.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(rawNumber);
  return isNaN(parsed) ? null : Math.round(parsed * 100) / 100;
}

/**
 * 2. PARSEO DE REFERENCIA / Nº DE DOCUMENTO
 * Extrae el identificador numérico o alfanumérico exacto y rechaza términos genéricos
 */
export function parseReferenceFromOCR(rawText) {
  if (!rawText) return null;
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  const regexEtiquetasRef = /(?:n[oº°]?\.?\s*(?:de\s*)?(?:referencia|ref|comprobante|transacci[oó]n|autorizaci[oó]n|aprobaci[oó]n|documento|doc|consecutivo|clave)|comprobante\s*#?|referencia\s*#?|ref\s*#?|aut\s*#?|clave\s*num[eé]rica)\s*[:#\-]?\s*([A-Za-z0-9\-_]{4,50})/i;

  // A) Búsqueda en la misma línea
  for (const linea of lines) {
    const match = linea.match(regexEtiquetasRef);
    if (match && match[1]) {
      const candidato = match[1].replace(/^[:#\-\s.,;()]+|[:#\-\s.,;()]+$/g, '').trim();
      const enMinuscula = candidato.toLowerCase();
      if (!PALABRAS_PROHIBIDAS.has(enMinuscula) && (/\d/.test(candidato) || candidato.length >= 6)) {
        return candidato;
      }
    }
  }

  // B) Búsqueda en línea siguiente a la etiqueta
  for (let i = 0; i < lines.length - 1; i++) {
    const actual = lines[i];
    if (/(?:n[oº°]?\.?\s*(?:de\s*)?(?:referencia|comprobante|transacci[oó]n|autorizaci[oó]n|documento)|referencia|comprobante)\s*[:#\-]?$/i.test(actual)) {
      const candidato = lines[i + 1].replace(/^[:#\-\s.,;()]+|[:#\-\s.,;()]+$/g, '').trim();
      const enMinuscula = candidato.toLowerCase();
      if (!PALABRAS_PROHIBIDAS.has(enMinuscula) && (/\d/.test(candidato) || candidato.length >= 6)) {
        return candidato;
      }
    }
  }

  // C) Fallback: Códigos largos tipo "2026082215284002178009698" o "SINPE-94827103"
  for (const linea of lines) {
    const matchLargo = linea.match(/\b([0-9]{8,35})\b/) || linea.match(/\b([A-Z]{2,6}-[0-9]{4,15})\b/i);
    if (matchLargo && matchLargo[1]) {
      const candidato = matchLargo[1].trim();
      if (!PALABRAS_PROHIBIDAS.has(candidato.toLowerCase())) {
        return candidato;
      }
    }
  }

  return null;
}

/**
 * 3. PARSEO DE FECHA EN ESPAÑOL Y ENCABEZADOS
 * Convierte fechas del comprobante a formato ISO YYYY-MM-DD
 */
export function parseDateFromOCR(rawText) {
  if (!rawText) return null;
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const str = line.toLowerCase();

    // 1. Formato ISO: YYYY-MM-DD
    const matchIso = str.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/);
    if (matchIso) {
      return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
    }

    // 2. Español natural: "22 de agosto, 2026" o "22 de agosto del 2026"
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

    // 3. Mes primero: "Agosto 22, 2026"
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

    // 4. Formato latino: DD/MM/YYYY
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
  }

  return null;
}

/**
 * Intento de extracción con Gemini 1.5 Flash Vision AI si la API Key está disponible
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
Actúa como un extractor de alta precisión de comprobantes bancarios (SINPE Móvil, transferencias y facturas).
Analiza la imagen y extrae:

1. "referenceNumber": Código numérico/alfanumérico exacto del documento (ej: "2026082215284002178009698", "78009698", "SINPE-94827103", "AUT-582914").
   - NUNCA devuelvas términos genéricos como "Transferencia", "SINPE", "Pago", "Comprobante".
   - Si no hay código específico, devuelve null.
2. "amount": Monto transferido o pagado como número flotante limpio (ej: "₡2.600,00" -> 2600.0, "₡12,287.38" -> 12287.38).
   - NUNCA confundas ₡ con 2 o 21. Si dice ₡2.600,00 es 2600. Si dice ₡12,287.38 es 12287.38.
   - Si no se detecta, devuelve null.
3. "date": Fecha del documento en formato YYYY-MM-DD (ej: "22 de agosto, 2026" -> "2026-08-22"). Si no se detecta, devuelve null.

Responde ÚNICAMENTE un JSON:
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
      referenceNumber: parsed.referenceNumber ? parseReferenceFromOCR(parsed.referenceNumber) || parsed.referenceNumber : null,
      amount: parsed.amount !== null && parsed.amount !== undefined ? parseAmountFromOCR(String(parsed.amount)) : null,
      date: parsed.date ? parseDateFromOCR(parsed.date) : null
    };
  } catch (err) {
    console.warn('Fallo en Gemini Vision (usando fallback OCR local):', err);
    return null;
  }
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

    const resultadoOCR = {
      referenceNumber: parseReferenceFromOCR(text),
      amount: parseAmountFromOCR(text),
      date: parseDateFromOCR(text)
    };

    if (onProgress) onProgress(100, 'Análisis completado');

    console.log('📄 Extracción con Tesseract OCR completada:', resultadoOCR);

    return resultadoOCR;
  } catch (error) {
    console.warn('⚠️ No se pudieron extraer datos del comprobante (continuando normalmente):', error);
    return { referenceNumber: null, amount: null, date: null };
  }
}
