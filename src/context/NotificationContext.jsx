import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useClients } from './ClientContext';
import { useProducts } from './ProductContext';
import { usePagos } from './PagosContext';
import { usePrestamos } from './PrestamosContext';
import { useVentas } from './VentasContext';
import { supabase } from '../services/supabase';
import {
  generarNotificaciones,
  obtenerNotificacionesRemotas,
  marcarNotificacionLeidaRemota,
  marcarTodasLeidasRemotas,
  eliminarNotificacionRemota,
  vaciarHistorialRemoto,
  enviarAlertaWhatsAppAdmin,
} from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { clientes = [] } = useClients() || {};
  const { productos = [] } = useProducts() || {};
  const { pagos = [] } = usePagos() || {};
  const { prestamos = [] } = usePrestamos() || {};
  const { ventas = [] } = useVentas?.() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState('pendientes'); // 'pendientes' | 'historial'
  const [notificacionesRemotas, setNotificacionesRemotas] = useState([]);
  const [cargandoRemotas, setCargandoRemotas] = useState(true);
  const [probandoWhatsApp, setProbandoWhatsApp] = useState(false);

  // Preferencia de sonido guardada en localStorage (activo por defecto)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    try {
      const guardado = localStorage.getItem('me_sonido_notificaciones_habilitado');
      return guardado !== null ? guardado === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleSonido = useCallback(() => {
    setSonidoHabilitado((prev) => {
      const nuevo = !prev;
      try {
        localStorage.setItem('me_sonido_notificaciones_habilitado', String(nuevo));
      } catch { /* ignore */ }
      return nuevo;
    });
  }, []);

  // IDs de notificaciones para las cuales ya se reprodujo el sonido (evita sonar repetidamente en recargas)
  const [sonadas, setSonadas] = useState(() => {
    try {
      const saved = localStorage.getItem('me_notif_sonadas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [leidas, setLeidas] = useState(() => {
    try {
      const saved = localStorage.getItem('me_notif_leidas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [eliminadas, setEliminadas] = useState(() => {
    try {
      const saved = localStorage.getItem('me_notif_eliminadas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reproducir sonido suave campanita-dos-tonos.wav con manejo seguro de autoplay
  const reproducirSonidoSuave = useCallback(() => {
    if (!sonidoHabilitado) return;
    try {
      const audio = new Audio('/sounds/campanita-dos-tonos.wav');
      audio.volume = 0.4;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const reintentarAlClic = () => {
            try {
              const retryAudio = new Audio('/sounds/campanita-dos-tonos.wav');
              retryAudio.volume = 0.4;
              retryAudio.play().catch(() => {});
            } catch { /* ignore */ }
          };
          window.addEventListener('click', reintentarAlClic, { once: true });
          window.addEventListener('keydown', reintentarAlClic, { once: true });
        });
      }
    } catch { /* ignore */ }
  }, [sonidoHabilitado]);

  // Carga inicial y suscripción Realtime a Supabase
  useEffect(() => {
    let isMounted = true;

    async function cargarInicial() {
      try {
        const remotas = await obtenerNotificacionesRemotas();
        if (isMounted) {
          setNotificacionesRemotas(remotas);
          setCargandoRemotas(false);
        }
      } catch (err) {
        console.warn('Error cargando notificaciones remotas iniciales:', err);
        if (isMounted) setCargandoRemotas(false);
      }
    }

    cargarInicial();

    // Suscripción Realtime en el canal 'notificaciones-realtime-channel'
    const channel = supabase
      .channel('notificaciones-realtime-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const n = payload.new;
          if (!n) return;
          const nuevoItem = {
            id: `remote-${n.id}`,
            dbId: n.id,
            tipo: n.tipo,
            titulo: n.titulo,
            mensaje: n.mensaje,
            leida: Boolean(n.leida),
            metadata: n.metadata || {},
            created_at: n.created_at,
            linkWhatsApp: n.metadata?.link_whatsapp,
            telefono: n.metadata?.telefono,
            clienteNombre: n.metadata?.cliente_nombre,
            prioridad: n.tipo === 'stock_agotado' ? 'critica' : (n.tipo === 'stock_bajo' ? 'alta' : 'media'),
            etiqueta: n.tipo === 'cumpleanos' ? 'Cumpleaños' : (n.tipo === 'venta' ? 'Venta' : (n.tipo === 'pago' ? 'Abono' : 'Sistema')),
            accion: n.metadata?.link_whatsapp ? 'whatsapp' : (n.tipo === 'stock_bajo' ? 'inventario' : 'general'),
            link: n.tipo.startsWith('stock') ? '/productos' : (n.tipo === 'venta' ? '/ventas' : (n.tipo === 'pago' ? '/pagos' : '/clientes')),
          };

          setNotificacionesRemotas((prev) => [nuevoItem, ...prev.filter((x) => x.dbId !== n.id)]);
          reproducirSonidoSuave();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const n = payload.new;
          if (!n) return;
          setNotificacionesRemotas((prev) =>
            prev.map((x) => (x.dbId === n.id ? { ...x, leida: Boolean(n.leida) } : x))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notificaciones' },
        (payload) => {
          const old = payload.old;
          if (!old) return;
          setNotificacionesRemotas((prev) => prev.filter((x) => x.dbId !== old.id));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [reproducirSonidoSuave]);

  // Consolidación de notificaciones persistentes de Supabase y cálculos dinámicos locales
  const rawNotificaciones = useMemo(() => {
    const locales = generarNotificaciones({
      clientes,
      productos,
      pagos,
      prestamos,
      pedidos: ventas,
    });

    const combinadas = [...notificacionesRemotas];

    locales.forEach((loc) => {
      const existe = combinadas.some(
        (c) => c.id === loc.id || (loc.tipo === 'cumpleanos' && c.tipo === 'cumpleanos' && String(c.metadata?.cliente_id) === String(loc.id.replace('cumple-', '')))
      );
      if (!existe) {
        combinadas.push(loc);
      }
    });

    return combinadas;
  }, [clientes, productos, pagos, prestamos, ventas, notificacionesRemotas]);

  // Filtrar descartadas / eliminadas
  const notificacionesValidas = useMemo(() => {
    return rawNotificaciones.filter((n) => !eliminadas.includes(n.id) && !eliminadas.includes(String(n.dbId)));
  }, [rawNotificaciones, eliminadas]);

  // Listas separadas: Pendientes vs Historial
  const listaPendientes = useMemo(() => {
    return notificacionesValidas.filter((n) => !n.leida && !leidas.includes(n.id) && !leidas.includes(String(n.dbId)));
  }, [notificacionesValidas, leidas]);

  const listaHistorial = useMemo(() => {
    return notificacionesValidas.filter((n) => n.leida || leidas.includes(n.id) || leidas.includes(String(n.dbId)));
  }, [notificacionesValidas, leidas]);

  // Detección reactiva para emitir sonido en notificaciones urgentes
  useEffect(() => {
    const urgentes = listaPendientes.filter(
      (n) => n.prioridad === 'alta' || n.prioridad === 'critica' || n.tipo === 'cumpleanos' || n.tipo === 'venta' || n.tipo === 'pago'
    );

    const noSonadas = urgentes.filter((n) => !sonadas.includes(n.id));

    if (noSonadas.length > 0) {
      const nuevosIds = noSonadas.map((n) => n.id);
      const actualizadas = Array.from(new Set([...sonadas, ...nuevosIds]));
      setSonadas(actualizadas);
      try {
        localStorage.setItem('me_notif_sonadas', JSON.stringify(actualizadas));
      } catch { /* ignore */ }

      reproducirSonidoSuave();
    }
  }, [listaPendientes, sonadas, reproducirSonidoSuave]);

  const unreadCount = listaPendientes.length;

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Marcar una como leída (en memoria y en Supabase si es remota)
  const marcarComoLeida = useCallback((id) => {
    const item = notificacionesValidas.find((n) => n.id === id);
    if (item?.dbId) {
      marcarNotificacionLeidaRemota(item.dbId);
    }

    setLeidas((prev) => {
      if (prev.includes(id)) return prev;
      const actualizadas = [...prev, id];
      if (item?.dbId) actualizadas.push(String(item.dbId));
      try {
        localStorage.setItem('me_notif_leidas', JSON.stringify(actualizadas));
      } catch { /* ignore */ }
      return actualizadas;
    });

    setNotificacionesRemotas((prev) =>
      prev.map((x) => (x.id === id || x.dbId === item?.dbId ? { ...x, leida: true } : x))
    );
  }, [notificacionesValidas]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(() => {
    marcarTodasLeidasRemotas();

    const todosIds = notificacionesValidas.map((n) => n.id);
    const todosDbIds = notificacionesValidas.filter((n) => n.dbId).map((n) => String(n.dbId));

    setLeidas((prev) => {
      const actualizadas = Array.from(new Set([...prev, ...todosIds, ...todosDbIds]));
      try {
        localStorage.setItem('me_notif_leidas', JSON.stringify(actualizadas));
      } catch { /* ignore */ }
      return actualizadas;
    });

    setNotificacionesRemotas((prev) => prev.map((x) => ({ ...x, leida: true })));
  }, [notificacionesValidas]);

  // Eliminar una notificación
  const eliminarNotificacion = useCallback((id) => {
    const item = notificacionesValidas.find((n) => n.id === id);
    if (item?.dbId) {
      eliminarNotificacionRemota(item.dbId);
    }

    setEliminadas((prev) => {
      if (prev.includes(id)) return prev;
      const actualizadas = [...prev, id];
      if (item?.dbId) actualizadas.push(String(item.dbId));
      try {
        localStorage.setItem('me_notif_eliminadas', JSON.stringify(actualizadas));
      } catch { /* ignore */ }
      return actualizadas;
    });

    setNotificacionesRemotas((prev) => prev.filter((x) => x.id !== id && x.dbId !== item?.dbId));
  }, [notificacionesValidas]);

  // Vaciar todo el historial
  const vaciarHistorial = useCallback(() => {
    vaciarHistorialRemoto();

    const idsABorrar = listaHistorial.map((n) => n.id);
    const dbIdsABorrar = listaHistorial.filter((n) => n.dbId).map((n) => String(n.dbId));

    setEliminadas((prev) => {
      const actualizadas = Array.from(new Set([...prev, ...idsABorrar, ...dbIdsABorrar]));
      try {
        localStorage.setItem('me_notif_eliminadas', JSON.stringify(actualizadas));
      } catch { /* ignore */ }
      return actualizadas;
    });

    setNotificacionesRemotas((prev) => prev.filter((x) => !x.leida));
  }, [listaHistorial]);

  // Disparar prueba de WhatsApp hacia el teléfono del administrador
  const probarAlertaWhatsApp = useCallback(async () => {
    try {
      setProbandoWhatsApp(true);
      const res = await enviarAlertaWhatsAppAdmin({
        titulo: 'Prueba de Conexión del Panel',
        mensaje: '¡Hola! La conexión en tiempo real entre el Panel Administrativo ME Variedades y tu WhatsApp está 100% activa y funcionando.',
        tipo: 'prueba',
      });
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message };
    } finally {
      setProbandoWhatsApp(false);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        listaPendientes,
        listaHistorial,
        unreadCount,
        isOpen,
        tabActiva,
        setTabActiva,
        toggleDropdown,
        closeDropdown,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion,
        vaciarHistorial,
        sonidoHabilitado,
        toggleSonido,
        reproducirSonidoSuave,
        cargandoRemotas,
        probandoWhatsApp,
        probarAlertaWhatsApp,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      listaPendientes: [],
      listaHistorial: [],
      unreadCount: 0,
      isOpen: false,
      tabActiva: 'pendientes',
      setTabActiva: () => {},
      toggleDropdown: () => {},
      closeDropdown: () => {},
      marcarComoLeida: () => {},
      marcarTodasComoLeidas: () => {},
      eliminarNotificacion: () => {},
      vaciarHistorial: () => {},
      sonidoHabilitado: true,
      toggleSonido: () => {},
      reproducirSonidoSuave: () => {},
      cargandoRemotas: false,
      probandoWhatsApp: false,
      probarAlertaWhatsApp: async () => ({ ok: false, error: 'No context' }),
    };
  }
  return context;
}
