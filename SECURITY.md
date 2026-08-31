# Política de Seguridad — ME Variedades (Versión 4.0)

La seguridad, la integridad de los datos financieros y la privacidad de los clientes de **ME Variedades (Proyecto María)** constituyen una prioridad fundamental en la arquitectura de la plataforma.

---

## 🔐 Medidas de Seguridad Implementadas

### 1. Autenticación Híbrida y Biometría Facial Segura
- **Protección de Rutas**: Todas las vistas del Dashboard y módulos administrativos están protegidas mediante el componente `ProtectedRoute` y el contexto `AuthContext`.
- **Procesamiento Biométrico Local en Cliente**: La detección y comparación de descriptores faciales mediante **Face-API.js** (`TinyFaceDetector`, `FaceLandmark68Net`) se ejecuta 100% en la memoria del navegador local utilizando WebGL y HTML5 Canvas; los vectores biométricos nunca se transmiten en texto claro a servidores externos no autorizados.
- **Pantalla de Verificación de Seguridad**: Todo inicio de sesión válido pasa por una pausa de escáner y verificación autorizada (`<AuthVerifyingScreen />`) antes de conceder acceso al token de sesión.

### 2. Seguridad en la Nube y Base de Datos (Supabase)
- **Cifrado en Tránsito y Reposo**: Todas las comunicaciones entre la aplicación cliente y la base de datos PostgreSQL de Supabase se transmiten exclusivamente mediante **TLS 1.3** con cifrado SSL.
- **Políticas de Acceso (Row Level Security - RLS)**: Tablas maestras (`clientes`, `productos`, `pedidos`, `pagos`, `cobros`, `prestamos`, `facturas`) protegidas por políticas RLS que restringen la lectura, escritura y eliminación únicamente a usuarios autenticados.
- **Storage Protegido**: Las fotos de productos y comprobantes de pago subidos a Supabase Storage cuentan con límites de tamaño por archivo (máximo 5 MB) y validación de tipos MIME admitidos (imágenes JPG/PNG/WEBP y documentos PDF).

### 3. Manejo de Secretos y Claves de API
- Las variables de entorno sensibles (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`) deben mantenerse en archivos locales `.env` o `.env.local` excluidos del control de versiones (`.gitignore`).
- Las llamadas a APIs externas de Inteligencia Artificial deben canalizarse sin exponer credenciales críticas en repositorios públicos.

### 4. Sanitización, Validación y Reglas de Integridad
- **Validación Inmediata de Entradas**: Todos los formularios validan tipos de datos, patrones de nombres (solo caracteres alfabéticos y espacios) y longitud exacta de teléfonos (8 dígitos) antes de cualquier llamada a `api.js`.
- **Integridad Referencial RF-15**: El backend y el frontend bloquean estrictamente la eliminación de cualquier cliente que mantenga pedidos en curso, saldos pendientes en cuentas por cobrar o préstamos abiertos a su nombre.

---

## 🛡️ Reporte Responsable de Vulnerabilidades

Si identificas alguna vulnerabilidad de seguridad o potencial riesgo en esta plataforma:
1. Notifícala de forma confidencial al equipo de desarrollo antes de divulgarla públicamente.
2. Proporciona una descripción detallada del vector de ataque y los pasos para reproducir el escenario.
3. El equipo de desarrollo responderá e implementará las correcciones necesarias a la brevedad posible.
