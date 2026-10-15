# Capa de Servicios — ME Variedades (`src/services/`)

Esta carpeta centraliza todas las comunicaciones con servicios externos, APIs y persistencia de datos:

## Módulos de Servicio

1. **`supabase.js`**: Cliente singleton de Supabase inicializado con variables de entorno de Vite (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. **`api.js`**: Operaciones CRUD y consultas a las tablas de Supabase (`productos`, `clientes`, `ventas`, `pedidos`, `pagos`, `prestamos`, `usuarios_sistema`).
3. **`cobroNotificationService.js`**: Generación estructurada de mensajes de cobro, estados de mora y plantillas de WhatsApp.
4. **`tipoCambioService.js`**: Consumo del tipo de cambio oficial BCCR (vía `/api/tipo-cambio`), cálculo de conversiones y persistencia en historial.
5. **`geminiService.js`**: Conexión con el Asistente Virtual IA comunicándose de forma segura con la función serverless `/api/chatbot`.
6. **`biometricService.js`**: Carga de modelos neuronales `face-api.js` y comparación de vectores faciales para autenticación.
7. **`imageCompression.js`**: Compresión ligera de imágenes en el cliente antes de almacenamiento.
8. **`notificationService.js`**: Despacho de notificaciones visuales (Toast) y auditivas (Web Audio API) en el navegador.
