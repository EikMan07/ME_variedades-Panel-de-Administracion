import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useClients } from './ClientContext';
import { useProducts } from './ProductContext';
import { usePagos } from './PagosContext';
import { usePrestamos } from './PrestamosContext';
import { generarNotificaciones } from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { clientes = [] } = useClients() || {};
  const { productos = [] } = useProducts() || {};
  const { pagos = [] } = usePagos() || {};
  const { prestamos = [] } = usePrestamos() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [tabActiva, setTabActiva] = useState('pendientes'); // 'pendientes' | 'historial'

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

  // Generar alertas reactivas basadas en datos reales
  const rawNotificaciones = useMemo(() => {
    return generarNotificaciones({
      clientes,
      productos,
      pagos,
      prestamos,
    });
  }, [clientes, productos, pagos, prestamos]);

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
    };
  }
  return context;
}
