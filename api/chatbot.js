/**
 * ME VARIEDADES — Serverless Function para Google Gemini API
 * Endpoint seguro: /api/chatbot
 * 
 * Cumple con RF-60 (SRS v4.0): La API key se almacena exclusivamente en las
 * variables de entorno del servidor (GEMINI_API_KEY) y jamás se expone al cliente.
 */

// Función auxiliar de respuesta local de contingencia en caso de que Gemini no esté disponible
function generarRespuestaLocalServidor(consulta, ctx) {
  const q = (consulta || '').toLowerCase();

  const totalClientes = ctx?.metricas_clientes?.total_registrados ?? 0;
  const totalArticulos = ctx?.metricas_inventario?.total_articulos_catalogo ?? 0;
  const fechaSistema = ctx?.tienda?.fecha_sistema || 'la fecha actual';
  const mesActual = ctx?.tienda?.mes_actual || 'este mes';

  if (q.includes('cumpleaños') || q.includes('cumple')) {
    const cumpleaneros = ctx?.metricas_clientes?.cumpleaneros_este_mes || [];
    if (cumpleaneros.length > 0) {
      return `🎉 **Cumpleañeros de este mes (${mesActual}):**\n` +
        cumpleaneros.map(c => `• ${c}`).join('\n') +
        `\n\n💡 *Tip:* Puedes felicitarlos o enviarles promociones especiales de ME Variedades.`;
    } else {
      return `📅 Actualmente no hay clientes registrados que cumplan años en el mes de **${mesActual}**.\n\n*Total de clientes registrados en el sistema: ${totalClientes}.*`;
    }
  }

  if (q.includes('cliente') || q.includes('contacto')) {
    if (totalClientes === 0) {
      return `👥 El directorio de clientes actualmente está **vacío (0 clientes)**. Puedes registrar el primer contacto pulsando "+ Nuevo Cliente" en el módulo de Clientes.`;
    } else {
      const resumen = ctx?.metricas_clientes?.resumen_clientes || [];
      const nombres = resumen.map(c => `• **${c.nombre}** (Tel: ${c.telefono})`).join('\n');
      return `👥 Hay **${totalClientes} clientes** registrados:\n${nombres}`;
    }
  }

  if (q.includes('stock bajo') || q.includes('por agotar') || q.includes('escaso')) {
    const stockBajo = ctx?.metricas_inventario?.articulos_stock_bajo || [];
    if (stockBajo.length > 0) {
      return `⚠️ **Artículos con Stock Bajo (menos de 5 unidades):**\n` +
        stockBajo.map(p => `• ${p}`).join('\n') +
        `\n\nTe sugiero coordinar reposición de inventario para estos productos.`;
    } else {
      return `✅ Excelente noticia: No tienes productos con stock bajo en este momento.`;
    }
  }

  if (q.includes('agotado') || q.includes('sin existencia') || q.includes('cero')) {
    const agotados = ctx?.metricas_inventario?.articulos_agotados || [];
    if (agotados.length > 0) {
      return `🚫 **Artículos Agotados (0 unidades):**\n` +
        agotados.map(p => `• ${p}`).join('\n') +
        `\n\nPuedes ingresar nuevas unidades desde la sección "Productos e Inventario".`;
    } else {
      return `✅ No hay artículos agotados en tu catálogo.`;
    }
  }

  if (q.includes('producto') || q.includes('inventario') || q.includes('catálogo') || q.includes('catalogo')) {
    const unidades = ctx?.metricas_inventario?.total_unidades_fisicas ?? 0;
    const stockBajoLen = ctx?.metricas_inventario?.articulos_stock_bajo?.length ?? 0;
    const agotadosLen = ctx?.metricas_inventario?.articulos_agotados?.length ?? 0;
    return `📦 **Resumen del Inventario:**\n• Total de artículos en catálogo: **${totalArticulos}**\n• Unidades físicas en stock: **${unidades} unidades**\n• Con stock bajo: **${stockBajoLen}**\n• Agotados: **${agotadosLen}**`;
  }

  if (q.includes('préstamo') || q.includes('prestamo') || q.includes('interés') || q.includes('tasa')) {
    return `💰 **Gestión de Préstamos:**\nAl registrar un préstamo en el sistema indicas el capital, la tasa de interés mensual (%) y la fecha límite. El sistema calcula automáticamente el total a devolver (**Capital + Intereses**) y semaforiza su estado (Al día, Próximo a vencer o Atrasado).`;
  }

  if (q.includes('pago') || q.includes('cobro') || q.includes('cuenta')) {
    return `💳 **Pagos y Cuentas por Cobrar:**\nPuedes registrar los abonos de los clientes. El sistema descuenta el saldo pendiente en tiempo real y alerta si una cuenta acordada entra en mora.`;
  }

  return `Hola María. Estoy conectado a la información de **ME Variedades** (${fechaSistema}).\n\nPuedo responderte sobre tus **${totalClientes} clientes**, tus **${totalArticulos} productos**, cumpleaños del mes o ayudarte con la administración.`;
}

export default async function handler(req, res) {
  // Configuración de CORS
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
    return res.status(405).json({ error: 'Método no permitido. Solo se acepta POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { promptUsuario, historial = [], contextoVivo = {} } = body;

    if (!promptUsuario || typeof promptUsuario !== 'string') {
      return res.status(400).json({ error: 'El parámetro "promptUsuario" es obligatorio.' });
    }

    // Lectura de la API key EXCLUSIVAMENTE del entorno del servidor
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[Serverless Chatbot] GEMINI_API_KEY no configurada. Usando respuesta local de contingencia.');
      const localText = generarRespuestaLocalServidor(promptUsuario, contextoVivo);
      return res.status(200).json({
        text: `${localText}\n\n*(⚡ Modo Local: Para activar IA Generativa en la nube, configura GEMINI_API_KEY en las Variables de Entorno).*`,
        source: 'local_no_key'
      });
    }

    const MODELOS = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.6-flash'
    ];

    const systemInstruction = `
Eres el Asistente Virtual Oficial con Inteligencia Artificial de "ME Variedades", la plataforma administrativa de María.
Toda tu información proviene directamente de la base de datos y la documentación oficial del negocio. Tu rol es asesorar, guiar paso a paso, responder dudas operativas y analizar estadísticas del negocio con elegancia y precisión.

DATOS VIVOS Y ACTUALIZADOS DE ME VARIEDADES:
${JSON.stringify(contextoVivo, null, 2)}

MANUAL OPERATIVO Y REGLAS:
1. CLIENTES: Registro con nombre, teléfono (8 dígitos) y fecha de nacimiento. Bloqueo estricto de eliminación si tiene pedidos activos, saldo o préstamos.
2. PRODUCTOS: Categorías válidas (perfume, camisa, short, pantalón, accesorio, zapato, crocs, maquillaje, vestido, aparato electrónico). Género obligatorio excepto en maquillaje. Stock bajo < 5, agotado = 0.
3. DASHBOARD: Métricas de KPIs, cumpleaños del mes y del día ("¡Hoy!"), semaforización de alertas de mora y stock.

DIRECTRICES DE RESPUESTA:
- Trato cordial, profesional y elegante dirigido a María o al equipo.
- Pasos numerados claros (1., 2., 3.) cuando pregunten cómo realizar una tarea.
- Respuestas completas en Markdown con subtítulos y viñetas.
- Nunca uses nomenclaturas técnicas internas como "RF-15" o "RNF" en las respuestas a la usuaria.
    `.trim();

    const requestBody = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        ...historial,
        {
          role: 'user',
          parts: [{ text: promptUsuario }]
        }
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2500,
        topP: 0.95
      }
    };

    let geminiResponseText = null;

    for (const modelo of MODELOS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates && data.candidates[0];
          if (candidate?.content?.parts?.[0]?.text) {
            geminiResponseText = candidate.content.parts[0].text;
            break;
          }
        } else {
          console.warn(`[Serverless Chatbot] Modelo ${modelo} respondió con status ${response.status}`);
        }
      } catch (errModelo) {
        console.warn(`[Serverless Chatbot] Error de red consultando ${modelo}:`, errModelo.message);
      }
    }

    if (geminiResponseText) {
      return res.status(200).json({
        text: geminiResponseText,
        source: 'gemini'
      });
    }

    // Si los modelos fallan por cuota o indisponibilidad temporal
    const fallbackText = generarRespuestaLocalServidor(promptUsuario, contextoVivo);
    return res.status(200).json({
      text: `${fallbackText}\n\n*(⚡ Respuesta local por sobrecarga temporal en servidores Gemini).*`,
      source: 'fallback_local'
    });
  } catch (error) {
    console.error('[Serverless Chatbot] Error general:', error);
    return res.status(500).json({
      error: 'Error interno en el servidor al procesar la solicitud del chatbot.'
    });
  }
}
