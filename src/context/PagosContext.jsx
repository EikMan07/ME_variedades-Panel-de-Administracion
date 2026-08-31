import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const PagosContext = createContext(null);

/**
 * Calcula el semaforo de estado de un pago segun su saldo y fecha acordada.
 * Verde: saldo = 0 (pagado), Ambar: fecha futura con saldo > 0, Rojo: fecha pasada.
 */
export function calcularEstadoPago(pago) {
  const saldo = Number(pago.saldo_pendiente) || 0;
  if (saldo <= 0) return 'pagado';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (!pago.fecha_acordada) return 'pendiente';

  const fechaAcordada = new Date(pago.fecha_acordada + 'T00:00:00');
  if (fechaAcordada < hoy) return 'vencido';

  const diffMs = fechaAcordada - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias <= 3) return 'proximo';

  return 'pendiente';
}

function validarPago(datos) {
  const errores = {};
  if (!datos.cliente_id) errores.cliente_id = 'Debe seleccionar un cliente.';
  const monto = Number(datos.monto_total);
  if (!datos.monto_total && datos.monto_total !== 0) {
    errores.monto_total = 'El monto total es obligatorio.';
  } else if (isNaN(monto) || monto <= 0) {
    errores.monto_total = 'El valor debe ser mayor a 0.';
  }
  if (!datos.concepto || !datos.concepto.trim()) {
    errores.concepto = 'El concepto o descripcion es obligatorio.';
  }
  return errores;
}

export function PagosProvider({ children }) {
  const [pagos, setPagos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde Supabase
  const cargarPagos = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getPagos();
      setPagos(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_pagos_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar pagos desde Supabase:', err);
      try {
        const guardados = localStorage.getItem('me_pagos_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setPagos(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);

  const agregarPago = useCallback(async (datos) => {
    const errores = validarPago(datos);
    if (Object.keys(errores).length > 0) return { success: false, errores };

    try {
      const nuevoRemoto = await api.createPago(datos);
      setPagos(prev => [nuevoRemoto, ...prev]);
      return { success: true, pago: nuevoRemoto };
    } catch (err) {
      console.warn('Error al guardar pago en Supabase, guardando localmente:', err);
      const maxId = pagos.length > 0 ? Math.max(...pagos.map(p => Number(p.id) || 0)) : 0;
      const montoTotal = Number(datos.monto_total);
      const nuevoLocal = {
        id: maxId + 1,
        cliente_id: datos.cliente_id,
        cliente_nombre: datos.cliente_nombre,
        cliente_telefono: datos.cliente_telefono || '',
        concepto: (datos.concepto || '').trim(),
        pedido_asociado: datos.pedido_asociado || '',
        monto_total: montoTotal,
        abonos: [],
        saldo_pendiente: montoTotal,
        fecha_acordada: datos.fecha_acordada || '',
        fecha_registro: new Date().toISOString().split('T')[0],
      };
      setPagos(prev => [nuevoLocal, ...prev]);
      return { success: true, pago: nuevoLocal };
    }
  }, [pagos]);

  const registrarAbono = useCallback(async (pagoId, montoAbono, nota = '') => {
    const pago = pagos.find(p => p.id === pagoId);
    if (!pago) return { success: false, error: 'Pago no encontrado.' };
    const monto = Number(montoAbono);
    if (!monto || monto <= 0) return { success: false, error: 'El monto del abono debe ser mayor a 0.' };
    if (monto > pago.saldo_pendiente) return { success: false, error: 'El abono no puede superar el saldo pendiente.' };

    try {
      await api.registrarAbono(pagoId, monto, nota);
    } catch (err) {
      console.warn('Error al registrar abono en Supabase, aplicando localmente:', err);
    }

    const nuevoAbono = { id: (pago.abonos?.length || 0) + 1, monto, nota: nota.trim(), fecha: new Date().toISOString().split('T')[0] };
    setPagos(prev => prev.map(p => {
      if (p.id !== pagoId) return p;
      const nuevosAbonos = [...(p.abonos || []), nuevoAbono];
      const totalAbonado = nuevosAbonos.reduce((sum, a) => sum + Number(a.monto), 0);
      return { ...p, abonos: nuevosAbonos, saldo_pendiente: Math.max(0, p.monto_total - totalAbonado) };
    }));
    return { success: true };
  }, [pagos]);

  const editarPago = useCallback((id, datos) => {
    const errores = validarPago(datos);
    if (Object.keys(errores).length > 0) return { success: false, errores };
    const montoTotal = Number(datos.monto_total);
    setPagos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const totalAbonado = (p.abonos || []).reduce((sum, a) => sum + Number(a.monto), 0);
      return {
        ...p,
        cliente_id: datos.cliente_id,
        cliente_nombre: datos.cliente_nombre,
        cliente_telefono: datos.cliente_telefono || '',
        concepto: (datos.concepto || '').trim(),
        pedido_asociado: datos.pedido_asociado || '',
        monto_total: montoTotal,
        saldo_pendiente: Math.max(0, montoTotal - totalAbonado),
        fecha_acordada: datos.fecha_acordada || '',
      };
    }));
    return { success: true };
  }, []);

  const eliminarPago = useCallback((id) => {
    const pago = pagos.find(p => p.id === id);
    if (!pago) return { success: false, error: 'Pago no encontrado.' };
    setPagos(prev => prev.filter(p => p.id !== id));
    return { success: true };
  }, [pagos]);

  const filtrarPagos = useCallback((lista, { busqueda = '', filtroEstado = 'todos' }) => {
    const q = busqueda.toLowerCase().trim();
    return lista.filter(p => {
      const coincideBusqueda = !q || (p.cliente_nombre || '').toLowerCase().includes(q) || (p.concepto || '').toLowerCase().includes(q) || String(p.id).includes(q);
      const estado = calcularEstadoPago(p);
      const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, []);

  const calcularKPIs = useCallback(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    let totalPorCobrar = 0, cantidadVencidos = 0, cantidadAlDia = 0, totalRecaudadoMes = 0;
    pagos.forEach(p => {
      const estado = calcularEstadoPago(p);
      totalPorCobrar += Number(p.saldo_pendiente) || 0;
      if (estado === 'vencido') cantidadVencidos++;
      else if (estado === 'pagado') cantidadAlDia++;
      (p.abonos || []).forEach(a => {
        const fa = new Date(a.fecha + 'T00:00:00');
        if (fa.getMonth() === mesActual && fa.getFullYear() === anioActual) totalRecaudadoMes += Number(a.monto) || 0;
      });
    });
    return { totalPorCobrar, cantidadVencidos, cantidadAlDia, totalRecaudadoMes };
  }, [pagos]);

  return (
    <PagosContext.Provider value={{ pagos, isLoading, cargarPagos, agregarPago, registrarAbono, editarPago, eliminarPago, filtrarPagos, calcularKPIs, calcularEstadoPago }}>
      {children}
    </PagosContext.Provider>
  );
}

export function usePagos() {
  const context = useContext(PagosContext);
  if (!context) throw new Error('usePagos debe usarse dentro de un PagosProvider');
  return context;
}

