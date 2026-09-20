import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useClients } from './ClientContext';
import { api } from '../services/api';

const PrestamosContext = createContext(null);

/**
 * Calcula el estado de semaforización de un préstamo evaluando la PRÓXIMA cuota pendiente
 * y considerando abonos acumulados (parciales o totales):
 * - Liquidado: saldo <= 0
 * - Atrasado: alguna cuota no cubierta por abonos ya venció (fecha_vencimiento < hoy)
 * - Próximo a vencer: la cuota más próxima a vencer vence en <= 3 días
 * - Al día: todas las cuotas vencidas están cubiertas o faltan más de 3 días para la próxima
 */
export function calcularEstadoPrestamo(prestamo) {
  if (!prestamo) return 'al_dia';
  const saldo = Number(prestamo.saldo_pendiente) || 0;
  if (saldo <= 0) return 'liquidado';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Si cuenta con plan de cuotas acordadas, evaluamos secuencialmente contra los abonos
  if (Array.isArray(prestamo.cuotas) && prestamo.cuotas.length > 0) {
    let saldoAbonosRestante = (prestamo.abonos || []).reduce((sum, a) => sum + (Number(a.monto) || 0), 0);

    for (const c of prestamo.cuotas) {
      const montoCuota = Number(c.montoRealAcordado ?? c.monto ?? c.montoSugerido) || 0;

      // Si el acumulado de abonos cubre esta cuota por completo, avanzamos a la siguiente
      if (saldoAbonosRestante >= montoCuota) {
        saldoAbonosRestante -= montoCuota;
        continue;
      }

      // Esta cuota está parcialmente cubierta o impaga: es la PRÓXIMA cuota pendiente
      const fechaVencStr = c.fechaVencimiento || c.fecha;
      if (!fechaVencStr) continue;

      const fechaVenc = new Date(fechaVencStr + 'T00:00:00');
      if (fechaVenc < hoy) return 'atrasado';

      const diffMs = fechaVenc - hoy;
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDias <= 3) return 'proximo';

      return 'al_dia';
    }
  }

  // Fallback para préstamos antiguos o sin cuotas detalladas (evaluación contra fecha_limite final)
  if (!prestamo.fecha_limite) return 'al_dia';

  const fechaLimite = new Date(prestamo.fecha_limite + 'T00:00:00');
  if (fechaLimite < hoy) return 'atrasado';

  const diffMs = fechaLimite - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDias <= 3) return 'proximo';

  return 'al_dia';
}

function validarPrestamo(datos) {
  const errores = {};

  const nombreLimpio = (datos.beneficiario_nombre || datos.nombre_tercero || '').trim();
  if (!nombreLimpio) {
    errores.beneficiario_nombre = 'El nombre del beneficiario es obligatorio.';
  }

  const telLimpio = (datos.beneficiario_telefono || datos.telefono || '').replace(/[\s-]/g, '');
  if (!telLimpio) {
    errores.beneficiario_telefono = 'El teléfono de contacto es obligatorio.';
  } else if (!/^\d{8}$/.test(telLimpio)) {
    errores.beneficiario_telefono = 'El teléfono debe contener un número válido de 8 dígitos.';
  }

  const capital = Number(datos.monto_capital);
  if (!datos.monto_capital && datos.monto_capital !== 0) {
    errores.monto_capital = 'El capital del préstamo es obligatorio.';
  } else if (isNaN(capital) || capital <= 0) {
    errores.monto_capital = 'El valor debe ser mayor a 0.';
  }

  const tasa = Number(datos.tasa_interes);
  if (datos.tasa_interes === '' || datos.tasa_interes === null || isNaN(tasa) || tasa < 0) {
    errores.tasa_interes = 'La tasa de interés debe ser un porcentaje válido mayor o igual a 0.';
  }

  if (!datos.fecha_entrega || !datos.fecha_entrega.trim()) {
    errores.fecha_entrega = 'La fecha de entrega del préstamo es obligatoria.';
  }

  if (!datos.fecha_limite || !datos.fecha_limite.trim()) {
    if (datos.cuotas && datos.cuotas.length > 0) {
      datos.fecha_limite = datos.cuotas[datos.cuotas.length - 1].fechaVencimiento;
    } else {
      errores.fecha_limite = 'La fecha límite de pago es obligatoria.';
    }
  } else if (datos.fecha_entrega && datos.fecha_limite < datos.fecha_entrega) {
    errores.fecha_limite = 'La fecha límite no puede ser anterior a la fecha de entrega.';
  }

  return errores;
}

export function PrestamosProvider({ children }) {
  const { clientes, actualizarCliente } = useClients();

  const [prestamos, setPrestamos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde Supabase
  const cargarPrestamos = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getPrestamos();
      setPrestamos(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_prestamos_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar préstamos desde Supabase:', err);
      try {
        const guardados = localStorage.getItem('me_prestamos_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setPrestamos(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPrestamos();
  }, [cargarPrestamos]);

  /**
   * Actualiza el conteo de préstamos activos en ClientContext si el beneficiario es un cliente registrado.
   */
  const sincronizarPrestamosCliente = useCallback((clienteId, delta) => {
    if (!clienteId) return;
    const cliente = clientes.find(c => Number(c.id) === Number(clienteId));
    if (cliente) {
      const actuales = Number(cliente.prestamos_abiertos) || 0;
      const nuevoTotal = Math.max(0, actuales + delta);
      actualizarCliente(cliente.id, {
        ...cliente,
        prestamos_abiertos: nuevoTotal
      });
    }
  }, [clientes, actualizarCliente]);

  /**
   * RF-29: Registrar nuevo préstamo.
   */
  const agregarPrestamo = useCallback(async (datos) => {
    const errores = validarPrestamo(datos);
    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    try {
      const nuevoRemoto = await api.createPrestamo(datos);
      setPrestamos(prev => [nuevoRemoto, ...prev]);
      if (datos.cliente_id) sincronizarPrestamosCliente(datos.cliente_id, 1);
      return { success: true, prestamo: nuevoRemoto };
    } catch (err) {
      console.warn('Error al guardar préstamo en Supabase, guardando localmente:', err);
      const capital = Number(datos.monto_capital);
      const tasa = Number(datos.tasa_interes);
      const interesMonto = capital * (tasa / 100);
      const totalDevolver = capital + interesMonto;

      const maxId = prestamos.length > 0 ? Math.max(...prestamos.map(p => Number(p.id) || 0)) : 0;
      const nuevoLocal = {
        id: maxId + 1,
        cliente_id: datos.cliente_id ? Number(datos.cliente_id) : null,
        beneficiario_nombre: (datos.beneficiario_nombre || datos.nombre_tercero || '').trim(),
        beneficiario_telefono: (datos.beneficiario_telefono || datos.telefono || '').trim(),
        monto_capital: capital,
        tasa_interes: tasa,
        interes_monto: interesMonto,
        total_devolver: totalDevolver,
        monto_total: totalDevolver,
        saldo_pendiente: totalDevolver,
        fecha_entrega: datos.fecha_entrega,
        fecha_limite: datos.fecha_limite,
        tipo_plazo: datos.tipo_plazo || 'mes',
        num_plazos: Number(datos.num_plazos) || 1,
        cuotas: datos.cuotas || [],
        moratoria_tipo: datos.moratoria_tipo || 'semana',
        moratoria_monto: Number(datos.moratoria_monto || 0),
        fecha_registro: new Date().toISOString(),
        abonos: []
      };

      setPrestamos(prev => [nuevoLocal, ...prev]);
      if (datos.cliente_id) sincronizarPrestamosCliente(datos.cliente_id, 1);
      return { success: true, prestamo: nuevoLocal };
    }
  }, [prestamos, sincronizarPrestamosCliente]);

  /**
   * RF-32: Registrar un abono a un préstamo existente.
   */
  const registrarAbono = useCallback(async (prestamoId, datosAbono) => {
    const prestamo = prestamos.find(p => p.id === prestamoId);
    if (!prestamo) return { success: false, error: 'Préstamo no encontrado' };

    const monto = Number(datosAbono.monto);
    if (isNaN(monto) || monto <= 0) {
      return { success: false, error: 'El monto del abono debe ser mayor a 0.' };
    }

    const saldoActual = Number(prestamo.saldo_pendiente) || 0;
    if (monto > saldoActual) {
      return { success: false, error: 'El abono no puede ser mayor al saldo pendiente.' };
    }

    try {
      await api.registrarAbonoPrestamo(prestamoId, monto, datosAbono.nota);
    } catch (err) {
      console.warn('Error al registrar abono a préstamo en Supabase, aplicando localmente:', err);
    }

    const nuevoAbono = {
      id: (prestamo.abonos?.length || 0) + 1,
      monto,
      fecha: datosAbono.fecha || new Date().toISOString().split('T')[0],
      metodo_pago: datosAbono.metodo_pago || 'Efectivo',
      nota: (datosAbono.nota || '').trim()
    };

    const nuevoSaldo = Math.max(0, saldoActual - monto);

    setPrestamos(prev => prev.map(p => {
      if (p.id === prestamoId) {
        return {
          ...p,
          saldo_pendiente: nuevoSaldo,
          abonos: [...(p.abonos || []), nuevoAbono]
        };
      }
      return p;
    }));

    if (nuevoSaldo === 0 && prestamo.cliente_id) {
      sincronizarPrestamosCliente(prestamo.cliente_id, -1);
    }

    return { success: true, nuevoSaldo };
  }, [prestamos, sincronizarPrestamosCliente]);

  /**
   * RF-44: Editar términos del préstamo con persistencia en Supabase.
   */
  const editarPrestamo = useCallback(async (id, datos) => {
    const errores = validarPrestamo(datos);
    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    const capital = Number(datos.monto_capital);
    const tasa = Number(datos.tasa_interes) || 0;
    const interesMonto = Math.round(capital * (tasa / 100));
    const montoTotal = capital + interesMonto;

    try {
      const pActual = prestamos.find(p => p.id === id);
      const totalAbonado = ((pActual && pActual.abonos) || []).reduce((sum, a) => sum + Number(a.monto), 0);
      const nuevoSaldo = Math.max(0, montoTotal - totalAbonado);

      const datosUpdate = {
        ...datos,
        monto_capital: capital,
        tasa_interes: tasa,
        saldo_pendiente: nuevoSaldo
      };

      const prestamoActualizado = await api.updatePrestamo(id, datosUpdate);

      setPrestamos(prev => prev.map(p => (p.id === id ? prestamoActualizado : p)));
      return { success: true };
    } catch (err) {
      console.error('Error al persistir actualización en Supabase, aplicando local:', err);
      setPrestamos(prev => prev.map(p => {
        if (p.id !== id) return p;
        const totalAbonado = (p.abonos || []).reduce((sum, a) => sum + Number(a.monto), 0);
        const nuevoSaldo = Math.max(0, montoTotal - totalAbonado);

        return {
          ...p,
          cliente_id: datos.cliente_id ? Number(datos.cliente_id) : null,
          es_cliente_registrado: !!datos.cliente_id,
          beneficiario_nombre: datos.beneficiario_nombre.trim(),
          beneficiario_telefono: datos.beneficiario_telefono.trim(),
          monto_capital: capital,
          tasa_interes: tasa,
          monto_interes: interesMonto,
          monto_total: montoTotal,
          saldo_pendiente: nuevoSaldo,
          fecha_entrega: datos.fecha_entrega,
          fecha_limite: datos.fecha_limite,
          tipo_plazo: datos.tipo_plazo || p.tipo_plazo || 'mes',
          num_plazos: Number(datos.num_plazos) || p.num_plazos || 1,
          cuotas: datos.cuotas || p.cuotas || [],
          moratoria_tipo: datos.moratoria_tipo || p.moratoria_tipo || 'semana',
          moratoria_monto: Number(datos.moratoria_monto !== undefined ? datos.moratoria_monto : (p.moratoria_monto || 0)),
          frecuencia_pago: datos.tipo_plazo || datos.frecuencia_pago || p.frecuencia_pago,
          notas: (datos.notas || '').trim(),
        };
      }));
      return { success: true };
    }
  }, [prestamos]);

  /**
   * RF-44: Eliminar registro de préstamo.
   * Elimina la actualización optimista prematura: solo actualiza el estado local tras confirmación exitosa de Supabase.
   */
  const eliminarPrestamo = useCallback(async (id) => {
    const prestamo = prestamos.find(p => p.id === id);
    if (!prestamo) return { success: false, error: 'Préstamo no encontrado.' };

    try {
      await api.deletePrestamo(id);

      // Actualizar estado local solo tras confirmación exitosa
      setPrestamos(prev => {
        const actualizados = prev.filter(p => p.id !== id);
        localStorage.setItem('me_prestamos_data', JSON.stringify(actualizados));
        return actualizados;
      });

      // Si estaba activo con saldo > 0 y pertenecía a un cliente, decrementar
      if (prestamo.saldo_pendiente > 0 && prestamo.cliente_id) {
        sincronizarPrestamosCliente(prestamo.cliente_id, -1);
      }

      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar préstamo en Supabase:', err);
      return { success: false, error: err.message || 'Error al eliminar el préstamo en la base de datos.' };
    }
  }, [prestamos, sincronizarPrestamosCliente]);

  /**
   * KPIs globales de préstamos.
   */
  const calcularKPIsPrestamos = useCallback(() => {
    let capitalPrestado = 0;
    let interesesProyectados = 0;
    let saldoTotalPendiente = 0;
    let prestamosActivos = 0;
    let prestamosVencidos = 0;
    let prestamosLiquidados = 0;
    let totalRecaudadoAbonos = 0;

    prestamos.forEach(p => {
      const estado = calcularEstadoPrestamo(p);
      const capital = Number(p.monto_capital) || 0;
      const interes = Number(p.monto_interes) || 0;
      const saldo = Number(p.saldo_pendiente) || 0;

      capitalPrestado += capital;
      interesesProyectados += interes;
      saldoTotalPendiente += saldo;

      if (estado === 'liquidado') {
        prestamosLiquidados++;
      } else {
        prestamosActivos++;
        if (estado === 'atrasado') {
          prestamosVencidos++;
        }
      }

      (p.abonos || []).forEach(a => {
        totalRecaudadoAbonos += Number(a.monto) || 0;
      });
    });

    return {
      capitalPrestado,
      interesesProyectados,
      saldoTotalPendiente,
      prestamosActivos,
      prestamosVencidos,
      prestamosLiquidados,
      totalRecaudadoAbonos,
      totalPrestamosCount: prestamos.length
    };
  }, [prestamos]);

  /**
   * RF-42: Filtrar préstamos.
   */
  const filtrarPrestamos = useCallback((lista, { busqueda = '', filtroEstado = 'todos', filtroTipo = 'todos' }) => {
    const q = busqueda.toLowerCase().trim();

    return lista.filter(p => {
      const coincideBusqueda =
        !q ||
        (p.beneficiario_nombre || '').toLowerCase().includes(q) ||
        (p.beneficiario_telefono || '').includes(q) ||
        (p.notas || '').toLowerCase().includes(q) ||
        String(p.id).includes(q);

      const estado = calcularEstadoPrestamo(p);
      const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado;

      let coincideTipo = true;
      if (filtroTipo === 'clientes') coincideTipo = !!p.cliente_id;
      else if (filtroTipo === 'terceros') coincideTipo = !p.cliente_id;

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, []);

  return (
    <PrestamosContext.Provider
      value={{
        prestamos,
        agregarPrestamo,
        registrarAbono,
        editarPrestamo,
        eliminarPrestamo,
        calcularKPIsPrestamos,
        filtrarPrestamos,
        calcularEstadoPrestamo,
      }}
    >
      {children}
    </PrestamosContext.Provider>
  );
}

export function usePrestamos() {
  const context = useContext(PrestamosContext);
  if (!context) {
    throw new Error('usePrestamos debe usarse dentro de un PrestamosProvider');
  }
  return context;
}
