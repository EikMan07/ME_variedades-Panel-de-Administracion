/**
 * ME VARIEDADES — Serverless Function para Alertas WhatsApp vía CallMeBot API
 * Endpoint seguro: /api/whatsapp-notify (POST)
 * 
 * Despacha notificaciones en tiempo real al WhatsApp del administrador de forma
 * 100% gratuita sin exponer la API key al cliente.
 */

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      error: 'Método no permitido. Solo se acepta POST.' 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { titulo, mensaje, tipo = 'sistema' } = body;

    if (!mensaje || typeof mensaje !== 'string') {
      return res.status(400).json({ 
        ok: false, 
        error: 'El campo "mensaje" es obligatorio y debe ser una cadena de texto.' 
      });
    }

    // Lectura segura de variables de entorno del servidor
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;
    const apiKey = process.env.CALLMEBOT_API_KEY;

    if (!adminPhone || !apiKey) {
      console.warn('[CallMeBot WhatsApp] Variables WHATSAPP_ADMIN_PHONE o CALLMEBOT_API_KEY no configuradas en el servidor.');
      return res.status(400).json({
        ok: false,
        error: 'Servicio de WhatsApp no configurado.',
        details: 'Debes definir WHATSAPP_ADMIN_PHONE y CALLMEBOT_API_KEY en las variables de entorno de Vercel / .env.',
        instructions: 'Obtén tu API key gratuita enviando "I allow callmebot to send me messages" al +34 644 10 55 84 en WhatsApp.'
      });
    }

    // Normalización de número telefónico (código de país 506 para Costa Rica si tiene 8 dígitos)
    let cleanPhone = String(adminPhone).replace(/\D/g, '');
    if (cleanPhone.length === 8) {
      cleanPhone = `506${cleanPhone}`;
    }

    // Emojis según tipo de alerta
    let icono = '🔔';
    if (tipo === 'cumpleanos') icono = '🎉';
    else if (tipo === 'stock_bajo' || tipo === 'stock_agotado') icono = '⚠️';
    else if (tipo === 'venta') icono = '🛍️';
    else if (tipo === 'pago') icono = '💰';
    else if (tipo === 'prueba') icono = '🧪';

    const textoFormateado = `${icono} *${titulo || 'Alerta ME Variedades'}*\n\n${mensaje}\n\n_Centro de Control ME Variedades_`;

    const urlCallMeBot = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(textoFormateado)}&apikey=${apiKey.trim()}`;

    // Despacho HTTP con timeout de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const respuesta = await fetch(urlCallMeBot, {
      method: 'GET',
      headers: {
        'User-Agent': 'ME-Variedades-Admin/4.2 (+https://me-variedades-panel-de-administraci.vercel.app)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const respuestaTexto = await respuesta.text();

    if (!respuesta.ok || respuestaTexto.toLowerCase().includes('error') || respuestaTexto.toLowerCase().includes('failed')) {
      console.error('[CallMeBot WhatsApp] Error devuelto por la API:', respuestaTexto);
      return res.status(502).json({
        ok: false,
        error: 'CallMeBot rechazó la solicitud.',
        details: respuestaTexto.slice(0, 300)
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Notificación enviada exitosamente a WhatsApp.',
      tipo,
      telefonoDestino: cleanPhone
    });

  } catch (err) {
    console.error('[CallMeBot WhatsApp] Excepción en handler:', err);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al procesar el envío de WhatsApp.',
      message: err.message
    });
  }
}
