import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { supabase, verificarEstadoConexionSupabase } from '../services/supabase';

const DashboardContext = createContext(null);

const initialMetrics = {
  totalClientes: 0,
  pedidosActivos: 0,
  totalPorCobrar: 0,
  prestamosActivos: 0,
  saldoPrestamosPorRecuperar: 0,
  totalStockUnidades: 0,
  valorInventario: 0,
  cumpleanerosDelMes: [],
  listaClientes: [],
  listaPedidos: [],
  listaPagos: [],
  listaPrestamos: [],
  listaProductos: []
};

export function DashboardProvider({ children }) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [conexion, setConexion] = useState({
    conectada: false,
    faltanVariables: false,
    error: null,
    verificando: true
  });

  // Verificación real del estado de conexión con Supabase
  const verificarConexion = useCallback(async () => {
    setConexion(prev => ({ ...prev, verificando: true }));
    try {
      const estado = await verificarEstadoConexionSupabase();
      setConexion({
        conectada: Boolean(estado?.conectada),
        faltanVariables: Boolean(estado?.faltanVariables),
        error: estado?.error || null,
        verificando: false
      });
      return estado;
    } catch (err) {
      const errObj = {
        conectada: false,
        faltanVariables: false,
        error: err.message || 'Error de red con Supabase',
        verificando: false
      };
      setConexion(errObj);
      return errObj;
    }
  }, []);

  // Carga de métricas en vivo desde Supabase
  const cargarMetricas = useCallback(async () => {
    try {
      setIsLoading(true);
      const [estadoConexion, datos] = await Promise.allSettled([
        verificarConexion(),
        api.getDashboardMetrics()
      ]);

      if (datos.status === 'fulfilled' && datos.value) {
        setMetrics(datos.value);
      } else if (datos.status === 'rejected') {
        console.error('❌ Error al cargar métricas del Dashboard:', datos.reason);
      }
    } catch (err) {
      console.error('❌ Error general al cargar métricas del Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [verificarConexion]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // Sincronización en tiempo real con todas las tablas operativas
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime_metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => cargarMetricas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => cargarMetricas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestamos' }, () => cargarMetricas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => cargarMetricas())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => cargarMetricas())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarMetricas]);

  return (
    <DashboardContext.Provider
      value={{
        metrics,
        isLoading,
        conexion,
        verificarConexion,
        recargarMetricas: cargarMetricas
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe usarse dentro de un DashboardProvider');
  }
  return context;
}
