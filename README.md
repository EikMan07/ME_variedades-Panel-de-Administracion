# ME Variedades — Plataforma de Administración (V4.0)

Plataforma web progresiva (SPA) moderna, intuitiva y de alto rendimiento diseñada para la digitalización, control financiero, gestión de inventario y administración integral de **ME Variedades (Proyecto María)**.

El sistema sustituye por completo los registros manuales en papel por una solución centralizada en la nube con diseño **Dark Glassmorphism de Alto Contraste**, autenticación biométrica neuronal, analítica interactiva y bóveda digital de comprobantes.

---

## 🚀 Características Principales (Versión 4.0)

- **🔐 Autenticación Híbrida y Biometría Facial**:
  - Acceso administrativo mediante credenciales cifradas y reconocimiento facial neuronal en cliente con **Face-API.js** (`TinyFaceDetector` + `FaceLandmark68Net`).
  - Pantalla intermedia de verificación de seguridad autorizada (`<AuthVerifyingScreen />`) con animación de escáner durante 1.6s.
  - Banner de Login con tipografía de alto contraste en una sola línea horizontal (`clamp(2.6rem, 4vw, 3.6rem)`).
  - Operación 100% silenciosa sin audios ni pitidos invasivos.

- **📊 Centro de Comando (Dashboard) y Analítica Visual**:
  - Métricas en vivo (KPIs de Clientes, Cuentas por Cobrar, Préstamos Activos y Stock) sincronizadas con **Supabase Realtime**.
  - Gráfica interactiva con Paleta Cromática Armónica:
    - **Cyan Esmeralda (`#2dd4bf`)**: Total Clientes Registrados (cálculo acumulativo semanal según `created_at`).
    - **Rosa (`#f472b6`)**: Unidades de Stock en Inventario.
    - **Dorado Cálido (`#fbbf24`)**: Pedidos y Finanzas.
  - Distribución de inventario por categoría y panel de **Cumpleaños del Mes**.

- **🔔 Centro de Notificaciones Inteligente con Historial**:
  - Pestaña de **"Pendientes"** con contador en vivo de alertas no leídas.
  - Pestaña de **"Historial"** con registro de eventos pasados y opción de eliminación individual o vaciado completo del historial.
  - Alertas automáticas para cumpleaños de hoy, stock crítico (0 a 2 unidades), créditos vencidos y préstamos por cobrar.

- **👥 Directorio CRM de Clientes**:
  - Ficha de cliente con validación estricta de nombres (solo letras y espacios) y teléfonos de 8 dígitos.
  - Selector visual dinámico de día y mes de cumpleaños (`BirthdayDatePicker`).
  - **Regla de Integridad RF-15**: Bloqueo preventivo de eliminación de clientes con deudas activas, pedidos o préstamos abiertos.

- **👗 Catálogo de Productos e Inventario**:
  - 10 categorías oficiales: Perfumes, Camisas, Shorts, Pantalones, Accesorios, Zapatos, Crocs, Maquillaje, Vestidos y Aparatos Electrónicos.
  - Modal ampliado a 820px estructurado en 2 columnas (310px para dropzone/cámara y 1fr para datos).
  - Captura fotográfica WebRTC en vivo con cámara web/móvil y subida desde galería.
  - Filtros de categorías con barra de desplazamiento ultrafina (5px) y estado activo en degradado vino/rosa oscuro mate.

- **📦 Gestión de Pedidos**:
  - Asociación de clientes del directorio con productos de inventario y descuento automático de stock.
  - Columna dedicada de "Acciones" con botones de edición y cancelación.
  - Modal de edición de pedidos (`updatePedido`) sincronizado en tiempo real con Supabase.

- **💳 Pagos, Cuentas por Cobrar y Cobros**:
  - Registro de créditos y seguimiento de saldos adeudados.
  - Modal de abonos parciales o totales con cálculo automático del saldo restante.
  - Módulo de cobros con cálculo de días transcurridos y método de pago utilizado.

- **💰 Módulo de Préstamos a Terceros**:
  - Préstamos a clientes o terceros con cálculo paramétrico de intereses y plazos de devolución.
  - Modal de amortizaciones con alerta de liquidación total al alcanzar el 100% (₡0 saldo).

- **🧾 Bóveda de Facturas y Compilador de Expedientes PDF**:
  - Digitalización de comprobantes fiscales, recibos y respaldos contables.
  - Compilador de expedientes PDF multipágina profesionales con **jsPDF** y **AutoTable** en 3 niveles de exportación:
    1. **Individual**: Descarga de un comprobante específico con datos y fotografía.
    2. **Por Categoría**: Compilación agrupada (solo pedidos, pagos o préstamos).
    3. **Expediente Consolidado por Cliente**: Historial completo de un cliente en un solo PDF.

- **🤖 Asistente Virtual con IA (Chatbot)**:
  - Widget flotante impulsado por IA para resolución de dudas operativas de la plataforma.

- **✨ Estandarización de UX/UI**:
  - **0% Emojis**: Reemplazo absoluto por iconos vectoriales SVG limpios y consistentes.
  - **Flujo Homogéneo de Modales**: Ejecución asíncrona (`async/await`), reset de estado, notificación flotante inferior (`showToast`) y cierre inmediato (`onClose()`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Base de Datos & Storage** | [Supabase](https://supabase.com/) (PostgreSQL Cloud + Realtime WebSockets) |
| **Biometría Neuronal** | Face-API.js (TinyFaceDetector, FaceLandmark68Net) |
| **Visualización de Datos** | Chart.js 4.x + ChartJS React |
| **Motor de Documentos PDF** | jsPDF + jsPDF-AutoTable |
| **Estilos & UI** | Vanilla CSS (Dark Glassmorphism, CSS Custom Properties, Flexbox, CSS Grid) |
| **Linter & Calidad** | ESLint + Oxlint |

---

## 📁 Estructura del Proyecto

```text
ME-Variedades/
├── public/                                      # Recursos públicos y modelos Face-API
│   └── models/                                  # Pesos de redes neuronales (TinyFaceDetector, etc.)
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
│   ├── context/                                 # Context API Providers (Auth, Client, Product, Order, Pagos, etc.)
│   ├── services/                                # Servicios centralizados (api.js, supabase.js, pdfExportService.js)
│   ├── styles/                                  # Hojas de estilo modulares (global.css, dashboard.css, etc.)
│   ├── App.jsx                                  # Proveedores globales y enrutador
│   └── main.jsx                                 # Punto de entrada de la aplicación
├── Documento_Requerimientos_ME_Variedades_V4.html # Especificación formal SRS V4.0 para imprimir/guardar en PDF (Ctrl+P)
├── CHANGELOG.md                                 # Historial de versiones y cambios
├── CONTRIBUTING.md                             # Guía de contribución y estándares
├── SECURITY.md                                  # Políticas de seguridad del sistema
├── package.json                                 # Dependencias y scripts de Node.js
└── vite.config.js                               # Configuración de Vite
```

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior

### 1. Clonar el repositorio

```bash
git clone https://github.com/eikabarc2008fwdcostarica-cpu/ME-Variedades.git
cd ME-Variedades
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
