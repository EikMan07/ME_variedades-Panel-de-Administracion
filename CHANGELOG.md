# Registro de Cambios (Changelog) — ME Variedades

Todos los cambios notables en este proyecto se documentan cronológicamente en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [4.0.0] - 2026-08-30

### ✨ Añadido (Added)
- **Autenticación Biométrica Neuronal**:
  - Modelos neuronales en cliente con `Face-API.js` (`TinyFaceDetector` y `FaceLandmark68Net`) para reconocimiento facial con cámara web.
  - Componente de transición y verificación de seguridad autorizada `<AuthVerifyingScreen />` (1.6s) con animaciones de escáner y autorización.
- **Centro de Comando & Analítica Visual de Alto Contraste**:
  - Gráfica interactiva con Paleta Cromática Armónica: **Cyan Esmeralda** (`#2dd4bf`) para Clientes, **Rosa** (`#f472b6`) para Stock y **Dorado Cálido** (`#fbbf24`) para Pedidos/Finanzas.
  - Sincronización en tiempo real con Supabase y cálculo semanal acumulativo de clientes según `created_at`.
  - Tarjetas de KPIs en vivo para Clientes, Cuentas por Cobrar, Préstamos y Stock.
- **Centro de Notificaciones con Historial**:
  - Pestaña de **"Pendientes"** con badge numérico de alertas no leídas.
  - Pestaña de **"Historial"** con registro de alertas leídas y botones para eliminación individual o vaciado completo del historial con persistencia.
  - Alertas reactivas automáticas para cumpleaños de hoy, stock crítico (0 a 2 unids), cuentas por cobrar vencidas y préstamos por vencer.
- **Bóveda de Facturas y Compilador de Expedientes PDF**:
  - Digitalización y almacenamiento de comprobantes fiscales, recibos y respaldos con selector de cámara en vivo y archivos.
  - Motor de exportación PDF multipágina profesional (`jspdf` + `jspdf-autotable`) en 3 niveles: Individual, Por Categoría y Expediente Consolidado por Cliente.
  - Encabezado simplificado con indicador único "TOTAL ARCHIVOS".
- **Módulo de Pedidos con Edición en Supabase**:
  - Columna dedicada de "Acciones" con botones de edición y cancelación.
  - Modal de edición de pedidos (`updatePedido`) sincronizado con Supabase y ajuste automático de existencias.
- **Documento de Requerimientos Oficial**:
  - Creación de `Documento_Requerimientos_ME_Variedades_V4.html` con estilos `@media print` optimizados para guardado directo en PDF mediante `Ctrl+P`.

### 🔄 Cambiado (Changed)
- **Estandarización de Modales de Creación**:
  - Homogeneización del flujo `handleSubmit` en todos los modales (Productos, Pagos, Abonos, Cobros, Préstamos, Facturas y Clientes) con ejecución `async/await`, reset de estado, notificación flotante inferior (`showToast`) y cierre inmediato (`onClose()`).
- **Ampliación del Modal de Productos a 820px**:
  - Distribución en 2 columnas balanceadas (310px para dropzone/cámara de fotos y 1fr para formulario) para evitar textos o precios cortados.
- **Optimización de Barra de Desplazamiento**:
  - Scrollbar ultrafino (5px) y mate oscuro en la barra de categorías de productos, eliminando la barra blanca nativa del navegador.
- **Diseño del Banner de Login**:
  - Tipografía de alto contraste con "PANEL DE CONTROL" en una sola línea horizontal (`clamp(2.6rem, 4vw, 3.6rem)`), eliminando resplandores molestos y aumentando la legibilidad.
- **Compatibilidad Polimórfica en `Toast.jsx`**:
  - Admisión tanto de argumentos clásicos `showToast('texto', 'success')` como de objetos `{ tipo: 'success', mensaje: '...' }`.

### 🔇 Eliminado / Silenciado (Removed)
- **Eliminación Total de Audio Invasivo**:
  - Supresión definitiva de cualquier reproducción de audio, pitidos o sintetizadores `AudioContext` en la pantalla de inicio de sesión y durante la navegación en la plataforma.
- **Prohibición de Emojis**:
  - Reemplazo absoluto de cualquier carácter emoji por iconos vectoriales SVG limpios y consistentes.

### 🔒 Seguridad (Security)
- Integración con Supabase Cloud mediante claves de entorno protegidas y políticas RLS.
- Bloqueo estricto de eliminación de clientes con deudas activas, pedidos o préstamos abiertos (**Regla RF-15**).

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
- Estructura base SPA con React 18, Vite y Vanilla CSS con Dark Glassmorphism.
- Autenticación administrativa con usuario y contraseña.
- Directorio de clientes con buscador en tiempo real.
- Catálogo de productos con 10 categorías oficiales y control de existencias.
- Asistente Virtual (Chatbot) asistido por IA.
