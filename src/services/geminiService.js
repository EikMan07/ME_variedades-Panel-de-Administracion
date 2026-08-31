/**
 * ME VARIEDADES - Servicio Inteligente Google Gemini & Fallback Local
 */

export function obtenerContextoEnVivo() {
  let clientes;
  try {
    clientes = JSON.parse(localStorage.getItem('me_clientes_data') || '[]');
  } catch {
    clientes = [];
  }

  let productos;
  try {
    productos = JSON.parse(localStorage.getItem('me_productos_data') || '[]');
  } catch {
    productos = [];
  }

  const fechaActual = new Date();
  const nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesActualNum = fechaActual.getMonth() + 1;
  const mesActualNombre = nombresMeses[fechaActual.getMonth()];
  const diaActual = fechaActual.getDate();

  const cumpleanerosMes = clientes.filter(c => Number(c.mes_cumple) === mesActualNum);
  const cumpleanerosHoy = clientes.filter(c => Number(c.mes_cumple) === mesActualNum && Number(c.dia_cumple) === diaActual);

  const totalProductos = productos.length;
  const productosStockBajo = productos.filter(p => Number(p.stock) > 0 && Number(p.stock) < 5);
  const productosAgotados = productos.filter(p => Number(p.stock) === 0);
  const totalStockUnidades = productos.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);

  const usuarioActivo = sessionStorage.getItem('usuario_activo') || 'María';

  return {
    tienda: {
      nombre: 'ME Variedades',
      administradora: usuarioActivo,
      moneda: 'Colones Costarricenses (₡)',
      fecha_sistema: `${diaActual} de ${mesActualNombre} del ${fechaActual.getFullYear()}`,
      mes_actual: mesActualNombre
    },
    metricas_clientes: {
      total_registrados: clientes.length,
      cumpleaneros_este_mes: cumpleanerosMes.map(c => `${c.nombre_completo} (Día ${c.dia_cumple})`),
      cumpleaneros_hoy: cumpleanerosHoy.map(c => c.nombre_completo),
      resumen_clientes: clientes.map(c => ({
        id: c.id,
        nombre: c.nombre_completo,
        telefono: c.telefono,
        cumpleanos: `${c.dia_cumple}/${c.mes_cumple}`,
        pedidos_activos: c.pedidos_activos || 0,
        saldo_pendiente: c.saldo_pendiente || 0
      }))
    },
    metricas_inventario: {
      total_articulos_catalogo: totalProductos,
      total_unidades_fisicas: totalStockUnidades,
      articulos_stock_bajo: productosStockBajo.map(p => `${p.nombre} (${p.stock} unidades)`),
      articulos_agotados: productosAgotados.map(p => p.nombre),
      catalogo_detallado: productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        genero: p.genero || 'No aplica (Maquillaje)',
        costo: `₡${Number(p.costo || 0).toLocaleString('es-CR')}`,
        stock: p.stock
      }))
    },
    reglas_de_negocio: [
      'Tipos de producto válidos: perfume, camisa, short, pantalón, accesorio, zapato, crocs, maquillaje, vestido, aparato electrónico.',
      'El maquillaje NO requiere especificación de género; todos los demás productos deben especificar Hombre, Mujer o Unisex.',
      'El stock bajo se considera cuando hay menos de 5 unidades.',
      'Agotado se considera cuando el stock está en 0.',
      'No se permite eliminar un cliente si tiene pedidos pendientes, saldo adeudado o préstamos abiertos.',
      'Al registrar pedidos o eliminar productos se descuentan automáticamente las unidades del inventario.',
      'Los préstamos calculan monto total = capital + interés mensual y semaforizan: Al día (verde), Próximo a vencer (ámbar), Atrasado (rojo).'
    ]
  };
}

export function generarRespuestaLocal(consulta, ctx) {
  const q = (consulta || '').toLowerCase();

  if (q.includes('cumpleaños') || q.includes('cumple')) {
    if (ctx.metricas_clientes.cumpleaneros_este_mes.length > 0) {
      return `🎉 **Cumpleañeros de este mes (${ctx.tienda.mes_actual}):**\n` +
        ctx.metricas_clientes.cumpleaneros_este_mes.map(c => `• ${c}`).join('\n') +
        `\n\n💡 *Tip:* Puedes felicitarlos o enviarles promociones especiales de ME Variedades.`;
    } else {
      return `📅 Actualmente no hay clientes registrados que cumplan años en el mes de **${ctx.tienda.mes_actual}**.\n\n*Total de clientes registrados en el sistema: ${ctx.metricas_clientes.total_registrados}.*`;
    }
  }

  if (q.includes('cliente') || q.includes('contacto')) {
    if (ctx.metricas_clientes.total_registrados === 0) {
      return `👥 El directorio de clientes actualmente está **vacío (0 clientes)**. Puedes registrar el primer contacto pulsando "+ Nuevo Cliente" en el módulo de Clientes.`;
    } else {
      const nombres = ctx.metricas_clientes.resumen_clientes.map(c => `• **${c.nombre}** (Tel: ${c.telefono})`).join('\n');
      return `👥 Hay **${ctx.metricas_clientes.total_registrados} clientes** registrados:\n${nombres}`;
    }
  }

  if (q.includes('stock bajo') || q.includes('por agotar') || q.includes('escaso')) {
    if (ctx.metricas_inventario.articulos_stock_bajo.length > 0) {
      return `⚠️ **Artículos con Stock Bajo (menos de 5 unidades):**\n` +
        ctx.metricas_inventario.articulos_stock_bajo.map(p => `• ${p}`).join('\n') +
        `\n\nTe sugiero coordinar reposición de inventario para estos productos.`;
    } else {
      return `✅ Excelente noticia: No tienes productos con stock bajo en este momento.`;
    }
  }

  if (q.includes('agotado') || q.includes('sin existencia') || q.includes('cero')) {
    if (ctx.metricas_inventario.articulos_agotados.length > 0) {
      return `🚫 **Artículos Agotados (0 unidades):**\n` +
        ctx.metricas_inventario.articulos_agotados.map(p => `• ${p}`).join('\n') +
        `\n\nPuedes ingresar nuevas unidades desde la sección "Productos e Inventario".`;
    } else {
      return `✅ No hay artículos agotados en tu catálogo.`;
    }
  }

  if (q.includes('producto') || q.includes('inventario') || q.includes('catálogo') || q.includes('catalogo')) {
    return `📦 **Resumen del Inventario:**\n• Total de artículos en catálogo: **${ctx.metricas_inventario.total_articulos_catalogo}**\n• Unidades físicas en stock: **${ctx.metricas_inventario.total_unidades_fisicas} unidades**\n• Con stock bajo: **${ctx.metricas_inventario.articulos_stock_bajo.length}**\n• Agotados: **${ctx.metricas_inventario.articulos_agotados.length}**\n\n💡 *Para respuestas avanzadas con IA generativa, puedes añadir tu Gemini API Key en el botón ⚙️ arriba.*`;
  }

  if (q.includes('préstamo') || q.includes('prestamo') || q.includes('interés') || q.includes('tasa')) {
    return `💰 **Gestión de Préstamos:**\nAl registrar un préstamo en el sistema indicas el capital, la tasa de interés mensual (%) y la fecha límite. El sistema calcula automáticamente el total a devolver (**Capital + Intereses**) y semaforiza su estado (Al día, Próximo a vencer o Atrasado).`;
  }

  if (q.includes('pago') || q.includes('cobro') || q.includes('cuenta')) {
    return `💳 **Pagos y Cuentas por Cobrar:**\nPuedes registrar los abonos de los clientes. El sistema descuenta el saldo pendiente en tiempo real y alerta si una cuenta acordada entra en mora.`;
  }

  return `Hola María. Estoy conectado a la información de **ME Variedades** (${ctx.tienda.fecha_sistema}).\n\nPuedo responderte sobre tus **${ctx.metricas_clientes.total_registrados} clientes**, tus **${ctx.metricas_inventario.total_articulos_catalogo} productos**, cumpleaños del mes o ayudarte con la administración.\n\n*(💡 Puedes activar Google Gemini pulsando el ícono ⚙️ arriba).*`;
}

export async function consultarGemini(promptUsuario, historial, contextoVivo, apiKey) {
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

  let errorAutenticacion = null;

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
          return candidate.content.parts[0].text;
        }
      }

      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || '';

      if (response.status === 400 || response.status === 401 || response.status === 403 || errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('key not found') || errMsg.toLowerCase().includes('unauthenticated')) {
        errorAutenticacion = new Error('API_KEY_INVALID');
        break;
      }

      console.warn(`Aviso Gemini: Modelo ${modelo} retornó estado ${response.status}. Probando siguiente modelo...`);
    } catch (err) {
      if (err.message === 'API_KEY_INVALID') {
        errorAutenticacion = err;
        break;
      }
      console.warn(`Error de red al consultar ${modelo}:`, err);
    }
  }

  if (errorAutenticacion) {
    throw errorAutenticacion;
  }

  const respuestaLocal = generarRespuestaLocal(promptUsuario, contextoVivo);
  return `${respuestaLocal}\n\n*(⚡ Respuesta local por sobrecarga temporal en servidores Gemini).*`;
}
