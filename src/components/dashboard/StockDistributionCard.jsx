import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';

export default function StockDistributionCard() {
  const { metrics = {} } = useDashboard?.() || {};
  const productos = metrics?.listaProductos || [];

  const totalStock = metrics?.totalStockUnidades ?? 0;

  const categories = useMemo(() => {
    const perf = productos.filter(p => p.tipo === 'perfume').reduce((a, c) => a + (Number(c.stock) || 0), 0);
    const ropa = productos.filter(p => ['camisa', 'short', 'pantalón', 'vestido'].includes(p.tipo)).reduce((a, c) => a + (Number(c.stock) || 0), 0);
    const calzado = productos.filter(p => ['zapato', 'crocs'].includes(p.tipo)).reduce((a, c) => a + (Number(c.stock) || 0), 0);
    const maq = productos.filter(p => p.tipo === 'maquillaje').reduce((a, c) => a + (Number(c.stock) || 0), 0);
    const elec = productos.filter(p => p.tipo === 'aparato electrónico').reduce((a, c) => a + (Number(c.stock) || 0), 0);
    const acc = productos.filter(p => p.tipo === 'accesorio').reduce((a, c) => a + (Number(c.stock) || 0), 0);

    return [
      { tipo: 'Perfumería', total_stock: perf, max_esperado: 60 },
      { tipo: 'Ropa / Indumentaria', total_stock: ropa, max_esperado: 100 },
      { tipo: 'Calzado y Crocs', total_stock: calzado, max_esperado: 50 },
      { tipo: 'Maquillaje', total_stock: maq, max_esperado: 40 },
      { tipo: 'Aparatos Electrónicos', total_stock: elec, max_esperado: 25 },
      { tipo: 'Accesorios', total_stock: acc, max_esperado: 50 }
    ];
  }, [productos]);

  return (
    <section className="card-glass stock-breakdown-card" id="dashboard-stock-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="icon-circle-badge gold-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
              <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
            </svg>
          </div>
          <div>
            <h3 className="card-heading">Distribución de Inventario</h3>
            <p className="card-subheading">Capacidad por categoría</p>
          </div>
        </div>
        <span className="badge-count" id="stock-capacity-badge">
          {totalStock} / 325 unids.
        </span>
      </div>

      <div className="category-bars-list" id="stock-category-bars">
        {categories.map((cat) => {
          const porcentaje = Math.min(Math.round((cat.total_stock / cat.max_esperado) * 100), 100);
          let colorBarra = 'var(--color-rosa-empolvado)';
          if (cat.total_stock === 0) colorBarra = 'rgba(244, 63, 94, 0.7)';
          else if (cat.total_stock < 5) colorBarra = 'var(--color-dorado)';

          return (
            <div key={cat.tipo} className="category-bar-row">
              <div className="bar-header">
                <span className="bar-name">{cat.tipo}</span>
                <span className="bar-units">
                  {cat.total_stock} / {cat.max_esperado} unids. — {porcentaje}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${porcentaje}%`, background: colorBarra }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
