# AGENT.md - Memoria del Agente (Referencia Principal)

## 1. Contexto

Actúas como el desarrollador líder de "Proyecto María", la plataforma web de administración para **ME Variedades**, una empresa comercial dedicada a la venta de mercancía variada — indumentaria, calzado, accesorios, perfumería, maquillaje y aparatos electrónicos — que además realiza préstamos de dinero a terceros. El negocio se administra hoy a mano, en hojas físicas, lo que complica ordenar y consultar los datos de clientes, productos, pagos y préstamos. El sistema es administrado por **María**, y debe digitalizar esa operación en una plataforma web responsiva (celular, tablet y PC), con login personalizado, dashboard central y un diseño moderno, "aesthetic" y futurista.

### Actores y roles del sistema
- **Administradora (María) — acceso total.** Agrega, edita y elimina clientes, productos y el contenido de cada módulo (pagos, cobros, pedidos, préstamos); ve el dashboard completo y el historial.

### Módulos del sistema (alcance v1.0)
Login · Dashboard (con KPIs y avisos de cumpleaños) · Clientes · Pagos y Cuentas por Cobrar · Cobros · Productos e Inventario · Pedidos · Préstamos · Asistente Virtual (chatbot con IA).

### Arquitectura de datos
El Backend/API REST fungirá como la fuente de verdad de los datos, limitando el uso de `localStorage` exclusivamente a caché temporal. Los datos de clientes, productos, pagos, cobros, pedidos y préstamos deben mantenerse guardados de forma permanente en una base de datos o almacenamiento persistente.

---

## 2. Requerimientos

### Funcionales — Gestión de Productos
- Tipos de producto disponibles: perfume, camisa, short, pantalón, accesorio, zapato, crocs, maquillaje, vestido y aparato electrónico (RF-27).
- Si el tipo seleccionado **no** es maquillaje, se debe pedir especificar si es de hombre o de mujer; esta opción se omite exclusivamente para maquillaje (RF-28).
- Al agregar o editar un producto, se debe permitir tomar una foto con la cámara del dispositivo o elegir una imagen ya guardada en galería (RF-29).
- El módulo debe mostrar el stock disponible por tipo de producto y contar con buscador por tipo (RF-30, RF-31).
- Al eliminar un producto, se debe restar automáticamente la unidad correspondiente del stock de ese tipo de producto (RF-33).

### Funcionales — Gestión de Pedidos
- Al crear un pedido se busca al cliente, se elige uno o varios productos del inventario disponible, y el stock del producto elegido se descuenta al confirmar (RF-34 a RF-37).

### Funcionales — Gestión de Préstamos
- Al registrar un préstamo se indica la persona, el monto, la tasa de interés y el plazo/fecha límite; el sistema calcula el monto total a devolver (capital + interés) y lista los préstamos activos con su estado: al día, próximo a vencer o atrasado; se pueden registrar abonos que actualicen el saldo pendiente (RF-39 a RF-43).

### Funcionales — Eliminación de Clientes
- No se debe permitir eliminar un cliente si tiene relación activa con la empresa (pedidos, pagos pendientes o préstamos abiertos a su nombre); el botón de eliminar debe deshabilitarse o mostrar un aviso explicando el motivo (RF-15).
- Un cliente sin actividad pendiente sí puede eliminarse, previa confirmación.

### No funcionales
- **RNF-07 (autorización):** toda operación de edición/eliminación debe validarse en el servidor según el rol, no solo ocultarse en la interfaz.

### Estado inicial limpio (Zero Mock Data — parte funcional)
1. **Inicio en Estado Limpio:** Los módulos de datos operativos (**Clientes**, **Pedidos**, **Pagos y Cuentas por Cobrar**, **Préstamos**) deben iniciar **100% vacíos** (`[]`) por defecto.
2. **Estados Vacíos Amigables (Empty States):** Cuando una tabla o módulo no tenga datos registrados, debe mostrar un contenedor visual atractivo con íconos SVG y un botón de acción principal (ej. *"Directorio de Clientes Listo — Aún no hay clientes registrados. Pulsa el botón para ingresar el primer contacto de ME Variedades"*).
3. **KPIs Iniciales Coherentes:** Si no hay datos registrados, los contadores del Dashboard deben mostrar:
   - **Total Clientes:** `0`
   - **Pedidos Activos:** `0` *(Badge: "Sin pedidos pendientes")*
   - **Cuentas por Cobrar:** `₡0` *(Badge: "Al día / Sin cobros pendientes")*
   - **Préstamos Activos:** `₡0` *(Badge: "Sin préstamos abiertos")*
   - **Cumpleaños del Mes:** *"No hay clientes registrados que cumplan años este mes"*

### Validación campo por campo (formato verificable)
Todo campo obligatorio vacío debe mostrar un error al intentar guardar, resaltando el campo afectado (borde rojo), y el error debe desaparecer automáticamente al corregir el dato.
- **Nombre completo (Cliente):** `String`. Debe validarse contra caracteres no permitidos. Error exacto: *"El nombre no debe contener números ni símbolos especiales"*.
- **Teléfono (Cliente):** `String` numérico. Formato numérico de 8 dígitos (`8888-8888` o `88888888`). Error exacto: *"El teléfono debe contener un número válido de 8 dígitos"*.
- **Cumpleaños (Cliente):** `Number` (Día) y `Number` (Mes). El selector de día no debe permitir un número inválido para el mes seleccionado (`poblarDias(mes)`). Error exacto: *"Día inválido para el mes seleccionado"*.
- **Costo (Producto) / Monto (Préstamo):** `Number`. Mayor a cero. Error: *"El valor debe ser mayor a 0"*.
- **Tipo de Producto / Género:** `Enum`. Obligatorio. Error: *"Debe seleccionar una opción válida"*. Para maquillaje, el campo género no debe ser requerido ni visible (RF-28).

### Estados, transiciones y semaforización (formato verificable)
El sistema reutiliza tarjetas de estado semaforizado (verde/ámbar/rojo) en varios módulos:
- **Préstamos:**
  - **Al día (Verde #6E8F6B):** Fecha límite mayor a la fecha actual por más de X días.
  - **Próximo a vencer (Ámbar #C9A24B):** Fecha límite muy cercana a la fecha actual (ej. 3 días).
  - **Atrasado (Rojo #B23A48):** Fecha límite anterior a la fecha actual con saldo pendiente > 0.
- **Pagos (Cuentas por Cobrar):**
  - **Al día / Sin cobros (Verde #6E8F6B):** Sin deudas pendientes.
  - **Pendiente (Ámbar #C9A24B):** Saldo adeudado > 0 y fecha de pago acordada >= fecha actual.
  - **Vencido (Rojo #B23A48):** Señalado visualmente en color cuando la fecha de pago acordada < fecha actual y saldo > 0.
- **Productos (Stock):**
  - **Disponible (Verde #6E8F6B):** Stock >= 5 unidades.
  - **Stock Bajo (Ámbar #C9A24B):** Stock entre 1 y 4 unidades.
  - **Sin Stock / Agotado (Rojo #B23A48):** Inventario en 0.

### Casos límite (edge cases) explícitos
- **Días inválidos en meses (ej. Febrero):** El selector dinámico `poblarDias(mes)` no permite días superiores a 29 en febrero, ni 31 en meses de 30 días.
- **Producto sin stock al pedir:** Si el stock de un producto es 0, no debe aparecer como seleccionable al crear un pedido, o debe mostrar error: *"Stock insuficiente para este producto"*.
- **Abono mayor al saldo pendiente:** Si se ingresa un abono superior al saldo del préstamo, el sistema debe bloquear la transacción y avisar *"El abono no puede superar el saldo pendiente"*.
- **Clientes homónimos:** El sistema debe permitir dos clientes con el mismo nombre y diferenciarlos por su ID interno o teléfono.
- **Fallo del Asistente Virtual (Chatbot):** Si el servicio de IA no responde (sin conexión o error de API), no debe quedarse cargando; debe mostrar el mensaje de error amigable: *"El servicio de IA no está disponible en este momento"*.

### Modelo de datos relacional
Esquema conceptual extraído del SRS:

| Entidad | Campos Principales | Tipo de Dato | Obligatorio | Notas y Relaciones |
|---|---|---|---|---|
| **Usuario** | `id`, `username`, `password_hash`, `rol` | Num, Str, Str, Enum | Sí | Roles: Administradora, Colaborador. |
| **Cliente** | `id`, `nombre_completo`, `mes_cumple`, `dia_cumple`, `telefono` | Num, Str, Num, Num, Str | Sí | Relación (1:N) con Pedidos, Pagos, Cobros, Préstamos. |
| **Producto** | `id`, `imagen_url`, `nombre`, `tipo`, `genero`, `costo`, `stock` | Num, Str, Str, Enum, Enum, Num, Num | Sí (`genero` no en maquillaje) | Tipos: perfume, camisa, short, maquillaje, etc. (RF-27). |
| **Pedido** | `id`, `cliente_id`, `producto_id`, `cantidad`, `costo_total` | Num, FK, FK, Num, Num | Sí | Relación (N:1) con Cliente y Producto. *(supone cantidad > 1)*. |
| **Pago** | `id`, `cliente_id`, `fecha_acordada`, `monto_adeudado`, `saldo_pendiente` | Num, FK, Date, Num, Num | Sí | Calcula pagos realizados y saldo. |
| **Cobro** | `id`, `cliente_id`, `fecha_cobro`, `monto_cobrado` | Num, FK, Date, Num | Sí | Calcula días transcurridos desde último cobro. |
| **Préstamo** | `id`, `cliente_id` (o nombre), `monto`, `tasa_interes`, `fecha_entrega`, `fecha_limite`, `saldo_pendiente` | Num, FK/Str, Num, Num, Date, Date, Num | Sí | Calcula monto total a devolver (capital + interés). |

### Endpoints de API esperados (REST)
La arquitectura de datos requiere que toda la lógica de negocio resida en el Backend/API REST.

| Módulo | Método HTTP | Ruta Sugerida | Propósito | Rol Permitido |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Validar credenciales y generar sesión/token | Todos |
| **Dashboard** | `GET` | `/api/dashboard/kpis` | Obtener totales (clientes, pagos, préstamos, stock) y cumpleaños | Todos |
| **Clientes** | `GET` / `POST` | `/api/clientes` | Listar clientes (con buscador por nombre) / Crear cliente | Todos |
| **Clientes** | `PUT` / `DELETE` | `/api/clientes/:id` | Editar cliente / Eliminar cliente (valida dependencias) | Administradora |
| **Productos** | `GET` / `POST` | `/api/productos` | Listar productos (con buscador por tipo) / Crear producto | Todos |
| **Productos** | `PUT` / `DELETE` | `/api/productos/:id` | Editar producto / Eliminar producto (resta stock) | Administradora |
| *(Otros)* | `CRUD` | `/api/pedidos`, `/api/pagos`, `/api/prestamos`, `/api/cobros` | Operaciones estándar para el resto de módulos | Admin (completo) / Colab (registro) |
| **Chatbot** | `POST` | `/api/chatbot/ask` | Enviar prompt a la IA de forma segura desde el backend | Todos |

### Cálculos derivados que deben recalcularse desde el backend (no confiar en el frontend)
Saldo pendiente por cliente (pagos), días transcurridos/restantes desde la última fecha de cobro (cobros), monto total a devolver de un préstamo (capital + interés) y estado del préstamo (al día / próximo a vencer / atrasado).

### Criterios de verificación (Protocolo de Verificación Profunda)
Cada vez que se implemente una nueva funcionalidad o módulo, se deben ejecutar obligatoriamente las siguientes pruebas antes de dar el trabajo por completado:
1. **Validación de campos:** guardar campos obligatorios vacíos y verificar el resaltado rojo con mensaje de error; probar valores inválidos (letras en teléfonos, números en nombres, costos <= 0) y constatar que el mensaje coincida exactamente con la regla; verificar que los mensajes desaparezcan dinámicamente al corregir el campo.
2. **Interfaz y compatibilidad visual:** abrir todos los modales y verificar que la tarjeta oscura flote correctamente con desenfoque de fondo; inspeccionar menús desplegables y campos de texto para confirmar que no existan fondos blancos nativos; verificar adaptabilidad en pantallas móviles y computadoras.
3. **Reglas de negocio específicas:** probar reglas condicionales (ej. campo de género oculto en maquillaje RF-28); probar bloqueo de eliminación si existen dependencias activas (RF-15) y el recálculo automático de stock (RF-33).
4. **Sincronización y persistencia:** validar que al crear, editar o eliminar un registro, los datos se sincronicen de inmediato con el Dashboard y el almacenamiento persistente (`localStorage` / API).
5. **Estado limpio / sin datos falsos:** confirmar que si no hay datos ingresados por María, se muestren los *Empty States* y contadores en cero sin arrojar errores `NaN` o `undefined`.

### Flujos end-to-end de ejemplo (pruebas mínimas)
- **Flujo de Integridad de Datos (Cliente/Pedido):**
  1. *Dado* que inicio sesión como Administradora,
  2. *Cuando* creo un cliente válido ("Juan Pérez") y luego le registro un pedido seleccionando 1 "Perfume X" (stock original: 10),
  3. *Entonces* el sistema descuenta 1 unidad (stock final: 9),
  4. *Y Cuando* intento eliminar al cliente "Juan Pérez",
  5. *Entonces* el sistema me bloquea y muestra un aviso indicando que el cliente tiene actividad pendiente (pedido activo).
- **Flujo de Asistente Virtual:**
  1. *Dado* que estoy en la pantalla de Productos,
  2. *Cuando* abro el botón flotante del chatbot y escribo "¿Cómo agrego un perfume?",
  3. *Entonces* el chatbot responde en español indicando los pasos.

---

## 3. Reglas

### Seguridad
- Las contraseñas deben almacenarse cifradas.
- Las rutas del dashboard deben requerir sesión activa.
- La API Key del asistente virtual de IA debe resguardarse en el backend y nunca exponerse en el frontend en texto plano — el `chatbot.js` debe llamar siempre al endpoint propio del backend, nunca directo al proveedor de IA.
- El script `login.js` debe tolerar servidores estáticos (respuestas 404/405 de Live Server) y permitir el acceso de la Administradora con las credenciales oficiales (`maria_admin` / `admin123` o `maria` / `admin`).
- La sesión se almacena en `sessionStorage.setItem('usuario_activo', ...)` y se valida con `checkAuth()`.

### Confirmaciones y mensajes de bloqueo
- Toda eliminación (cliente, producto, pago, pedido, préstamo) requiere confirmación previa del usuario.
- Toda acción de edición o eliminación bloqueada por una regla de negocio debe mostrar un mensaje explicando por qué no se puede realizar.

### Organización de código (JS)
- Utilizar módulos ES6 (`import`/`export`) para mantener cada módulo funcional aislado y evitar variables globales.
- Centralizar las peticiones HTTP (`fetch`) en un archivo único (`api.js`).

### Glosario de nombres y variables reutilizables
Para asegurar la consistencia entre archivos JS, la IA de código debe emplear textualmente los nombres de variables y funciones ya definidos en la especificación:
- `poblarDias(mes)`: Función que actualiza dinámicamente el selector de días según el mes.
- `validarCliente(datos)`: Validación de los campos de entrada antes de realizar el envío (submit).
- `puedeEliminarse(cliente)`: Lógica que valida las relaciones activas del cliente antes de habilitar el botón de borrar.
- `checkAuth()`: Función invocada en el dashboard y módulos para validar que exista una sesión activa.
- `api.login(usuario, clave)`: Función dentro del módulo centralizado de peticiones (api.js) para manejar el login.
- `chatbot.js`: Módulo que envía solicitudes al endpoint propio del backend.

---

## 4. Restricciones

### Antipatrones técnicos prohibidos
Para garantizar la estabilidad absoluta del sistema y evitar errores de ejecución, interfaz o navegación:

1. **Integridad de sintaxis y edición de archivos:** prohibido dejar llaves huérfanas (`}`), bloques de control duplicados (`finally`, `catch`) o funciones sin cerrar que bloqueen la ejecución de JavaScript. Todo archivo JavaScript debe verificarse sintácticamente antes de entregarse.
2. **Control de formularios:** todo `<form>` debe implementar obligatoriamente `e.preventDefault()` en la primera línea de su manejador `submit`. Los botones interactivos dentro de tarjetas o modales que no envían un formulario deben declararse explícitamente con `type="button"`.
3. **Arquitectura de capas CSS (stacking context & canvas):** fondos animados con `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;`; contenedores de contenido con `position: relative; z-index: 1;`. Prohibido asignar fondos opacos a etiquetas intermedias que tapen los fondos animados.
4. **Compatibilidad estricta de propiedades CSS (linters):** en propiedades como `line-clamp`, declarar tanto la propiedad estándar `line-clamp: N;` como el prefijo `-webkit-line-clamp: N;` junto con `display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;`.

### Restricciones visuales obligatorias
- **Dark glassmorphism sin cuadros blancos:** todos los controles de formulario (`<input>`, `<select>`, `<textarea>`) deben tener estilos oscuros explícitos (`background: #181818`, borde `rgba(255,255,255,0.12)`, texto `#F7F3F0`, foco en oro rosa `#9A6E79` y `<option>` oscuro `#1a1a1a`). Ningún formulario, modal o menú desplegable debe mostrar controles blancos nativos del navegador sin estilizar. Las barras de desplazamiento deben configurarse en modo oscuro con tonos oro rosa en todas las páginas.
- **Prohibición de símbolos matemáticos crudos en textos de interfaz:** prohibido usar `≥`, `≤`, `>`, `<` en textos de cara al usuario, menús desplegables o botones. Usar siempre redacción clara en español natural: *"Disponible (5 o más unidades)"*, *"Stock bajo (menos de 5 unidades)"*, *"Agotados (sin existencias)"*.
- **Prohibición total de emojis:** 0% emojis en interfaz, validaciones, badges de estado, tablas y respuestas del Asistente Virtual. Exclusivamente íconos vectoriales SVG profesionales (Lucide / Heroicons) con trazo estilizado de `2px`.

### Prohibición de datos falsos o ficticios (Zero Mock Data Policy)
Queda terminantemente prohibido inyectar nombres ficticios de clientes, órdenes inventadas o deudas simuladas en el código base o almacenamiento. La información debe ser exclusivamente la que María registre en el sistema. (Ver el comportamiento esperado de estado limpio y empty states en la sección 2. Requerimientos.)

---

## 5. Objetivos

- Reducir a 0% el extravío de datos físicos de clientes, productos, pagos y préstamos.
- Disminuir el tiempo de búsqueda de información de un cliente de varios minutos a menos de 10 segundos.
- Detectar automáticamente el 100% de los cumpleaños de clientes para gestionar gratificaciones oportunamente.
- Eliminar los errores de digitación en altas mediante validación inmediata de cada campo.
- Que el 100% de las dudas frecuentes de uso puedan resolverse sin soporte externo, usando el chatbot con IA.

---

## 6. Memoria del Proyecto

### Decisiones de arquitectura
- **Fuente de verdad:** el Backend/API REST es la fuente de verdad de los datos; `localStorage` se limita exclusivamente a caché temporal.
- **Persistencia:** los datos de clientes, productos, pagos, cobros, pedidos y préstamos se guardan de forma permanente en base de datos, no en el cliente.
- **Cálculos sensibles en backend:** los cálculos derivados (saldo pendiente, días desde último cobro, monto total a devolver de un préstamo, estado del préstamo) se recalculan siempre en el backend para evitar manipulación o desincronización desde el frontend.

### Historial de incidentes y correcciones
_Aún no hay incidentes registrados. Cada vez que se corrija un error de código (por tests, error de runtime o revisión humana), documentar aquí: qué pasó, la causa raíz, y la regla preventiva añadida a la sección 3 (Reglas) o 4 (Restricciones)._

---

## 7. Buenas Prácticas

### UI/UX
- Diseño "mobile-first" responsivo con paleta oficial de marca: negro carbón `#0D0D0D`, acentos en oro rosa `#9A6E79` y dorado `#D4AF37`.
- Tipografía moderna con jerarquía clara entre títulos (`Playfair Display`) y datos (`Poppins`/`Montserrat`).
- Micro-animaciones en botones, tarjetas y transiciones; paneles con efecto "dark glassmorphism" (transparencia con desenfoque).
- Tarjetas con bordes redondeados y sombras suaves.
- Elementos táctiles (botones, íconos de editar/eliminar) con tamaño mínimo cómodo para el dedo en pantallas táctiles.
- Incluir la etiqueta `<meta name="viewport" content="width=device-width, initial-scale=1">` en todas las páginas.

### Iconografía
- Utilizar exclusivamente íconos profesionales, modernos y minimalistas en formato SVG (Lucide Icons / Heroicons) para toda representación gráfica.

### Responsividad
- Implementar CSS Grid (`repeat(auto-fit, minmax(220px, 1fr))`) para responsividad automática en dashboards.
- Reutilizar componentes visuales (tablas, tarjetas de estado semaforizado verde/ámbar/rojo) entre los módulos de Pagos, Cobros, Productos, Pedidos y Préstamos.

### Interacciones web y móvil
- Usar atributos como `capture="environment"` en el input file para la toma directa de fotos en el alta de productos desde dispositivos móviles.
- Utilizar animaciones como `@keyframes shake` para retroalimentación visual de errores en login y formularios.
