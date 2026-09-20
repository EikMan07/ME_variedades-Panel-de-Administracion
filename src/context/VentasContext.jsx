import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useProducts } from './ProductContext';
import { useClients } from './ClientContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

const VentasContext = createContext(null);

const STORAGE_KEY_VENTAS = 'me_variedades_ventas_v4';

export function VentasProvider({ children }) {
  const { productos, ajustarStock, cargarProductos } = useProducts();
  const { clientes } = useClients();
  const { showToast } = useToast();

  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial sincronizada exclusivamente desde Supabase
  const cargarVentas = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getPedidos();
      setVentas(Array.isArray(datosRemotos) ? datosRemotos : []);
      localStorage.setItem(STORAGE_KEY_VENTAS, JSON.stringify(datosRemotos || []));
    } catch (err) {
      console.error('❌ Error al cargar ventas desde Supabase:', err);
      try {
        const rawLocal = localStorage.getItem(STORAGE_KEY_VENTAS);
        if (rawLocal) setVentas(JSON.parse(rawLocal));
      } catch { /* ignorar */ }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  /**
   * FUNCIÓN PRINCIPAL: procesarVenta(datosVenta)
   * Creación de nuevas ventas en Supabase con descuento de inventario vía trigger de BD.
   */
  const procesarVenta = useCallback(async (datosVenta) => {
    const errores = {};

    // 1. Validación de Cliente (RF-32)
    if (!datosVenta.clienteId && !datosVenta.cliente_id) {
      errores.clienteId = 'Debe seleccionar un cliente del directorio.';
    }

    // 2. Validación de Producto
    const prodId = datosVenta.productoId || datosVenta.producto_id;
    if (!prodId) {
      errores.productoId = 'Debe seleccionar un producto en catálogo.';
    }

    const producto = productos.find((p) => String(p.id) === String(prodId));

    // 3. Validación de Cantidad y Control Estricto de Stock (RF-39)
    const cantidad = Number(datosVenta.cantidad);
    if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
      errores.cantidad = 'Ingrese una cantidad entera válida mayor a cero.';
    } else if (producto) {
      const stockActual = Number(producto.stock) || 0;
      if (stockActual === 0 || cantidad > stockActual) {
        errores.cantidad = `Stock insuficiente. Solo hay ${stockActual} unidad(es) disponible(s).`;
      }
    }

    // 4. Validación de Precios (RF-34)
    const precioFacturacion = Number(datosVenta.precioFacturacion);
    const precioVentaReal = Number(datosVenta.precioVentaReal);

    if (isNaN(precioFacturacion) || precioFacturacion < 0) {
      errores.precioFacturacion = 'El precio de facturación debe ser mayor o igual a 0.';
    }

    if (!precioVentaReal || precioVentaReal <= 0) {
      errores.precioVentaReal = 'El precio de venta real debe ser mayor a 0.';
    }

    // 5. Validación de Modalidad y Cuotas (RF-35 a RF-38)
    const modalidad = datosVenta.modalidad || 'contado';
    let cuotasDetalle = [];

    if (modalidad === 'credito') {
      const numPlazos = Number(datosVenta.numPlazos);
      if (!numPlazos || numPlazos <= 0) {
        errores.numPlazos = 'El número de plazos debe ser mayor a 0.';
      }

      if (!Array.isArray(datosVenta.cuotas) || datosVenta.cuotas.length === 0) {
        errores.cuotas = 'Debe generarse el cronograma de cuotas para ventas a crédito.';
      } else {
        cuotasDetalle = datosVenta.cuotas.map((c, idx) => ({
          numeroCuota: c.numeroCuota || idx + 1,
          fechaVencimiento: c.fechaVencimiento,
          montoSugerido: Number(c.montoSugerido) || 0,
          montoRealAcordado: Number(c.montoRealAcordado !== undefined ? c.montoRealAcordado : c.montoSugerido),
          pagada: Boolean(c.pagada),
          montoPagado: Number(c.montoPagado || 0),
          estado: c.pagada ? 'pagado' : 'pendiente',
        }));
      }
    }

    if (Object.keys(errores).length > 0) {
      return { success: false, errores };
    }

    // 6. Preparar y persistir venta en Supabase (public.pedidos)
    const clienteIdFinal = datosVenta.clienteId || datosVenta.cliente_id;
    const totalVenta = precioVentaReal * cantidad;
    const costoTotal = (precioFacturacion || Number(producto?.costo || 0)) * cantidad;

    let ventaGuardada = null;
    try {
      ventaGuardada = await api.createPedido({
        cliente_id: Number(clienteIdFinal),
        producto_id: Number(prodId),
        cantidad: cantidad,
        total: totalVenta,
        costo_total: costoTotal,
        precio_facturacion: precioFacturacion,
        precio_venta_real: precioVentaReal,
        modalidad: modalidad,
        tipo_plazo: modalidad === 'credito' ? (datosVenta.tipoPlazo || 'quincena') : null,
        num_plazos: modalidad === 'credito' ? Math.max(1, Number(datosVenta.numPlazos) || 1) : null,
        cuotas: cuotasDetalle,
        moratoria_tipo: modalidad === 'credito' ? (datosVenta.moratoria_tipo || datosVenta.moratoriaTipo || 'semana') : null,
        moratoria_monto: modalidad === 'credito' ? Number(datosVenta.moratoria_monto ?? datosVenta.moratoriaMonto ?? 0) : 0,
        estado: modalidad === 'contado' ? 'Liquidado' : 'Activo',
      });

      // Sincronizar catálogo de productos (el trigger tr_descontar_stock_pedido en Supabase descontó el stock en BD)
      if (cargarProductos) cargarProductos();
    } catch (errApi) {
      console.error('❌ Error al persistir venta en Supabase:', errApi);
      return { success: false, errores: { global: 'Error de base de datos al registrar la venta.' } };
    }

    setVentas((prev) => [ventaGuardada, ...prev]);
    showToast(`Venta #VTA-${String(ventaGuardada.id).padStart(4, '0')} registrada con éxito.`, 'success');
    return { success: true, venta: ventaGuardada };
  }, [productos, ventas, cargarProductos, showToast]);

  /**
   * ACTUALIZAR VENTA EXISTENTE (RF-40)
   * Persiste en Supabase vía updatePedido y ajusta stock solo por el diferencial.
   */
  const actualizarVenta = useCallback(async (id, cambios) => {
    try {
      const ventaActual = ventas.find((v) => String(v.id) === String(id));
      if (!ventaActual) {
        throw new Error('Venta no encontrada para actualizar');
      }

      const cantidadVieja = Number(ventaActual.cantidad) || 1;
      const cantidadNueva = Number(cambios.cantidad !== undefined ? cambios.cantidad : cantidadVieja);
      const prodId = Number(cambios.productoId || cambios.producto_id || ventaActual.producto_id);
      const clienteId = Number(cambios.clienteId || cambios.cliente_id || ventaActual.cliente_id);
      const precioFacturacion = cambios.precioFacturacion !== undefined ? Number(cambios.precioFacturacion) : ventaActual.precio_facturacion;
      const precioVentaReal = cambios.precioVentaReal !== undefined ? Number(cambios.precioVentaReal) : (ventaActual.precio_venta_real || ventaActual.total);
      const totalVenta = precioVentaReal * cantidadNueva;
      const modalidad = cambios.modalidad || ventaActual.modalidad || 'contado';

      let cuotasDetalle = [];
      if (modalidad === 'credito') {
        const cuotasIn = cambios.cuotas || ventaActual.cuotas || [];
        cuotasDetalle = cuotasIn.map((c, idx) => ({
          numeroCuota: c.numeroCuota || idx + 1,
          fechaVencimiento: c.fechaVencimiento,
          montoSugerido: Number(c.montoSugerido) || 0,
          montoRealAcordado: Number(c.montoRealAcordado !== undefined ? c.montoRealAcordado : c.montoSugerido),
          pagada: Boolean(c.pagada),
          montoPagado: Number(c.montoPagado || 0),
          estado: c.pagada ? 'pagado' : 'pendiente',
        }));
      }

      // Si la cantidad de unidades varió, ajustamos el inventario únicamente por el diferencial
      const diffCantidad = cantidadNueva - cantidadVieja;
      if (diffCantidad !== 0 && prodId && ajustarStock) {
        await ajustarStock(prodId, -diffCantidad, `Ajuste edición Venta #VTA-${String(id).padStart(4, '0')}`);
      }

      // Persistir la actualización en Supabase
      const pedidoActualizado = await api.updatePedido(id, {
        cliente_id: clienteId,
        producto_id: prodId,
        cantidad: cantidadNueva,
        total: totalVenta,
        precio_facturacion: precioFacturacion,
        precio_venta_real: precioVentaReal,
        modalidad: modalidad,
        tipo_plazo: modalidad === 'credito' ? (cambios.tipoPlazo || ventaActual.tipo_plazo) : null,
        num_plazos: modalidad === 'credito' ? (Number(cambios.numPlazos) || ventaActual.num_plazos) : null,
        cuotas: cuotasDetalle,
        moratoria_tipo: modalidad === 'credito' ? (cambios.moratoria_tipo || cambios.moratoriaTipo || ventaActual.moratoria_tipo || 'semana') : null,
        moratoria_monto: modalidad === 'credito' ? Number(cambios.moratoria_monto !== undefined ? cambios.moratoria_monto : (cambios.moratoriaMonto !== undefined ? cambios.moratoriaMonto : (ventaActual.moratoria_monto || 0))) : 0,
        estado: cambios.estado || ventaActual.estado || (modalidad === 'contado' ? 'Liquidado' : 'Activo'),
      });

      setVentas((prev) => prev.map((v) => (String(v.id) === String(id) ? pedidoActualizado : v)));
      if (cargarProductos) cargarProductos();

      showToast(`Venta #VTA-${String(id).padStart(4, '0')} actualizada con éxito.`, 'success');
      return { success: true, venta: pedidoActualizado };
    } catch (err) {
      console.error('Error al actualizar venta en Supabase:', err);
      showToast('Error al actualizar la venta en el servidor.', 'error');
      return { success: false, error: err.message };
    }
  }, [ventas, ajustarStock, cargarProductos, showToast]);

  const eliminarVenta = useCallback(async (id) => {
    try {
      const venta = ventas.find((v) => String(v.id) === String(id));
      await api.deletePedido(id);

      // Reintegrar stock al inventario
      if (venta && venta.producto_id && ajustarStock) {
        await ajustarStock(Number(venta.producto_id), Number(venta.cantidad || 1), `Devolución por eliminación de venta #${id}`);
      }

      setVentas((prev) => prev.filter((v) => String(v.id) !== String(id)));
      if (cargarProductos) cargarProductos();

      showToast('Venta eliminada del registro.', 'info');
      return { success: true };
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      showToast('Error al eliminar la venta.', 'error');
      return { success: false, error: err.message };
    }
  }, [ventas, ajustarStock, cargarProductos, showToast]);

  const value = {
    ventas,
    pedidos: ventas, // Alias para compatibilidad hacia atrás
    orders: ventas, // Alias para componentes antiguos de analytics
    isLoading,
    procesarVenta,
    procesarPedido: procesarVenta, // Alias
    eliminarVenta,
    eliminarPedido: eliminarVenta, // Alias
    actualizarVenta,
    actualizarPedido: actualizarVenta, // Alias
    cargarVentas,
    cargarPedidos: cargarVentas, // Alias
  };

  return <VentasContext.Provider value={value}>{children}</VentasContext.Provider>;
}

export function useVentas() {
  const context = useContext(VentasContext);
  if (!context) {
    throw new Error('useVentas debe utilizarse dentro de un VentasProvider');
  }
  return context;
}

export default VentasProvider;
