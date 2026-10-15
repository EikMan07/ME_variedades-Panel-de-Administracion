# Supabase Edge Functions y Alertas WhatsApp — ME Variedades

Esta carpeta documenta la arquitectura de mensajería y automatizaciones de backend para **ME Variedades**:

## 1. Sistema de Alertas Automáticas a WhatsApp (CallMeBot API)

El sistema de notificaciones está integrado tanto en la base de datos (PostgreSQL con `pg_net` y `pg_cron`) como en las funciones de servidor (Vercel Serverless `/api/whatsapp-notify`).

### Pasos de Activación de CallMeBot (100% Gratuito):
1. **Registrar número:** En WhatsApp, agrega el número del bot: `+34 644 10 55 84`.
2. **Solicitar clave:** Envía el siguiente mensaje exacto por WhatsApp al bot:
   ```text
   I allow callmebot to send me messages
   ```
3. **Respuesta:** En pocos segundos recibirás un mensaje con tu **API Key personal**.
4. **Configuración de Variables de Entorno (Vercel / .env):**
   ```env
   WHATSAPP_ADMIN_PHONE=50688888888
   CALLMEBOT_API_KEY=tu_api_key_recibida
   ```
5. **Configuración en Base de Datos (`public.app_config`):**
   Puedes actualizar la tabla `app_config` en Supabase SQL Editor para que los triggers y el cron job usen tus credenciales:
   ```sql
   UPDATE public.app_config SET valor = '50688888888' WHERE clave = 'whatsapp_admin_phone';
   UPDATE public.app_config SET valor = 'tu_api_key_recibida' WHERE clave = 'callmebot_api_key';
   ```

---

## 2. Eventos Automatizados con Triggers y Cron

- **Stock Crítico (`tr_alerta_stock_producto`):** Se dispara automáticamente si un producto tiene 3 o menos unidades (o 0 unidades).
- **Nueva Venta (`tr_alerta_nueva_venta`):** Se dispara al insertar un pedido en `public.pedidos`, enviando el detalle al admin.
- **Nuevo Pago / Abono (`tr_alerta_nuevo_pago`):** Se dispara cuando un cliente realiza un abono en `public.pagos`.
- **Cumpleaños Diarios (`verificar_cumpleanos_diarios`):** Programado con `pg_cron` todos los días a las 8:00 AM hora de Costa Rica (`14:00 UTC`), notificando al administrador con un enlace directo `wa.me` para felicitar al cliente con un toque.

---

## 3. Diferencia Arquitectónica

- **`supabase/functions/` y Triggers (`pg_net`):** Automatizaciones a nivel de base de datos que se ejecutan incluso si el panel administrativo web está cerrado.
- **`api/whatsapp-notify.js`:** Vercel Serverless Function que permite al panel administrativo frontend disparar alertas manuales o de prueba con un solo clic.
