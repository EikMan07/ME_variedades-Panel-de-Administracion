# Scripts de Utilidad y Pruebas — ME Variedades

Esta carpeta centraliza los scripts de mantenimiento, carga de datos y suites de pruebas de integración para el proyecto.

## Contenido

- **`import_tipo_cambio_csv.mjs`**: Script de migración y carga masiva de históricos de tipo de cambio BCCR en Supabase desde archivos CSV.
- **`tests/`**: Suite de scripts ejecutables con Node.js para validar módulos críticos de forma aislada:
  - `test_chatbot_api.mjs`: Valida el handler serverless de `/api/chatbot` y sus fallbacks.
  - `test_e2e_prestamos.mjs`: Simula cálculo de cuotas, amortizaciones y estados de mora en préstamos.
  - `test_integration_cobros.mjs`: Prueba la generación de mensajes de cobro y notificaciones.
  - `test_numeric_inputs.mjs`: Verifica formateo y parsing de campos numéricos y monetarios.
  - `test_pdf.mjs` / `generar_pdf_prueba.mjs`: Valida la generación de comprobantes y recibos con jsPDF.
  - `test_campana_sonido.mjs`: Comprueba la síntesis de alertas sonoras y notificaciones.
