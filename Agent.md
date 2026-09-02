# AGENT.md - Memoria del Agente (Referencia Principal)

## 1. Contexto

Actúas como el desarrollador líder de "Proyecto María", la plataforma web de administración para **ME Variedades**, una empresa comercial dedicada a la venta de mercancía variada — indumentaria, calzado, accesorios, perfumería, maquillaje y aparatos electrónicos — que además realiza préstamos de dinero a terceros. El negocio se administraba en hojas físicas de papel, lo que dificultaba ordenar y consultar los datos de clientes, productos, pagos y préstamos. El sistema es administrado por **María**, y digitaliza esa operación en una plataforma web responsiva (celular, tablet y PC), con login personalizado, dashboard central, bóveda de facturas con OCR inteligente, autenticación biométrica y diseño "aesthetic" dark glassmorphism.

### Actores y roles del sistema
- **Administradora (María) — acceso total.** Agrega, edita y elimina clientes, productos, pagos, cobros, pedidos, préstamos y facturas; visualiza el dashboard analítico y exporta expedientes en PDF.

### Módulos del sistema (alcance v4.2)
Login Híbrido (Credenciales + Biometría Facial) · Dashboard (con KPIs y analítica interactiva) · Clientes CRM (con avisos de cumpleaños) · Pagos y Cuentas por Cobrar · Cobros · Productos e Inventario (10 categorías oficiales) · Pedidos (con descuento de existencias) · Préstamos a Terceros · Bóveda de Facturas y Comprobantes (con OCR automático y exportador PDF multipágina) · Asistente Virtual (chatbot con IA).

### Arquitectura de datos y rendimiento
- **Fuente de verdad:** Supabase Cloud (PostgreSQL + Realtime WebSockets + Storage).
- **Cero datos ficticios (Zero Mock Data Policy):** Todo el estado inicial del frontend comienza estrictamente en `[]` (arreglo vacío).
- **Rendimiento Ultrarrápido:** Code splitting mediante `React.lazy` y `Suspense`, división de chunks en Vite (`vendor-react`, `vendor-supabase`, `vendor-charts`), carga dinámica bajo demanda (`jspdf`, `face-api`, `tesseract.js`) y compresión de fotos en el cliente (< 250 KB).
- **Métricas y CDN:** Vercel Speed Insights integrado a nivel raíz y `vercel.json` con políticas de caché inmutable.

---

## 2. Requerimientos

### Funcionales — Gestión de Productos
- Tipos de producto disponibles: perfume, camisa, short, pantalón, accesorio, zapato, crocs, maquillaje, vestido y aparato electrónico (RF-27).
- Si el tipo seleccionado **no** es maquillaje, se debe pedir especificar si es de hombre o de mujer; esta opción se omite exclusivamente para maquillaje (RF-28).
- Al agregar o editar un producto, se debe permitir tomar una foto con la cámara del dispositivo o elegir una imagen de la galería, pasando por compresión automática en cliente (RF-29).
- El módulo debe mostrar el stock disponible por tipo de producto y contar con buscador por tipo (RF-30, RF-31).
- Al eliminar un producto, se debe restar automáticamente la unidad correspondiente del stock de ese tipo de producto (RF-33).

### Funcionales — Gestión de Pedidos
- Al crear un pedido se busca al cliente, se elige uno o varios productos del inventario disponible, y el stock del producto elegido se descuenta al confirmar (RF-34 a RF-37).
- Soporte para edición de pedidos (`updatePedido`) con reajuste automático de stock en Supabase.

### Funcionales — Gestión de Préstamos
- Al registrar un préstamo se indica la persona, el monto, la tasa de interés y el plazo/fecha límite; el sistema calcula el monto total a devolver (capital + interés) y lista los préstamos activos con su estado: al día, próximo a vencer o atrasado; se pueden registrar abonos que actualicen el saldo pendiente hasta su liquidación al 100% (RF-39 a RF-43).

### Funcionales — Eliminación de Clientes (Regla RF-15)
- No se permite eliminar un cliente si tiene relación activa con la empresa (pedidos en curso, pagos pendientes o préstamos abiertos); el botón de eliminar debe bloquearse y mostrar aviso explicativo (RF-15).

### Funcionales — Bóveda de Facturas, OCR y Expedientes PDF
- Carga de comprobantes con cámara en vivo o archivo (.png, .jpg, .webp, .pdf).
- **Extracción Automática OCR:** Análisis en segundo plano con `receiptOcrService.js` para extraer y autocompletar el número de comprobante, referencia o autorización SINPE Móvil sin bloquear la edición manual.
- **Compilador PDF Multipágina:** Exportación profesional de comprobantes mediante `pdfExportService.js` en 3 niveles (Individual, Por Categoría y Expediente Consolidado por Cliente).

### Funcionales — Autenticación y Enrolamiento Biométrico
- Inicio de sesión con credenciales administrativas (`maria` / `DSE777`) o escaneo facial neuronal (`FaceLoginModal`).
- Enrolamiento de nuevo rostro (`FaceEnrollModal`) con verificación estricta previa de credenciales de administrador (`maria` / `DSE777`).
- Pantalla de verificación y transición autorizada `<AuthVerifyingScreen />` (1.6s).

---

## 3. Estándares Técnicos y Directivas Obligatorias

1. **Zero Mock Data Policy:** Los contextos y tablas deben iniciar en `[]` y reflejar exclusivamente los datos de Supabase.
2. **0% Emojis Policy:** Prohibido el uso de emojis en interfaces, botones, badges, modales o documentos generados; usar únicamente iconos vectoriales SVG.
3. **No Audio Policy:** Silenciado total sin reproductores de audio ni `AudioContext`.
4. **Mobile-First Responsive Design:** Todas las vistas, TopBar, modales y widgets deben adaptarse con fluidez en pantallas móviles (`@media (max-width: 640px)`).
5. **Compresión Previa de Imágenes:** Toda fotografía tomada o subida debe procesarse con `imageCompression.js` antes de transferirse a Supabase Storage.
6. **Code Splitting & Dynamic Imports:** Las librerías pesadas (`jspdf`, `jspdf-autotable`, `tesseract.js`, `face-api.js`) solo deben cargarse bajo demanda al invocar su función correspondiente.

---

## 4. Servicios Centralizados

| Servicio | Archivo | Responsabilidad |
|---|---|---|
| **API Client** | `src/services/api.js` | CRUD centralizado con Supabase para clientes, productos, pedidos, pagos, cobros, préstamos y facturas. |
| **Supabase Client** | `src/services/supabase.js` | Inicialización de cliente Supabase con credenciales seguras. |
| **Receipt OCR** | `src/services/receiptOcrService.js` | Extracción inteligente de referencias de comprobantes bancarios y SINPE con Tesseract OCR. |
| **Image Compression** | `src/services/imageCompression.js` | Redimensionamiento y compresión en cliente (reducción de fotos de 8MB a <250KB vía Canvas). |
| **PDF Export Engine** | `src/services/pdfExportService.js` | Generación de expedientes PDF multipágina con carga dinámica de `jspdf`. |
| **Biometric Auth** | `src/services/biometricService.js` | Carga asíncrona de modelos neuronales y emparejamiento de vectores faciales con Face-API.js. |
