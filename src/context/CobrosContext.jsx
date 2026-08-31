import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useClients } from './ClientContext';
import { api } from '../services/api';

const CobrosContext = createContext(null);

/**
 * Calcula los días transcurridos desde una fecha (YYYY-MM-DD) hasta hoy.
 * @param {string} fechaStr
 * @returns {number} Número de días transcurridos (>= 0)
 */
export function calcularDiasDesdeFecha(fechaStr) {
  if (!fechaStr) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  const diffMs = hoy - fecha;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDias);
}

function validarCobro(datos) {
  const errores = {};
  if (!datos.cliente_id) {
    errores.cliente_id = 'Debe seleccionar un cliente del directorio.';
  }

  const monto = Number(datos.monto_cobrado);
  if (!datos.monto_cobrado && datos.monto_cobrado !== 0) {
    errores.monto_cobrado = 'El monto cobrado es obligatorio.';
  } else if (isNaN(monto) || monto <= 0) {
    errores.monto_cobrado = 'El valor debe ser mayor a 0.';
  }

  if (!datos.fecha_cobro || !datos.fecha_cobro.trim()) {
    errores.fecha_cobro = 'La fecha del cobro es obligatoria.';
  }

  if (!datos.concepto_nota && !datos.concepto) {
    errores.concepto_nota = 'El concepto o detalle del cobro es obligatorio.';
  }

  return errores;
}

export function CobrosProvider({ children }) {
  const { clientes } = useClients();

  const [cobros, setCobros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde Supabase
  const cargarCobros = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getCobros();
      setCobros(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_cobros_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar cobros desde Supabase:', err);
      try {
        const guardados = localStorage.getItem('me_cobros_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setCobros(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarCobros();
  }, [cargarCobros]);

  /**
   * RF-23: Registrar un nuevo cobro individual.
   */
  const agregarCobro = useCallback(async (datos) => {
    const errores = validarCobro(datos);
    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    try {
      const nuevoRemoto = await api.registrarCobro(datos);
      setCobros(prev => [nuevoRemoto, ...prev]);
      return { success: true, cobro: nuevoRemoto };
    } catch (err) {
      console.warn('Error al registrar cobro en Supabase, guardando localmente:', err);
      const maxId = cobros.length > 0 ? Math.max(...cobros.map(c => Number(c.id) || 0)) : 0;
      const montoCobrado = Number(datos.monto_cobrado);

      const nuevoLocal = {
        id: maxId + 1,
        cliente_id: Number(datos.cliente_id),
        cliente_nombre: (datos.cliente_nombre || '').trim(),
        cliente_telefono: (datos.cliente_telefono || '').trim(),
        monto_cobrado: montoCobrado,
        fecha_cobro: datos.fecha_cobro || new Date().toISOString().split('T')[0],
        metodo_cobro: datos.metodo_cobro || 'Efectivo',
        numero_recibo: (datos.numero_recibo || '').trim(),
        concepto_nota: (datos.concepto_nota || datos.concepto || '').trim(),
        fecha_registro: new Date().toISOString(),
      };

      setCobros(prev => [nuevoLocal, ...prev]);
      return { success: true, cobro: nuevoLocal };
    }
  }, [cobros]);

  /**
   * RF-25: Editar un cobro existente.
   */
  const editarCobro = useCallback((id, datos) => {
    const errores = validarCobro(datos);
    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    const montoCobrado = Number(datos.monto_cobrado);

    setCobros(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        cliente_id: Number(datos.cliente_id),
        cliente_nombre: (datos.cliente_nombre || '').trim(),
        cliente_telefono: (datos.cliente_telefono || '').trim(),
        monto_cobrado: montoCobrado,
        fecha_cobro: datos.fecha_cobro || c.fecha_cobro,
        metodo_cobro: datos.metodo_cobro || c.metodo_cobro,
        numero_recibo: (datos.numero_recibo || '').trim(),
        concepto_nota: (datos.concepto_nota || '').trim(),
      };
    }));

    return { success: true };
  }, []);

  /**
   * RF-25: Eliminar un registro de cobro.
   */
  const eliminarCobro = useCallback((id) => {
    const cobro = cobros.find(c => c.id === id);
    if (!cobro) return { success: false, error: 'Cobro no encontrado.' };
    setCobros(prev => prev.filter(c => c.id !== id));
    return { success: true };
  }, [cobros]);

  /**
   * Obtiene el historial de cobros de un cliente específico, ordenado por fecha descendente.
   */
  const obtenerHistorialCliente = useCallback((clienteId) => {
    if (!clienteId) return [];
    return cobros
      .filter(c => Number(c.cliente_id) === Number(clienteId))
      .sort((a, b) => new Date(b.fecha_cobro) - new Date(a.fecha_cobro));
  }, [cobros]);

  /**
   * Obtiene el último cobro registrado para un cliente.
   */
  const obtenerUltimoCobroCliente = useCallback((clienteId) => {
    const historial = obtenerHistorialCliente(clienteId);
    return historial.length > 0 ? historial[0] : null;
  }, [obtenerHistorialCliente]);

  /**
   * RF-24: KPIs globales del módulo de cobros.
   */
  const calcularKPIsCobros = useCallback(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let cobrosHoyCount = 0;
    let montoCobradoHoy = 0;
    let totalRecaudado = 0;
    const diasArray = [];

    // Calcular cobros de hoy y total recaudado
    cobros.forEach(c => {
      const monto = Number(c.monto_cobrado) || 0;
      totalRecaudado += monto;

      if (c.fecha_cobro === hoyStr) {
        cobrosHoyCount++;
        montoCobradoHoy += monto;
      }

      const dias = calcularDiasDesdeFecha(c.fecha_cobro);
      diasArray.push(dias);
    });

    // Promedio de días desde cobros registrados
    const promedioDias = diasArray.length > 0
      ? Math.round(diasArray.reduce((sum, d) => sum + d, 0) / diasArray.length)
      : 0;

    // Clientes con cobro pendiente o atrasado:
    // Clientes registrados cuyo último cobro tiene >= 8 días o nunca se les ha cobrado si tienen saldo
    let clientesAtencionCount = 0;
    clientes.forEach(cliente => {
      const ultimoCobro = cobros
        .filter(c => Number(c.cliente_id) === Number(cliente.id))
        .sort((a, b) => new Date(b.fecha_cobro) - new Date(a.fecha_cobro))[0];

      if (ultimoCobro) {
        const dias = calcularDiasDesdeFecha(ultimoCobro.fecha_cobro);
        if (dias >= 8) {
          clientesAtencionCount++;
        }
      } else if (cliente.saldo_pendiente && Number(cliente.saldo_pendiente) > 0) {
        // Tiene saldo pendiente y no registra cobros
        clientesAtencionCount++;
      }
    });

    return {
      cobrosHoyCount,
      montoCobradoHoy,
      clientesAtencionCount,
      promedioDias,
      totalRecaudado,
      totalCobrosCount: cobros.length
    };
  }, [cobros, clientes]);

  /**
   * Filtrar cobros por búsqueda de texto, periodo de fecha y método.
   */
  const filtrarCobros = useCallback((lista, { busqueda = '', filtroPeriodo = 'todos', filtroMetodo = 'todos', filtroAntiguedad = 'todos' }) => {
    const q = busqueda.toLowerCase().trim();
    const hoyStr = new Date().toISOString().split('T')[0];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return lista.filter(c => {
      // Coincidencia de búsqueda
      const coincideBusqueda =
        !q ||
        (c.cliente_nombre || '').toLowerCase().includes(q) ||
        (c.cliente_telefono || '').includes(q) ||
        (c.concepto_nota || '').toLowerCase().includes(q) ||
        (c.numero_recibo || '').toLowerCase().includes(q) ||
        (c.metodo_cobro || '').toLowerCase().includes(q) ||
        String(c.id).includes(q);

      // Filtro de periodo
      let coincidePeriodo = true;
      if (filtroPeriodo === 'hoy') {
        coincidePeriodo = c.fecha_cobro === hoyStr;
      } else if (filtroPeriodo === 'semana') {
        const dias = calcularDiasDesdeFecha(c.fecha_cobro);
        coincidePeriodo = dias <= 7;
      } else if (filtroPeriodo === 'mes') {
        const dias = calcularDiasDesdeFecha(c.fecha_cobro);
        coincidePeriodo = dias <= 30;
      }

      // Filtro de método de cobro
      const coincideMetodo =
        filtroMetodo === 'todos' ||
        (c.metodo_cobro || '').toLowerCase() === filtroMetodo.toLowerCase();

      // Filtro de antigüedad / semáforo
      let coincideAntiguedad = true;
      if (filtroAntiguedad !== 'todos') {
        const dias = calcularDiasDesdeFecha(c.fecha_cobro);
        if (filtroAntiguedad === 'recientes') coincideAntiguedad = dias <= 3;
        else if (filtroAntiguedad === 'moderados') coincideAntiguedad = dias >= 4 && dias <= 7;
        else if (filtroAntiguedad === 'atencion') coincideAntiguedad = dias >= 8;
      }

      return coincideBusqueda && coincidePeriodo && coincideMetodo && coincideAntiguedad;
    });
  }, []);

  return (
    <CobrosContext.Provider
      value={{
        cobros,
        agregarCobro,
        editarCobro,
        eliminarCobro,
        obtenerHistorialCliente,
        obtenerUltimoCobroCliente,
        calcularKPIsCobros,
        filtrarCobros,
        calcularDiasDesdeFecha,
      }}
    >
      {children}
    </CobrosContext.Provider>
  );
}

export function useCobros() {
  const context = useContext(CobrosContext);
  if (!context) {
    throw new Error('useCobros debe usarse dentro de un CobrosProvider');
  }
  return context;
}
