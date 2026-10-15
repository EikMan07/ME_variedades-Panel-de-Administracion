import handler from '../api/chatbot.js';

// 1. Prueba de simulación del handler serverless
async function testHandler() {
  console.log('--- Iniciando prueba del Handler Serverless /api/chatbot ---');

  let statusCode = 0;
  let responseData = null;

  const mockReq = {
    method: 'POST',
    body: {
      promptUsuario: '¿Cuántos productos tengo?',
      historial: [],
      contextoVivo: {
        tienda: { nombre: 'ME Variedades', fecha_sistema: '14 de septiembre 2026' },
        metricas_clientes: { total_registrados: 5 },
        metricas_inventario: {
          total_articulos_catalogo: 12,
          total_unidades_fisicas: 45,
          articulos_stock_bajo: [],
          articulos_agotados: []
        }
      }
    }
  };

  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    end() {
      return this;
    }
  };

  await handler(mockReq, mockRes);

  console.log('Status Code:', statusCode);
  console.log('Respuesta recibida:', responseData);

  if (statusCode === 200 && responseData?.text) {
    console.log('✅ TEST PASSED: El handler responde correctamente y devuelve texto formateado.');
  } else {
    console.error('❌ TEST FAILED: Respuesta inesperada.');
    process.exit(1);
  }
}

testHandler().catch(console.error);
