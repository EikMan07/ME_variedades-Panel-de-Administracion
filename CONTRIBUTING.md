# Guía de Contribución — ME Variedades

Gracias por tu interés en contribuir a la plataforma de administración de **ME Variedades (Proyecto María — Versión 4.0)**. Para garantizar la calidad, coherencia estética, robustez arquitectónica y estabilidad del código, todos los desarrolladores deben cumplir estrictamente con las siguientes directrices y estándares del proyecto.

---

## 🧭 Principios Fundamentales del Proyecto

1. **Zero Mock Data Policy**:
   - Queda estrictamente prohibido introducir listas simuladas de clientes ficticios, productos de prueba estáticos o pedidos de ejemplo en el código base o almacenamiento por defecto.
   - El sistema debe iniciar 100% limpio y renderizar *Empty States* atractivos cuando no existan registros en la base de datos de Supabase.

2. **Estética Dark Glassmorphism & High-Contrast**:
   - Respetar la paleta cromática oficial:
     - Fondo Principal: Negro Carbón / Dark Matte (`#0D0D0D` / `#121212`)
     - Superficies Glassmorphism: `rgba(255, 255, 255, 0.03)` con desenfoque de fondo (`backdrop-filter: blur(12px)`) y bordes en `rgba(244, 180, 200, 0.15)`
     - Acentos de Marca: Rosa Empolvado (`#f4b4c8` / `#9a6e79`), Vino Oscuro (`#5e2634`)
     - Analítica de Datos: Cyan Esmeralda (`#2dd4bf`) para Clientes, Rosa (`#f472b6`) para Stock y Dorado Cálido (`#fbbf24`) para Pedidos y Finanzas.
   - Ningún control nativo de formulario (`<input>`, `<select>`, `<option>`) debe mostrar fondos blancos por defecto del navegador.

3. **Prohibición Estricta de Emojis**:
   - **0% Emojis:** Queda totalmente prohibido el uso de caracteres emoji (ej. 📦, 🔔, 👤, 💰) en interfaces operativas, botones, badges, modales, tablas o documentos generados.
   - Utilizar **exclusivamente iconos vectoriales SVG limpios** con trazo uniforme (`stroke-width="2"`, `fill="none"`, `stroke="currentColor"`).

4. **Flujo Estandarizado de Modales (CRUD)**:
   - Todo modal de creación o edición debe implementar el flujo asíncrono estándar:
     1. Ejecución con `async/await` contra el servicio centralizado de `api.js` o contexto.
     2. Disparo inmediato del mensaje flotante inferior (`showToast({ tipo: 'success', mensaje: '...' })`).
     3. Limpieza completa del estado y variables del formulario.
     4. Cierre inmediato del modal invocando `onClose()`.

5. **Modo 100% Silencioso**:
   - No añadir reproductores de sonido, llamadas a `new Audio()`, sintetizadores `AudioContext` ni efectos de sonido en la pantalla de inicio de sesión ni durante la navegación en la plataforma.

6. **Validación Inmediata y Resiliente**:
   - Validar cada campo en tiempo real o en el envío con mensajes descriptivos en español natural.
   - Nombres: solo letras y espacios (sin números ni caracteres especiales).
   - Teléfonos: exactamente 8 dígitos numéricos.
   - Cumpleaños: selector visual de día y mes sin requerir el año.

---

## 🌿 Flujo de Trabajo con Git

### 1. Convención de Ramas

Crea ramas con nombres descriptivos según el tipo de cambio:

- `feature/nombre-de-la-funcionalidad`: Nuevas funciones o módulos (ej. `feature/modulo-facturas-pdf`).
- `fix/descripcion-del-error`: Corrección de errores (ej. `fix/sincronizacion-clientes-grafica`).
- `refactor/area-refactorizada`: Mejoras internas de código o rendimiento (ej. `refactor/modal-productos-820px`).
- `docs/documentacion-actualizada`: Modificaciones en documentación (ej. `docs/actualizar-srs-v4`).

### 2. Mensajes de Commit (Conventional Commits)

Utiliza el formato estándar para mensajes de confirmación:

```text
<tipo>: <descripción breve en presente y minúsculas>
```

**Tipos válidos:**
- `feat:` Nueva característica funcional o componente para el usuario.
- `fix:` Corrección de un error o bug de lógica/interfaz.
- `docs:` Modificaciones en documentación (`README.md`, `Agent.md`, `CONTRIBUTING.md`, etc.).
- `style:` Cambios visuales, espaciados o CSS que no alteran la lógica de negocio.
- `refactor:` Reestructuración interna de código sin alterar su comportamiento funcional.
- `test:` Inclusión o ajuste de pruebas de validación.
- `chore:` Tareas de mantenimiento, dependencias o configuración del build de Vite.

*Ejemplo:*
```bash
git commit -m "feat: integrar compilador de expedientes pdf en modulo de facturas"
```

---

## 💻 Estándares de Arquitectura y Código

### 1. Estructura de Componentes React 18

- Ubica cada componente en su carpeta modular dentro de `src/components/`:
  - `biometrics/`: Modales de login/enrolamiento facial y pantalla de verificación.
  - `chatbot/`: Asistente virtual impulsado por IA.
  - `clientes/`: Directorio CRM, modales y validación RF-15.
  - `cobros/`: Registro de cobros, tabla y cálculo de días.
  - `common/`: Modales reutilizables, Toast flotante, selectores de fecha personalizados.
  - `dashboard/`: Analítica gráfica de alto contraste, tarjetas de KPIs y distribución de stock.
  - `facturas/`: Bóveda documental, captura fotográfica y exportación PDF multipágina.
  - `layout/`: Barra lateral (`Sidebar`), barra superior (`Topbar`) y centro de notificaciones (`NotificationsCenter`).
  - `pagos/`: Cuentas por cobrar, modales de abono y semaforización.
  - `pedidos/`: Registro y edición de pedidos con descuento de existencias.
  - `prestamos/`: Préstamos a terceros, intereses y liquidación al 100%.
  - `productos/`: Catálogo visual, modal ampliado de 820px y cámara WebRTC.
- Mantén el estado global en los Providers de `src/context/` y centraliza las llamadas a backend en `src/services/api.js`.

### 2. Glosario de Funciones y Nomenclatura Oficial

| Función / Hook | Archivo | Propósito |
|---|---|---|
| `api.getDashboardMetrics()` | `src/services/api.js` | Recupera métricas y datos en vivo desde Supabase Cloud. |
| `useClients()` | `src/context/ClientContext.jsx` | Provee el listado de clientes, alta, actualización y verificación RF-15. |
| `useProducts()` | `src/context/ProductContext.jsx` | Gestiona el catálogo de productos, inventario y ajuste de stock. |
| `useOrders()` | `src/context/OrderContext.jsx` | Administra la creación, edición (`updatePedido`) y cancelación de pedidos. |
| `useNotifications()` | `src/context/NotificationContext.jsx` | Controla pestañas ("Pendientes" / "Historial") y eliminación de alertas. |
| `exportarExpedienteClientePDF(...)` | `src/services/pdfExportService.js` | Compila comprobantes digitales en expedientes PDF multipágina con `jspdf`. |
| `showToast({ tipo, mensaje })` | `src/components/common/Toast.jsx` | Dispara notificaciones flotantes inferiores de éxito o error. |

---

## ✅ Protocolo de Verificación antes de Enviar PR

Antes de solicitar una revisión o fusionar tu código a la rama principal, ejecuta obligatoriamente:

1. **Validación de Linter y Sintaxis**:
   ```bash
   npm run lint
   ```
2. **Validación de Compilación de Producción**:
   ```bash
   npm run build
   ```
   *El comando debe finalizar con **Exit code: 0** y 0 errores de compilación.*
3. **Verificación Visual y Funcional**:
   - Comprueba que la aplicación responda con total fluidez en resoluciones móviles, tablets y monitores de escritorio.
   - Verifica que los modales se abran centrados, con desenfoque de fondo y cierren inmediatamente tras guardar.
   - Confirma que la gráfica del Dashboard compute los clientes acumulados de forma reactiva.
   - Asegura que no se emita ningún sonido de notificación al cargar o interactuar con el Login.

---

## 📬 Proceso de Pull Request (PR)

1. Crea un fork o clona el repositorio oficial.
2. Crea tu rama de trabajo desde `main`.
3. Realiza tus cambios y confirma tus commits siguiendo los estándares establecidos.
4. Envía tu Pull Request describiendo claramente los cambios realizados, las pruebas de verificación y capturas si existen modificaciones visuales.

¡Gracias por contribuir a la excelencia, seguridad y diseño de **ME Variedades**!
