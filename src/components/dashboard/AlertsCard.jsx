import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';

export default function AlertsCard() {
  const { metrics = {} } = useDashboard?.() || {};

  const { cobrosStatus, prestamosStatus, stockStatus, hasAlerts, alertList, resumenGeneral } = useMemo(() => {
    const productos = metrics?.listaProductos || [];
    const pagos = metrics?.listaPagos || [];
    const prestamos = metrics?.listaPrestamos || [];

    const sinStock = productos.filter(p => Number(p.stock) === 0).length;
    const bajoStock = productos.filter(p => Number(p.stock) > 0 && Number(p.stock) < 5).length;
    const cuentasPendientes = pagos.filter(p => Number(p.saldo_pendiente) > 0).length;
    const prestamosPendientes = prestamos.filter(p => Number(p.saldo_pendiente) > 0).length;

    const list = [];
    if (sinStock > 0) {
      list.push({ tipo: 'danger', titulo: `${sinStock} producto(s) sin stock`, desc: 'Requiere reabastecimiento urgente' });
    }
    if (bajoStock > 0) {
      list.push({ tipo: 'warning', titulo: `${bajoStock} producto(s) con stock bajo`, desc: 'Menos de 5 unidades disponibles' });
    }
    if (cuentasPendientes > 0) {
      list.push({ tipo: 'warning', titulo: `${cuentasPendientes} cuenta(s) por cobrar`, desc: `Total pendiente: ₡${metrics.totalPorCobrar.toLocaleString('es-CR')}` });
    }

    const totalAlertas = (sinStock > 0 ? 1 : 0) + (cuentasPendientes > 0 ? 1 : 0) + (prestamosPendientes > 0 ? 1 : 0);

    return {
      cobrosStatus: cuentasPendientes > 0 ? { label: `${cuentasPendientes} pendientes`, color: 'amber' } : { label: 'Al día', color: 'green' },
      prestamosStatus: prestamosPendientes > 0 ? { label: `${prestamosPendientes} abiertos`, color: 'amber' } : { label: 'Sin atrasos', color: 'green' },
      stockStatus: sinStock > 0 ? { label: 'Crítico', color: 'red' } : (bajoStock > 0 ? { label: 'Atención', color: 'amber' } : { label: 'Normal', color: 'green' }),
      hasAlerts: list.length > 0,
      alertList: list,
      resumenGeneral: totalAlertas === 0
        ? 'No hay préstamos atrasados, cobros vencidos ni stock crítico en este momento.'
        : `Hay ${totalAlertas} área(s) operativa(s) con movimientos o atención requerida.`
    };
  }, [metrics]);

  return (
    <section className="card-glass alerts-section" id="dashboard-alerts-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="icon-circle-badge shield-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <h3 className="card-heading">Atención y Semaforización</h3>
            <p className="card-subheading">Estado operativo y alertas</p>
          </div>
        </div>
      </div>

      <div className="alerts-body">
        {/* Estado General */}
        <div className={`status-general-card ${hasAlerts ? 'status-alert-active' : ''}`}>
          <div className="status-general-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div className="status-general-texts">
            <span className="status-general-title">
              {hasAlerts ? 'Atención Requerida' : 'Operaciones al Día'}
            </span>
            <p className="status-general-desc">
              {resumenGeneral}
            </p>
          </div>
        </div>

        {/* Mini-Panel de Semáforos de 3 Columnas */}
        <div className="mini-semaphores-grid">
          <div className="semaphore-item">
            <span className="semaphore-label">Cobros</span>
            <div className="semaphore-value-row">
              <span className={`semaphore-dot dot-${cobrosStatus.color}`} />
              <span className="semaphore-value">{cobrosStatus.label}</span>
            </div>
          </div>

          <div className="semaphore-item">
            <span className="semaphore-label">Préstamos</span>
            <div className="semaphore-value-row">
              <span className={`semaphore-dot dot-${prestamosStatus.color}`} />
              <span className="semaphore-value">{prestamosStatus.label}</span>
            </div>
          </div>

          <div className="semaphore-item">
            <span className="semaphore-label">Stock</span>
            <div className="semaphore-value-row">
              <span className={`semaphore-dot dot-${stockStatus.color}`} />
              <span className="semaphore-value">{stockStatus.label}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
