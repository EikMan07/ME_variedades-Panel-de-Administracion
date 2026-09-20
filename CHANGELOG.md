# Registro de Cambios (Changelog) — ME Variedades

Todos los cambios notables en este proyecto se documentan cronológicamente en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Pendiente / Backlog de Construcción SRS v4.0]
- **H-09: Recuadro Destacado de Notificaciones de Cobro en Dashboard (RF-08, RF-53 a RF-56)**:
  - Tarea de desarrollo pendiente (no de limpieza): Implementar en `DashboardPage.jsx` el recuadro destacado de cobros del día y del día siguiente con enlace directo a WhatsApp (`https://wa.me/...`), sustituyendo/simplificando las pestañas de historial del Topbar según especificación vigente.

---

## [4.4.0] - 2026-09-19

### ✨ Añadido (Added)
- **Módulo de Tipo de Cambio BCCR (USD/CRC)**:
  - **Endpoint Serverless (`/api/tipo-cambio.js`)**: Consulta de cotización oficial del BCCR en tiempo real vía API Gometa, con persistencia diaria en Supabase.
  - **Mecanismo de Contingencia y Alta Disponibilidad**: Ante fallas de conexión o respuestas no exitosas del proveedor externo, el endpoint sirve automáticamente la última cotización verificada guardada en la base de datos con bandera `cached: true`.
  - **Políticas de Caché CDN**: Encabezados `Cache-Control: public, s-maxage=300, stale-while-revalidate=60` en respuestas exitosas en vivo, `public, s-maxage=60, stale-while-revalidate=30` en contingencia, y `no-store` estricto en respuestas de error (401, 405, 503).
  - **Persistencia Histórica en Supabase (`tipo_cambio_historial`)**: Almacenamiento con clave única por fecha y columna `fuente` (`'gometa'` | `'bccr_import'`) para trazabilidad de datos.
  - **Automatización Diaria (Vercel Cron)**: Configuración en `vercel.json` de tarea programada diaria a las 12:00 UTC (06:00 hora Costa Rica) asegurada mediante token `CRON_SECRET`.
  - **Carga Histórica Oficial Auditada (5 Años)**: Importación de 1,827 días naturales verificados (período 2021-09-17 a 2026-09-17) con script `scripts/import_tipo_cambio_csv.mjs` bajo la fuente `'bccr_import'`.
  - **Servicio Cliente Resiliente (`tipoCambioService.js`)**: Paginación transparente por lotes de 1000 registros para superar la limitación de PostgREST en consultas multianuales (`5A` y `Máx`).
  - **Gráfico Interactivo Multirango**: Visualización con Chart.js de tasas de compra y venta para rangos 1D, 5D, 1M, 1A, 5A y Máx, con reducción de densidad (downsampling) semanal/mensual para optimizar el rendimiento.
  - **Tarjetas de Resumen Financiero (KPIs)**: Indicadores de cotización actual, mínimo, máximo, promedio y variación porcentual con selector dinámico entre tasa de venta y tasa de compra.
  - **Convertidor de Divisas Bidireccional**: Herramienta de conversión en tiempo real USD ↔ CRC con selector de tasa (venta/compra) y botón de intercambio de dirección.
  - **Navegación y Rutas**: Integración en el panel administrativo mediante `src/routes/paths.js`, `AppRoutes.jsx` y `Sidebar.jsx` (grupo "CONSULTAS / REPORTES" con icono SVG dedicado).

### 🔒 Seguridad y Configuración
- **Gestión Estricta de Secretos de Servidor**: Variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `CRON_SECRET` leídas exclusivamente en el entorno del servidor sin prefijo `VITE_` ni exposición al bundle cliente.
- **Protección de Datos en Git**: Reglas en `.gitignore` limitando exclusión de archivos CSV a `scratch/*.csv`, manteniendo ignorados `.env` y `.env.*.local` y rastreado `.env.example`.

---

## [4.3.0] - 2026-09-06

### 🧹 Limpieza y Refactorización Arquitectónica (Clean Architecture)
- **Eliminación de Prototipo Legacy (H-01)**:
  - Eliminado `dashboard.html` de la raíz, carpeta `/modules/` y carpeta `/js/`.
- **Purga de Cascarones de Pedidos (H-04)**:
  - Eliminados `PedidosPage.jsx`, `OrderContext.jsx`, `OrderModal.jsx` y carpeta `src/components/pedidos/`.
  - Limpieza de alias residuales (`useOrders`, `OrderProvider`) en `VentasContext.jsx` y ruta `PEDIDOS` en `paths.js`.
- **Eliminación de Hook Huérfano (H-08)**:
  - Eliminado `src/hooks/useDebounce.js`.
- **Desmontaje de Facturas / OCR (H-02)**:
  - Desmontadas rutas y providers de Facturas.
  - Eliminados `FacturasPage.jsx`, `FacturasContext.jsx`, carpeta `src/components/facturas/`, `receiptOcrService.js`, `pdfExportService.js` y `facturas.css`.
  - Desinstalada dependencia `tesseract.js`.
- **Reorganización de Base de Datos y Scripts (H-07)**:
  - Eliminado script destructivo `supabase_reset_clean_data.sql`.
  - Reorganizados scripts de esquema (`supabase_schema.sql`, `supabase_cascade_and_rls_fix.sql`, `supabase_auth_users_clean.sql`) en la carpeta `/supabase/`.
- **Estandarización de Estilos y Assets (H-05, H-06)**:
  - Renombrado `pedidos.css` a `ventas.css` y actualizado `@import` en `index.css`.
  - Eliminados assets corruptos y huérfanos (`index.img`, `hero.png`, `react.svg`, `vite.svg`, copias `.jpg`).
  - Estandarizado logo oficial a `logo-me-variedades.png` (kebab-case) en `src/assets/` y `/public/imgs/`.
- **Biometría Facial (H-03)**:
  - Conservada intacta al 100% por uso activo diario de la administradora.

---

## [4.2.0] - 2026-08-31

### ✨ Añadido (Added)
- **Extracción Automática de Datos OCR en Comprobantes (`receiptOcrService.js`)**:
  - Motor de lectura óptica de caracteres (OCR) integrado con `tesseract.js` cargado dinámicamente en segundo plano.
  - Reconocimiento automático de comprobantes bancarios, transferencias SINPE Móvil, claves numéricas y números de factura.
  - Autocompletado del campo "Referencia o N° Documento" con indicador visual de escaneo y badge de éxito sin bloquear la edición manual.
- **Integración de Vercel Speed Insights**:
  - Inclusión del componente `<SpeedInsights />` a nivel raíz en `App.jsx` para la monitorización en tiempo real de Core Web Vitals (LCP, FID, CLS, INP).
- **Servicio de Compresión de Imágenes en Cliente (`imageCompression.js`)**:
  - Redimensionamiento y optimización automática mediante Canvas API que comprime fotografías de alta resolución (5 MB - 12 MB) a menos de 250 KB en ~50ms antes de subirlas a Supabase Storage.
- **Hook `useDebounce.js`**:
  - Amortiguación de búsquedas y filtros en tablas para evitar re-renderizados continuos.
- **Configuración de CDN y Despliegue (`vercel.json`)**:
  - Políticas de caché inmutable (`max-age=31536000, immutable`) para `/assets/*` y reglas de enrutamiento SPA hacia `/index.html`.

### ⚡ Rendimiento (Performance)
- **Code Splitting Integral con `React.lazy` y `<Suspense>`**:
  - Carga diferida de todas las páginas de la aplicación, reduciendo el bundle inicial a menos de 1 segundo de carga.
- **División de Chunks en Vite (`vite.config.js`)**:
  - Creación de paquetes independientes `vendor-react`, `vendor-supabase` y `vendor-charts`, eliminando todas las advertencias de paquetes mayores a 500 KB.
- **Carga Dinámica Bajo Demanda**:
  - `jspdf` y `jspdf-autotable` se importan asíncronamente solo cuando el usuario solicita la exportación de un PDF.
  - `face-api.js` y `tesseract.js` se cargan únicamente al invocar sus funciones respectivas.

### 📱 Responsive Mobile-First
- **Refactorización de la TopBar**:
  - Ocultamiento de prefijos largos (`ME VARIEDADES /`) y fecha en smartphones (`@media (max-width: 640px)`) para evitar textos truncados y dar prioridad al nombre del módulo y botones de acción.
- **Optimización del Modal de Enrolamiento Biométrico (`FaceEnrollModal.jsx`)**:
  - Formulario apilado verticalmente en 1 columna, visor de cámara autoajustable a 240px de altura y botones flexibles sin cortes.
- **Optimización de la Sección de Analítica (`AnalyticsChartSection.jsx`)**:
  - Reducción de la altura del canvas a 220px y apilamiento limpio de filtros en teléfonos móviles.

### 🔒 Seguridad (Security)
- **Sanitización del Login (`LoginPage.jsx` & `AuthContext.jsx`)**:
  - Eliminación de placeholders y mensajes de error reveladores de credenciales.
- **Validación Estricta en Registro Facial (`FaceEnrollModal.jsx`)**:
  - Exigencia obligatoria de verificación de credenciales de Administrador antes de capturar o guardar descriptores biométricos.
- **Limpieza de Producción (Estado Cero)**:
  - Vaciado de datos de prueba en la base de datos de Supabase y arranque garantizado en estado limpio (`[]`).

---

## [4.0.0] - 2026-08-30

### ✨ Añadido (Added)
- **Autenticación Biométrica Neuronal**:
  - Modelos neuronales en cliente con `Face-API.js` (`TinyFaceDetector` y `FaceLandmark68Net`) para reconocimiento facial con cámara web.
  - Componente de transición y verificación de seguridad autorizada `<AuthVerifyingScreen />` (1.6s) con animaciones de escáner.
- **Centro de Comando & Analítica Visual de Alto Contraste**:
  - Gráfica interactiva con Paleta Cromática Armónica: **Cyan Esmeralda** (`#2dd4bf`) para Clientes, **Rosa** (`#f472b6`) para Stock y **Dorado Cálido** (`#fbbf24`) para Pedidos/Finanzas.
  - Sincronización en tiempo real con Supabase y cálculo semanal acumulativo de clientes según `created_at`.
- **Centro de Notificaciones con Historial**:
  - Pestaña de **"Pendientes"** con badge numérico y pestaña de **"Historial"** con registro de alertas leídas y vaciado con persistencia.
- **Bóveda de Facturas y Compilador de Expedientes PDF**:
  - Digitalización y almacenamiento de comprobantes fiscales, recibos y respaldos con selector de cámara en vivo y archivos.
  - Motor de exportación PDF multipágina profesional (`jspdf` + `jspdf-autotable`) en 3 niveles.
- **Módulo de Pedidos con Edición en Supabase**:
  - Columna dedicada de "Acciones" con botones de edición y cancelación, con ajuste automático de existencias.
- **Documento de Requerimientos Oficial**:
  - Creación de `Documento_Requerimientos_ME_Variedades_V4.html` optimizado para PDF mediante `Ctrl+P`.

### 🔇 Eliminado / Silenciado (Removed)
- **Eliminación Total de Audio Invasivo**: Supresión definitiva de reproducción de audios y pitidos.
- **Prohibición de Emojis**: Reemplazo absoluto por iconos vectoriales SVG.

---

## [3.1.0] - 2026-08-29

### ✨ Añadido (Added)
- Integración de Supabase Client y API REST centralizada (`src/services/api.js`).
- Módulo de Préstamos a Terceros con cálculo paramétrico de intereses y abonos periódicos.
- Módulo de Registro de Cobros con cálculo de días transcurridos.
- Selector dinámico de fecha de cumpleaños con vista visual de día y mes.

---

## [1.0.0] - 2026-08-28

### ✨ Añadido (Added)
- Estructura base SPA con React, Vite y Vanilla CSS con Dark Glassmorphism.
- Autenticación administrativa con usuario y contraseña.
- Directorio de clientes con buscador en tiempo real.
- Catálogo de productos con 10 categorías oficiales y control de existencias.
- Asistente Virtual (Chatbot) asistido por IA.
