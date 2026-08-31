import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

const FacturasContext = createContext(null);

function validarFactura(datos) {
  const errores = {};

  if (!datos.cliente_id) {
    errores.cliente_id = 'Debe seleccionar un cliente del directorio.';
  }

  if (!datos.tipo_categoria) {
    errores.tipo_categoria = 'Debe seleccionar el tipo o categoría de comprobante.';
  }

  if (!datos.fecha_emision || !datos.fecha_emision.trim()) {
    errores.fecha_emision = 'La fecha de emisión o recepción es obligatoria.';
  }

  if (!datos.archivo_data) {
    errores.archivo_data = 'Debe adjuntar un archivo (foto o documento PDF).';
  }

  return errores;
}

export function FacturasProvider({ children }) {
  const [facturas, setFacturas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial y sincronización desde Supabase (única fuente de verdad)
  const cargarFacturas = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getFacturas();
      setFacturas(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_facturas_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar facturas desde Supabase:', err);
      try {
        const guardados = localStorage.getItem('me_facturas_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setFacturas(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  // Sincronización en tiempo real con Supabase
  useEffect(() => {
    const channel = supabase
      .channel('facturas_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facturas_comprobantes' },
        (payload) => {
          console.log('⚡ Cambio en tiempo real en facturas_comprobantes:', payload.eventType);
          cargarFacturas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarFacturas]);

  /**
   * Agregar nueva factura o comprobante (con subida a Supabase Storage).
   */
  const agregarFactura = useCallback(async (datos) => {
    const errores = validarFactura(datos);
    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    try {
      const nuevaRemota = await api.uploadFactura(datos.archivo_data, datos);
      setFacturas(prev => [nuevaRemota, ...prev.filter(f => f.id !== nuevaRemota.id)]);
      return { success: true, factura: nuevaRemota };
    } catch (err) {
      console.error('❌ Error al guardar comprobante en Supabase:', err);
      return { success: false, error: err.message || 'Error al guardar comprobante en Supabase.' };
    }
  }, []);

  /**
   * Eliminar físicamente una factura o comprobante de la BD y Storage.
   */
  const eliminarFactura = useCallback(async (id, archivoUrl) => {
    const factura = facturas.find(f => Number(f.id) === Number(id));
    const urlAEliminar = archivoUrl || factura?.archivo_url || factura?.archivo_data || '';

    try {
      await api.deleteFactura(id, urlAEliminar);
      setFacturas(prev => prev.filter(f => Number(f.id) !== Number(id)));
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar comprobante en Supabase:', err);
      return { success: false, error: err.message || 'Error al eliminar comprobante en Supabase.' };
    }
  }, [facturas]);

  /**
   * KPIs generales de facturas y comprobantes.
   */
  const calcularKPIsFacturas = useCallback(() => {
    let totalFacturas = facturas.length;
    let facturasPedidos = 0;
    let facturasPagosCobros = 0;
    let facturasPrestamos = 0;

    facturas.forEach(f => {
      if (f.tipo_categoria === 'pedidos') {
        facturasPedidos++;
      } else if (f.tipo_categoria === 'pagos' || f.tipo_categoria === 'cobros') {
        facturasPagosCobros++;
      } else if (f.tipo_categoria === 'prestamos') {
        facturasPrestamos++;
      }
    });

    return {
      totalFacturas,
      facturasPedidos,
      facturasPagosCobros,
      facturasPrestamos,
    };
  }, [facturas]);

  /**
   * Filtrar facturas por texto, pestaña de categoría y fecha.
   */
  const filtrarFacturas = useCallback((lista, { busqueda = '', filtroCategoria = 'todas', filtroFecha = 'todas' }) => {
    const q = busqueda.toLowerCase().trim();
    const hoyStr = new Date().toISOString().split('T')[0];

    return lista.filter(f => {
      // Coincidencia de texto
      const coincideBusqueda =
        !q ||
        (f.cliente_nombre || '').toLowerCase().includes(q) ||
        (f.cliente_telefono || '').includes(q) ||
        (f.referencia_id || '').toLowerCase().includes(q) ||
        (f.archivo_nombre || '').toLowerCase().includes(q) ||
        (f.notas || '').toLowerCase().includes(q) ||
        String(f.id).includes(q);

      // Pestaña de categoría
      let coincideCategoria = true;
      if (filtroCategoria !== 'todas') {
        if (
          filtroCategoria === 'cobros' ||
          filtroCategoria === 'pagos' ||
          filtroCategoria === 'pagos_cuentas' ||
          filtroCategoria === 'pagos_cobros'
        ) {
          coincideCategoria = f.tipo_categoria === 'pagos' || f.tipo_categoria === 'cobros';
        } else {
          coincideCategoria = f.tipo_categoria === filtroCategoria;
        }
      }

      // Filtro de fecha
      let coincideFecha = true;
      if (filtroFecha === 'hoy') {
        coincideFecha = f.fecha_emision === hoyStr;
      } else if (filtroFecha === 'mes') {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        coincideFecha = (f.fecha_emision || '').startsWith(`${y}-${m}`);
      }

      return coincideBusqueda && coincideCategoria && coincideFecha;
    });
  }, []);

  return (
    <FacturasContext.Provider
      value={{
        facturas,
        agregarFactura,
        eliminarFactura,
        calcularKPIsFacturas,
        filtrarFacturas,
      }}
    >
      {children}
    </FacturasContext.Provider>
  );
}

export function useFacturas() {
  const context = useContext(FacturasContext);
  if (!context) {
    throw new Error('useFacturas debe usarse dentro de un FacturasProvider');
  }
  return context;
}
