# ME Variedades — Plataforma de Administración (V4.2)

Plataforma web progresiva (SPA) moderna, intuitiva y de alto rendimiento diseñada para la digitalización, control financiero, gestión de inventario y administración integral de **ME Variedades (Proyecto María)**.

El sistema sustituye por completo los registros manuales en papel por una solución centralizada en la nube con diseño **Dark Glassmorphism de Alto Contraste**, autenticación biométrica neuronal, analítica interactiva, extracción OCR automática y compilador digital de expedientes PDF.

---

## 🚀 Características Principales (Versión 4.2)

- **🔐 Autenticación Híbrida y Biometría Facial Segura**:
  - Acceso administrativo mediante credenciales cifradas y reconocimiento facial neuronal en cliente con **Face-API.js** (`TinyFaceDetector` + `FaceLandmark68Net`).
  - **Enrolamiento con Verificación de Administrador**: Registro de nuevos rostros condicionado a la validación de credenciales previas.
  - Pantalla intermedia de verificación de seguridad autorizada (`<AuthVerifyingScreen />`) con animación de escáner durante 1.6s.
  - Operación 100% silenciosa sin audios ni pitidos invasivos.

- **📊 Centro de Comando (Dashboard) y Analítica Visual**:
  - Métricas en vivo (KPIs de Clientes, Cuentas por Cobrar, Préstamos Activos y Stock) sincronizadas con **Supabase Realtime**.
  - Gráfica interactiva con Paleta Cromática Armónica:
    - **Cyan Esmeralda (`#2dd4bf`)**: Total Clientes Registrados (cálculo acumulativo semanal según `created_at`).
    - **Rosa (`#f472b6`)**: Unidades de Stock en Inventario.
    - **Dorado Cálido (`#fbbf24`)**: Pedidos y Finanzas.
  - Distribución de inventario por categoría y panel de **Cumpleaños del Mes**.

- **🧠 Bóveda de Facturas con Extracción OCR y Expedientes PDF**:
  - Digitalización de comprobantes fiscales, recibos bancarios y transferencias SINPE Móvil.
  - **Extracción Automática OCR (`tesseract.js`)**: Escaneo en segundo plano para autocompletar números de referencia, autorización y comprobantes sin bloquear la edición.
  - Compilador de expedientes PDF multipágina profesionales con **jsPDF** y **AutoTable** en 3 niveles (Individual, Por Categoría y Consolidado).

- **⚡ Optimización de Rendimiento Extremo & Vercel Speed Insights**:
  - **Code Splitting con `React.lazy`**: Carga modular de páginas y bundle inicial en < 1 segundo.
  - **División de Chunks**: Separación de dependencias en paquetes independientes (`vendor-react`, `vendor-supabase`, `vendor-charts`).
  - **Compresión de Fotos en Cliente**: Reducción de imágenes de alta resolución (8 MB) a < 250 KB en ~50ms antes de su almacenamiento en Supabase.
  - **Vercel Speed Insights**: Monitorización en vivo de Core Web Vitals (LCP, FID, CLS, INP).
  - **Caché Inmutable (`vercel.json`)**: Configuración CDN para carga instantánea de recursos estáticos.

- **📱 Diseño Responsivo Mobile-First**:
  - TopBar adaptativa que prioriza el nombre del módulo actual y los botones de acción en smartphones.
  - Modales con scroll vertical interno suave y botones flexibles.
  - Sección de analítica y KPIs optimizados para pantallas táctiles.

- **👥 CRM de Clientes, Inventario, Pedidos y Préstamos**:
  - Catálogo de 10 categorías oficiales con cámara WebRTC y control de existencias.
  - Gestión de pedidos con reajuste automático de stock en Supabase.
  - Cuentas por cobrar y abonos a préstamos con cálculo paramétrico de intereses y liquidación al 100%.
  - **Regla RF-15**: Bloqueo de eliminación de clientes con deudas o pedidos activos.

- **✨ Directivas de Diseño**:
  - **Zero Mock Data Policy**: Arranque garantizado en estado limpio (`[]`).
  - **0% Emojis Policy**: Uso exclusivo de iconografía vectorial SVG limpia.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/) |
| **Base de Datos & Storage** | [Supabase](https://supabase.com/) (PostgreSQL Cloud + Realtime WebSockets + Storage) |
| **Motor OCR / Visión** | Tesseract.js (Carga dinámica bajo demanda) |
| **Biometría Neuronal** | Face-API.js (TinyFaceDetector, FaceLandmark68Net) |
| **Visualización de Datos** | Chart.js 4.x + ChartJS React |
| **Generador de Documentos** | jsPDF + jsPDF-AutoTable (Carga dinámica bajo demanda) |
| **Métricas de Rendimiento** | Vercel Speed Insights (`@vercel/speed-insights`) |
| **Estilos & UI** | Vanilla CSS (Dark Glassmorphism, CSS Grid, Flexbox, Mobile-First) |

---

## 📁 Estructura del Proyecto

```text
ME-Variedades/
├── public/                                      # Recursos públicos y modelos Face-API
├── src/
│   ├── assets/                                  # Logotipo oficial e imágenes de marca
│   ├── components/                              # Componentes modulares
│   │   ├── biometrics/                          # FaceLoginModal, FaceEnrollModal, AuthVerifyingScreen
│   │   ├── chatbot/                             # Asistente virtual flotante
│   │   ├── clientes/                            # ClientModal, ClientTable, ClientBlockedModal
│   │   ├── cobros/                              # ModalRegistrarCobro, CobrosTable, CobrosKPIs
│   │   ├── common/                              # Modal, Toast, CustomDatePicker, BirthdayDatePicker
│   │   ├── dashboard/                           # AnalyticsChartSection, KPICards, StockDistributionCard
│   │   ├── facturas/                            # FacturasGrid, ModalNuevaFactura, ModalPreviewFactura
│   │   ├── layout/                              # Sidebar, Topbar, NotificationsCenter
│   │   ├── pagos/                               # ModalRegistrarPago, ModalAbono, PagosTable
│   │   ├── pedidos/                             # OrderModal, OrderTable
│   │   ├── prestamos/                           # ModalRegistrarPrestamo, ModalAbonoPrestamo, PrestamosTable
│   │   └── productos/                           # ProductModal, ProductTable, ProductGrid
│   ├── context/                                 # Context API Providers (Auth, Client, Product, Order, etc.)
│   ├── hooks/                                   # Custom hooks (useDebounce, useBiometricAuth, useChatbot)
│   ├── services/                                # Servicios centralizados (api, imageCompression, receiptOcrService, pdfExportService)
│   ├── styles/                                  # Hojas de estilo modulares (global.css, dashboard.css, facturas.css, etc.)
│   ├── App.jsx                                  # Proveedores globales, SpeedInsights y enrutador
│   └── main.jsx                                 # Punto de entrada de la aplicación
├── Documento_Requerimientos_ME_Variedades_V4.html # Especificación formal SRS V4.0 para imprimir/guardar en PDF (Ctrl+P)
├── vercel.json                                  # Configuración de CDN, SPA Routing y encabezados de caché
├── CHANGELOG.md                                 # Historial de versiones y cambios
├── CONTRIBUTING.md                             # Guía de contribución y estándares
├── SECURITY.md                                  # Políticas de seguridad del sistema
├── package.json                                 # Dependencias y scripts de Node.js
└── vite.config.js                               # Configuración de Vite y división de chunks
```

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior

### 1. Clonar el repositorio

```bash
git clone https://github.com/EikMan07/ME_variedades-Panel-de-Administracion.git
cd ME_variedades-Panel-de-Administracion
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de Entorno

Crea un archivo `.env` o `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_GEMINI_API_KEY=tu_gemini_api_key
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible localmente en `http://localhost:5173`.

### 5. Compilar para Producción

```bash
npm run build
```

---

## 📄 Documento Oficial de Requerimientos (SRS V4.0)

Para generar y consultar el documento formal de especificación del sistema en formato PDF oficial:
1. Abre el archivo `Documento_Requerimientos_ME_Variedades_V4.html` directamente en tu navegador web.
2. Presiona **Ctrl + P** (o **Cmd + P** en Mac).
3. Selecciona **"Guardar como PDF"** con márgenes predeterminados. Los estilos tipográficos `@media print` darán como resultado el documento oficial de 16 páginas.

---

## 🔑 Credenciales de Acceso (Entorno Local)

- **Usuario**: `maria_admin` (o `maria`)
- **Contraseña**: `admin123` (o `admin`)
- **Acceso Biométrico**: Reconocimiento facial registrado mediante la cámara web.

---

## 📄 Licencia y Propiedad

Desarrollado para **ME Variedades**. Todos los derechos reservados © 2026.
