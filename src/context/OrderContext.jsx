import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProducts } from './ProductContext';
import { useClients } from './ClientContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { productos, ajustarStock, cargarProductos } = useProducts();
  const { clientes, actualizarCliente } = useClients();
  const { showToast } = useToast();

  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde Supabase
  const cargarPedidos = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getPedidos();
      setPedidos(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem('me_pedidos_data', JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar pedidos desde Supabase:', err);
      try {
        const guardados = localStorage.getItem('me_pedidos_data');
        if (guardados) {
          const parsed = JSON.parse(guardados);
          if (Array.isArray(parsed)) setPedidos(parsed);
        }
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  /**
   * FUNCIÓN PRINCIPAL: procesarPedido(datosPedido)
   * Valida campos, comprueba stock, descuenta inventario y registra el pedido (RF-34 a RF-37)
   */
  const procesarPedido = useCallback(async (datosPedido) => {
    const errores = {};

    // 1. Validación de Cliente obligatorio
    if (!datosPedido.cliente_id) {
      errores.cliente_id = 'Debe seleccionar un cliente del directorio.';
    }

    // 2. Validación de Producto obligatorio
    if (!datosPedido.producto_id) {
      errores.producto_id = 'Debe seleccionar un producto en catálogo.';
    }

    const producto = productos.find(p => String(p.id) === String(datosPedido.producto_id));

    // 3. Validación de Cantidad y Control Estricto de Stock (Edge Case)
    const cantidad = Number(datosPedido.cantidad);
    if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
      errores.cantidad = 'Ingrese una cantidad válida mayor a cero.';
    } else if (producto) {
      const stockActual = Number(producto.stock) || 0;
      if (stockActual === 0 || cantidad > stockActual) {
        errores.cantidad = 'Stock insuficiente para este producto';
      }
    }

    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    // 4. Cálculo del costo total
    const costoUnitario = Number(producto.costo) || 0;
    const costoTotal = cantidad * costoUnitario;

    let nuevoPedido = null;

    try {
      nuevoPedido = await api.createPedido({
        cliente_id: Number(datosPedido.cliente_id),
        producto_id: Number(datosPedido.producto_id),
        cantidad: cantidad,
        total: costoTotal,
        costo_total: costoTotal,
        estado: 'Activo'
      });
      // Sincronizar productos remotos para reflejar el stock descontado por trigger
      if (cargarProductos) cargarProductos();
    } catch (err) {
      console.warn('Error al guardar pedido en Supabase, guardando localmente y descontando stock:', err);
      const maxId = pedidos.length > 0 ? Math.max(...pedidos.map(p => Number(p.id) || 0)) : 0;
      nuevoPedido = {
        id: maxId + 1,
        cliente_id: Number(datosPedido.cliente_id),
        producto_id: Number(datosPedido.producto_id),
        cantidad: cantidad,
        total: costoTotal,
        costo_total: costoTotal,
        fecha_registro: new Date().toISOString(),
        created_at: new Date().toISOString(),
        estado: 'Activo'
      };
      // Descontar inventario local
      ajustarStock(producto.id, -cantidad);
    }

    // 5. Actualizar estado local de pedidos
    setPedidos(prev => [nuevoPedido, ...prev.filter(p => Number(p.id) !== Number(nuevoPedido.id))]);

    // 6. Incrementar contador de pedidos activos en el cliente (RF-37)
    const cliente = clientes.find(c => Number(c.id) === Number(datosPedido.cliente_id));
    if (cliente) {
      const pedidosPrevios = Number(cliente.pedidos_activos) || 0;
      actualizarCliente(cliente.id, {
        ...cliente,
        pedidos_activos: pedidosPrevios + 1
      });
    }

    showToast(`Pedido registrado exitosamente. Stock descontado (${cantidad} unids).`, 'success');
    return { success: true, pedido: nuevoPedido };
  }, [productos, pedidos, clientes, ajustarStock, actualizarCliente, showToast, cargarProductos]);

  /**
   * Actualizar pedido existente (Cliente, Producto, Cantidad, Estado)
   */
  const actualizarPedido = useCallback(async (id, datosPedido) => {
    const errores = {};

    if (!datosPedido.cliente_id) {
      errores.cliente_id = 'Debe seleccionar un cliente del directorio.';
    }
    if (!datosPedido.producto_id) {
      errores.producto_id = 'Debe seleccionar un producto en catálogo.';
    }

    const cantidad = Number(datosPedido.cantidad);
    if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
      errores.cantidad = 'Ingrese una cantidad válida mayor a cero.';
    }

    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    const producto = productos.find(p => String(p.id) === String(datosPedido.producto_id));
    const costoUnitario = producto ? (Number(producto.costo) || 0) : 0;
    const costoTotal = cantidad * costoUnitario;

    try {
      const pedidoActualizado = await api.updatePedido(id, {
        cliente_id: Number(datosPedido.cliente_id),
        producto_id: Number(datosPedido.producto_id),
        cantidad: cantidad,
        total: costoTotal,
        costo_total: costoTotal,
        estado: datosPedido.estado || 'Activo'
      });

      setPedidos(prev => prev.map(p => Number(p.id) === Number(id) ? pedidoActualizado : p));
      showToast(`Pedido #PED-${String(id).padStart(4, '0')} actualizado correctamente.`, 'success');
      return { success: true, pedido: pedidoActualizado };
    } catch (err) {
      console.error('Error al actualizar pedido:', err);
      // Fallback local
      const pedidoActualizado = {
        id: Number(id),
        cliente_id: Number(datosPedido.cliente_id),
        producto_id: Number(datosPedido.producto_id),
        cantidad: cantidad,
        total: costoTotal,
        costo_total: costoTotal,
        estado: datosPedido.estado || 'Activo',
        updated_at: new Date().toISOString()
      };
      setPedidos(prev => prev.map(p => Number(p.id) === Number(id) ? { ...p, ...pedidoActualizado } : p));
      showToast(`Pedido actualizado localmente.`, 'success');
      return { success: true, pedido: pedidoActualizado };
    }
  }, [productos, showToast]);

  /**
   * Eliminar pedido
   */
  const eliminarPedido = useCallback(async (id) => {
    try {
      await api.deletePedido(id);
      setPedidos(prev => prev.filter(p => Number(p.id) !== Number(id)));
      showToast(`Pedido #PED-${String(id).padStart(4, '0')} eliminado exitosamente.`, 'success');
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar pedido:', err);
      setPedidos(prev => prev.filter(p => Number(p.id) !== Number(id)));
      showToast(`Pedido removido del registro.`, 'success');
      return { success: true };
    }
  }, [showToast]);

  return (
    <OrderContext.Provider
      value={{
        pedidos,
        isLoading,
        cargarPedidos,
        procesarPedido,
        actualizarPedido,
        eliminarPedido
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders debe usarse dentro de un OrderProvider');
  }
  return context;
}
