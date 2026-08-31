# Registro de Cambios (Changelog) — ME Variedades

Todos los cambios notables en este proyecto se documentan cronológicamente en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
