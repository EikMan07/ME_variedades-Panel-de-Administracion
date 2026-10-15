import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { supabase, verificarEstadoConexionSupabase } from '../services/supabase';
import { useClients } from './ClientContext';

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
  const { clientes = [] } = useClients?.() || {};

  const [metrics, setMetrics] = useState(() => ({
    ...initialMetrics,
    totalClientes: Array.isArray(clientes) ? clientes.length : 0,
    listaClientes: Array.isArray(clientes) ? clientes : []
  }));

  const [isLoading, setIsLoading] = useState(true);
  const [conexion, setConexion] = useState({
    conectada: false,
    faltanVariables: false,
    error: null,
    totalClientes: Array.isArray(clientes) ? clientes.length : 0,
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
        totalClientes: Math.max(Number(estado?.totalClientes) || 0, clientes?.length || 0),
        verificando: false
      });
      return estado;
    } catch (err) {
      const errObj = {
        conectada: false,
        faltanVariables: false,
        error: err.message || 'Error de red con Supabase',
        totalClientes: clientes?.length || 0,
        verificando: false
      };
      setConexion(errObj);
      return errObj;
    }
  }, [clientes]);

  // Carga de métricas en vivo desde Supabase con resiliencia cruzada
  const cargarMetricas = useCallback(async () => {
    try {
      setIsLoading(true);
      const [estadoConexion, datos] = await Promise.allSettled([
        verificarConexion(),
        api.getDashboardMetrics()
      ]);

      if (datos.status === 'fulfilled' && datos.value) {
        const val = datos.value;
        const total = (val.totalClientes && val.totalClientes > 0)
          ? val.totalClientes
          : (clientes && clientes.length > 0 ? clientes.length : 0);
        const lista = (val.listaClientes && val.listaClientes.length > 0)
          ? val.listaClientes
          : (clientes || []);

        setMetrics({
          ...val,
          totalClientes: total,
          listaClientes: lista
        });
      } else if (datos.status === 'rejected') {
        console.error('❌ Error al cargar métricas del Dashboard:', datos.reason);
        if (clientes && clientes.length > 0) {
          setMetrics(prev => ({
            ...prev,
            totalClientes: clientes.length,
            listaClientes: clientes
          }));
        }
      }
    } catch (err) {
      console.error('❌ Error general al cargar métricas del Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [verificarConexion, clientes]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // Sincronización reactiva inmediata cuando ClientContext actualiza sus datos
  useEffect(() => {
    if (Array.isArray(clientes) && clientes.length > 0) {
      setMetrics(prev => {
        const nuevoTotal = Math.max(Number(prev.totalClientes) || 0, clientes.length);
        const nuevaLista = (prev.listaClientes && prev.listaClientes.length > 0) ? prev.listaClientes : clientes;
        const mesActual = new Date().getMonth() + 1;
        const cumpleaneros = (prev.cumpleanerosDelMes && prev.cumpleanerosDelMes.length > 0)
          ? prev.cumpleanerosDelMes
          : nuevaLista.filter(c => Number(c.mes_cumpleanos || c.mes_cumple) === mesActual);

        return {
          ...prev,
          totalClientes: nuevoTotal,
          listaClientes: nuevaLista,
          cumpleanerosDelMes: cumpleaneros
        };
      });
    }
  }, [clientes]);

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
