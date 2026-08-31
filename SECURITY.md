# Política de Seguridad — ME Variedades (Versión 4.2)

La seguridad, la integridad de los datos financieros y la privacidad de los clientes de **ME Variedades (Proyecto María)** constituyen una prioridad fundamental en la arquitectura de la plataforma.

---

## 🔐 Medidas de Seguridad Implementadas

### 1. Autenticación Híbrida y Biometría Facial Segura
- **Protección de Rutas**: Todas las vistas del Dashboard y módulos administrativos están protegidas mediante el componente `ProtectedRoute` y el contexto `AuthContext`.
- **Enrolamiento Biométrico Controlado**: El registro de nuevos rostros (`FaceEnrollModal`) exige obligatoriamente la validación previa de credenciales de Administrador para evitar registros no autorizados.
- **Procesamiento Biométrico Local en Cliente**: La detección y comparación de descriptores faciales mediante **Face-API.js** (`TinyFaceDetector`, `FaceLandmark68Net`) se ejecuta 100% en la memoria del navegador local utilizando WebGL y HTML5 Canvas; los vectores biométricos nunca se transmiten en texto claro a servidores externos no autorizados.
- **Sanitización de Interfaz**: Se eliminaron placeholders o mensajes de error que expongan credenciales administrativas en el formulario de acceso público.
- **Pantalla de Verificación de Seguridad**: Todo inicio de sesión válido pasa por una pausa de escáner y verificación autorizada (`<AuthVerifyingScreen />`) antes de conceder acceso a la sesión.

### 2. Seguridad en la Nube y Base de Datos (Supabase)
- **Cifrado en Tránsito y Reposo**: Todas las comunicaciones entre la aplicación cliente y la base de datos PostgreSQL de Supabase se transmiten exclusivamente mediante **TLS 1.3** con cifrado SSL.
- **Políticas de Acceso (Row Level Security - RLS)**: Tablas maestras (`clientes`, `productos`, `pedidos`, `pagos`, `cobros`, `prestamos`, `facturas_comprobantes`) protegidas por políticas RLS que restringen la lectura, escritura y eliminación únicamente a usuarios autenticados.
- **Storage Protegido y Compresión Previa**: Las fotos de productos y comprobantes de pago subidos a Supabase Storage pasan por compresión obligatoria en el cliente (`imageCompression.js`), mitigando riesgos de denegación de servicio por saturación de almacenamiento y limitando el tamaño a formatos permitidos (JPG/PNG/WEBP/PDF).

### 3. Procesamiento Local de Documentos y OCR
- **Privacidad en Reconocimiento Óptico (OCR)**: El escaneo de comprobantes bancarios y transferencias SINPE Móvil mediante `receiptOcrService.js` se procesa localmente en el navegador a través de Web Workers aislados, evitando el envío de imágenes bancarias a APIs de terceros no confiables.

### 4. Cabeceras de Seguridad y Configuración CDN (`vercel.json`)
- La plataforma implementa cabeceras HTTP de endurecimiento:
  - `X-Content-Type-Options: nosniff`: Prevención de ataques MIME-sniffing.
  - `X-Frame-Options: DENY`: Protección absoluta contra ataques de Clickjacking.
  - `X-XSS-Protection: 1; mode=block`: Mitigación de Cross-Site Scripting.
  - `Cache-Control: public, max-age=31536000, immutable` para recursos estáticos versionados.

### 5. Manejo de Secretos y Claves de API
- Las variables de entorno sensibles (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`) deben mantenerse en archivos locales `.env` o `.env.local` excluidos del control de versiones (`.gitignore`).

### 6. Sanitización, Validación y Reglas de Integridad
- **Validación Inmediata de Entradas**: Todos los formularios validan tipos de datos, patrones de nombres (solo caracteres alfabéticos y espacios) y longitud exacta de teléfonos (8 dígitos) antes de cualquier llamada a `api.js`.
- **Integridad Referencial RF-15**: El backend y el frontend bloquean estrictamente la eliminación de cualquier cliente que mantenga pedidos en curso, saldos pendientes en cuentas por cobrar o préstamos abiertos a su nombre.

---

## 🛡️ Reporte Responsable de Vulnerabilidades

Si identificas alguna vulnerabilidad de seguridad o potencial riesgo en esta plataforma:
1. Notifícala de forma confidencial al equipo de desarrollo antes de divulgarla públicamente.
2. Proporciona una descripción detallada del vector de ataque y los pasos para reproducir el escenario.
3. El equipo de desarrollo responderá e implementará las correcciones necesarias a la brevedad posible.
