import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useClients } from './ClientContext';
import { useProducts } from './ProductContext';
import { usePagos } from './PagosContext';
import { usePrestamos } from './PrestamosContext';
import { useVentas } from './VentasContext';
import { generarNotificaciones } from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { clientes = [] } = useClients() || {};
  const { productos = [] } = useProducts() || {};
  const { pagos = [] } = usePagos() || {};
  const { prestamos = [] } = usePrestamos() || {};
  const { ventas = [] } = useVentas?.() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState('pendientes'); // 'pendientes' | 'historial'

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
      } catch {}
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

  // Generar alertas reactivas basadas en datos reales consolidados (incluyendo ventas y cobros)
  const rawNotificaciones = useMemo(() => {
    return generarNotificaciones({
      clientes,
      productos,
      pagos,
      prestamos,
      pedidos: ventas,
    });
  }, [clientes, productos, pagos, prestamos, ventas]);

  // Filtrar descartadas / eliminadas
  const notificacionesValidas = useMemo(() => {
    return rawNotificaciones.filter((n) => !eliminadas.includes(n.id));
  }, [rawNotificaciones, eliminadas]);

  // Listas separadas: Pendientes vs Historial
  const listaPendientes = useMemo(() => {
    return notificacionesValidas.filter((n) => !leidas.includes(n.id));
  }, [notificacionesValidas, leidas]);

  const listaHistorial = useMemo(() => {
    return notificacionesValidas.filter((n) => leidas.includes(n.id));
  }, [notificacionesValidas, leidas]);

  // Reproducir sonido suave campanita-dos-tonos.wav con manejo seguro de autoplay
  const reproducirSonidoSuave = useCallback(() => {
    if (!sonidoHabilitado) return;
    try {
      const audio = new Audio('/sounds/campanita-dos-tonos.wav');
      audio.volume = 0.4;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay prevenido por el navegador: registrar listener de primer clic
          const reintentarAlClic = () => {
            try {
              const retryAudio = new Audio('/sounds/campanita-dos-tonos.wav');
              retryAudio.volume = 0.4;
              retryAudio.play().catch(() => {});
            } catch {}
          };
          window.addEventListener('click', reintentarAlClic, { once: true });
          window.addEventListener('keydown', reintentarAlClic, { once: true });
        });
      }
    } catch {
      // Ignorar errores en entornos sin audio
    }
  }, [sonidoHabilitado]);

  // Detección reactiva: emitir sonido SOLO si aparece una notificación NUEVA de cobro en 'hoy' o 'atrasado'
  useEffect(() => {
    const cobrosUrgentes = listaPendientes.filter(
      (n) => n.vencimiento === 'hoy' || n.vencimiento === 'atrasado' || n.tipo === 'cobro_hoy' || n.tipo === 'cobro_atrasado'
    );

    const noSonadas = cobrosUrgentes.filter((n) => !sonadas.includes(n.id));

    if (noSonadas.length > 0) {
      // Registrar IDs para no sonar de nuevo en futuras recargas
      const nuevosIds = noSonadas.map((n) => n.id);
      const actualizadas = Array.from(new Set([...sonadas, ...nuevosIds]));
      setSonadas(actualizadas);
      try {
        localStorage.setItem('me_notif_sonadas', JSON.stringify(actualizadas));
      } catch {}

      // Emitir campanita
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

  // Marcar una como leída
  const marcarComoLeida = useCallback((id) => {
    setLeidas((prev) => {
      if (prev.includes(id)) return prev;
      const actualizadas = [...prev, id];
      try {
        localStorage.setItem('me_notif_leidas', JSON.stringify(actualizadas));
      } catch {}
      return actualizadas;
    });
  }, []);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(() => {
    const todosIds = notificacionesValidas.map((n) => n.id);
    setLeidas((prev) => {
      const actualizadas = Array.from(new Set([...prev, ...todosIds]));
      try {
        localStorage.setItem('me_notif_leidas', JSON.stringify(actualizadas));
      } catch {}
      return actualizadas;
    });
  }, [notificacionesValidas]);

  // Eliminar una notificación del historial
  const eliminarNotificacion = useCallback((id) => {
    setEliminadas((prev) => {
      if (prev.includes(id)) return prev;
      const actualizadas = [...prev, id];
      try {
        localStorage.setItem('me_notif_eliminadas', JSON.stringify(actualizadas));
      } catch {}
      return actualizadas;
    });
  }, []);

  // Vaciar todo el historial
  const vaciarHistorial = useCallback(() => {
    const idsABorrar = listaHistorial.map((n) => n.id);
    setEliminadas((prev) => {
      const actualizadas = Array.from(new Set([...prev, ...idsABorrar]));
      try {
        localStorage.setItem('me_notif_eliminadas', JSON.stringify(actualizadas));
      } catch {}
      return actualizadas;
    });
  }, [listaHistorial]);

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
    };
  }
  return context;
}
