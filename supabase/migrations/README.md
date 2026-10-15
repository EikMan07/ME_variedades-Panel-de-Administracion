# Supabase Migrations — ME Variedades

Esta carpeta almacena las migraciones versionadas y reproducibles para el CLI de Supabase (`supabase db push` / `supabase migration up`).

## Esquema Inicial y Migraciones

1. **Esquema Base**: Documentado y mantenido en `supabase/manual_scripts/supabase_schema.sql` con todas las tablas core (`productos`, `clientes`, `ventas`, `pedidos`, `pagos`, `prestamos`, `tipo_cambio_historial`, `usuarios_sistema`).
2. **Próximas Migraciones (Prioridad 2)**:
   - Registro y cola de notificaciones automáticas (`notificaciones_whatsapp`).
   - Políticas RLS y funciones trigger para detección de vencimientos y cumpleaños.
   - Programación periódica con extensión `pg_cron`.
