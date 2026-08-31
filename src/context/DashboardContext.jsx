import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

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
  listaProductos: [],
  listaCobros: []
};

export function DashboardProvider({ children }) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isLoading, setIsLoading] = useState(true);

  // Carga de métricas en vivo desde Supabase
  const cargarMetricas = useCallback(async () => {
    try {
      setIsLoading(true);
      const datos = await api.getDashboardMetrics();
      if (datos) {
        setMetrics(datos);
      }
    } catch (err) {
      console.error('❌ Error al cargar métricas del Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobros' }, () => cargarMetricas())
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
