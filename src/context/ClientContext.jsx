import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ClientContext = createContext(null);

export function ClientProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial y reactiva desde Supabase
  const cargarClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getClientes();
      setClientes(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_clientes_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar clientes desde Supabase:', err);
      // Solo en caso de error de red cargar respaldo
      try {
        const guardados = localStorage.getItem('me_clientes_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setClientes(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Validación de cliente
  const validarCliente = useCallback((datos) => {
    const errores = {};

    const nombreLimpio = (datos.nombre_completo || datos.nombre || '').trim();
    if (!nombreLimpio) {
      errores.nombre_completo = 'El nombre completo es obligatorio.';
    } else {
      const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
      if (!regexNombre.test(nombreLimpio)) {
        errores.nombre_completo = 'El nombre no debe contener números ni símbolos especiales.';
      }
    }

    const telLimpio = (datos.telefono || '').replace(/[\s-]/g, '');
    if (!telLimpio) {
      errores.telefono = 'El teléfono de contacto es obligatorio.';
    } else {
      const regexTel = /^\d{8}$/;
      if (!regexTel.test(telLimpio)) {
        errores.telefono = 'El teléfono debe contener un número válido de 8 dígitos.';
      }
    }

    if (!datos.mes_cumple && !datos.mes_cumpleanos) {
      errores.fecha_nacimiento = 'Selecciona el día y mes de cumpleaños.';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }, []);

  // Regla de Negocio: Verificación de eliminación (RF-15)
  const puedeEliminarse = useCallback((cliente) => {
    const motivos = [];

    if (cliente.pedidos_activos && cliente.pedidos_activos > 0) {
      motivos.push(`Tiene ${cliente.pedidos_activos} pedido(s) en gestión o pendiente(s) de entrega.`);
    }

    if (cliente.saldo_pendiente && cliente.saldo_pendiente > 0) {
      motivos.push(`Mantiene un saldo adeudado de ₡${Number(cliente.saldo_pendiente).toLocaleString('es-CR')} en cuentas por cobrar.`);
    }

    if (cliente.prestamos_abiertos && cliente.prestamos_abiertos > 0) {
      motivos.push(`Registra ${cliente.prestamos_abiertos} préstamo(s) activo(s) con saldo pendiente.`);
    }

    return {
      puede: motivos.length === 0,
      motivos
    };
  }, []);

  // Guardar nuevo cliente directamente en Supabase
  const agregarCliente = useCallback(async (datos) => {
    const validacion = validarCliente(datos);
    if (!validacion.esValido) {
      return { success: false, errores: validacion.errores };
    }

    try {
      const nuevoRemoto = await api.createCliente(datos);
      if (nuevoRemoto) {
        setClientes(prev => [nuevoRemoto, ...prev.filter(c => Number(c.id) !== Number(nuevoRemoto.id))]);
        return { success: true, cliente: nuevoRemoto };
      }
      return { success: false, error: 'No se recibieron datos de Supabase' };
    } catch (err) {
      console.error('❌ Error al guardar cliente en Supabase:', err);
      return { success: false, error: err.message || 'Error al conectar con Supabase' };
    }
  }, [validarCliente]);

  // Actualizar cliente directamente en Supabase
  const actualizarCliente = useCallback(async (id, datos) => {
    const validacion = validarCliente(datos);
    if (!validacion.esValido) {
      return { success: false, errores: validacion.errores };
    }

    try {
      const actualizadoRemoto = await api.updateCliente(id, datos);
      if (actualizadoRemoto) {
        setClientes(prev => prev.map(c => Number(c.id) === Number(id) ? actualizadoRemoto : c));
        return { success: true, cliente: actualizadoRemoto };
      }
      return { success: false, error: 'No se pudo actualizar en Supabase' };
    } catch (err) {
      console.error('❌ Error al actualizar cliente en Supabase:', err);
      return { success: false, error: err.message || 'Error al actualizar en Supabase' };
    }
  }, [validarCliente]);

  // Eliminar cliente directamente en Supabase
  const eliminarCliente = useCallback(async (id) => {
    const cliente = clientes.find(c => Number(c.id) === Number(id));
    if (!cliente) return { success: false, error: 'Cliente no encontrado' };

    // Validación RF-15
    const verificacion = puedeEliminarse(cliente);
    if (!verificacion.puede) {
      return { success: false, bloqueado: true, motivos: verificacion.motivos };
    }

    try {
      const res = await api.deleteCliente(id);
      if (res && !res.success && res.bloqueado) {
        return res;
      }
      setClientes(prev => prev.filter(c => Number(c.id) !== Number(id)));
      return { success: true };
    } catch (err) {
      console.error('❌ Error al eliminar cliente en Supabase:', err);
      return { success: false, error: err.message || 'Error al eliminar en Supabase' };
    }
  }, [clientes, puedeEliminarse]);

  return (
    <ClientContext.Provider
      value={{
        clientes,
        isLoading,
        cargarClientes,
        validarCliente,
        puedeEliminarse,
        agregarCliente,
        actualizarCliente,
        eliminarCliente
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients debe usarse dentro de un ClientProvider');
  }
  return context;
}

