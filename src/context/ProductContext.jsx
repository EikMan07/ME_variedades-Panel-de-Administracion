import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [productos, setProductos] = useState(() => {
    try {
      const guardados = localStorage.getItem('me_productos_data');
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p, i) => ({
            ...p,
            id: Number(p.id) || i + 1,
            costo: Number(p.costo) || 0,
            stock: Math.max(0, Number(p.stock) || 0)
          }));
        }
      }
    } catch {
      // Ignorar error de JSON corrupto
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);

  // Carga inicial desde Supabase
  const cargarProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      const datosRemotos = await api.getProductos();
      if (datosRemotos && Array.isArray(datosRemotos) && datosRemotos.length > 0) {
        setProductos(datosRemotos);
        localStorage.setItem('me_productos_data', JSON.stringify(datosRemotos));
      }
    } catch (err) {
      console.warn('Usando productos de caché local (Supabase offline o en proceso de migración):', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  useEffect(() => {
    localStorage.setItem('me_productos_data', JSON.stringify(productos));
  }, [productos]);

  // Validación de producto
  const validarProducto = useCallback((datos) => {
    const errores = {};

    if (!datos.nombre || !datos.nombre.trim()) {
      errores.producto_nombre = 'El nombre del producto es obligatorio.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(datos.nombre.trim())) {
      errores.producto_nombre = 'El nombre solo debe contener letras y espacios, no números.';
    }

    const tiposPermitidos = ['perfume', 'camisa', 'short', 'pantalón', 'vestido', 'zapato', 'crocs', 'maquillaje', 'accesorio', 'aparato electrónico'];
    if (!datos.tipo || !tiposPermitidos.includes(datos.tipo.toLowerCase())) {
      errores.producto_tipo = 'Debe seleccionar una opción válida';
    }

    // Regla RF-28: Género obligatorio excepto para maquillaje
    if (datos.tipo !== 'maquillaje') {
      if (!datos.genero) {
        errores.producto_genero = 'Debe seleccionar una opción válida';
      }
    }

    if (datos.costo === null || isNaN(datos.costo) || Number(datos.costo) <= 0) {
      errores.producto_costo = 'El valor debe ser mayor a 0';
    }

    if (datos.stock === null || isNaN(datos.stock) || Number(datos.stock) < 0) {
      errores.producto_stock = 'El stock no puede ser negativo.';
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores
    };
  }, []);

  const agregarProducto = useCallback(async (datos) => {
    const validacion = validarProducto(datos);
    if (!validacion.esValido) {
      return { success: false, errores: validacion.errores };
    }

    try {
      const nuevoRemoto = await api.createProducto(datos);
      setProductos(prev => [nuevoRemoto, ...prev]);
      return { success: true, producto: nuevoRemoto };
    } catch (err) {
      console.warn('Error al guardar producto en Supabase, guardando localmente:', err);
      const maxId = productos.length > 0 ? Math.max(...productos.map(p => Number(p.id) || 0)) : 0;
      const nuevoLocal = {
        id: maxId + 1,
        nombre: datos.nombre.trim(),
        tipo: datos.tipo.toLowerCase(),
        genero: datos.tipo.toLowerCase() === 'maquillaje' ? null : datos.genero,
        costo: Number(datos.costo),
        stock: Number(datos.stock),
        imagen_url: datos.imagen_url || null
      };
      setProductos(prev => [nuevoLocal, ...prev]);
      return { success: true, producto: nuevoLocal };
    }
  }, [productos, validarProducto]);

  const actualizarProducto = useCallback(async (id, datos) => {
    const validacion = validarProducto(datos);
    if (!validacion.esValido) {
      return { success: false, errores: validacion.errores };
    }

    try {
      await api.updateProducto(id, datos);
    } catch (err) {
      console.warn('Error al actualizar producto en Supabase, aplicando localmente:', err);
    }

    setProductos(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          nombre: datos.nombre.trim(),
          tipo: datos.tipo.toLowerCase(),
          genero: datos.tipo.toLowerCase() === 'maquillaje' ? null : datos.genero,
          costo: Number(datos.costo),
          stock: Number(datos.stock),
          imagen_url: datos.imagen_url !== undefined ? datos.imagen_url : p.imagen_url
        };
      }
      return p;
    }));

    return { success: true };
  }, [validarProducto]);

  // Ajuste rápido de stock (+ / -) con límite mínimo en 0
  const ajustarStock = useCallback(async (id, cambio) => {
    let nuevoValor = null;
    let nombreProd = '';

    try {
      const res = await api.adjustStock(id, cambio);
      nuevoValor = res.nuevoStock;
      nombreProd = res.nombre;
    } catch (err) {
      console.warn('Error al ajustar stock en Supabase, aplicando localmente:', err);
    }

    setProductos(prev => prev.map(p => {
      if (p.id === id) {
        nombreProd = p.nombre;
        const actual = Number(p.stock) || 0;
        if (cambio < 0 && actual <= 0) {
          nuevoValor = 0;
          return p;
        }
        nuevoValor = nuevoValor !== null ? nuevoValor : Math.max(0, actual + cambio);
        return { ...p, stock: nuevoValor };
      }
      return p;
    }));

    return { success: true, nuevoStock: nuevoValor, nombre: nombreProd };
  }, []);

  const eliminarProducto = useCallback(async (id) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return { success: false, error: 'Producto no encontrado' };

    try {
      await api.deleteProducto(id);
    } catch (err) {
      console.warn('Error al eliminar producto de Supabase, aplicando localmente:', err);
    }

    setProductos(prev => prev.filter(p => p.id !== id));
    return { success: true, productoEliminado: prod };
  }, [productos]);

  return (
    <ProductContext.Provider
      value={{
        productos,
        isLoading,
        cargarProductos,
        validarProducto,
        agregarProducto,
        actualizarProducto,
        ajustarStock,
        eliminarProducto
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de un ProductProvider');
  }
  return context;
}

