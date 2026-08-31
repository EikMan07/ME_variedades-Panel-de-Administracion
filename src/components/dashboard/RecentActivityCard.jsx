import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useNavigate } from 'react-router-dom';

export default function RecentActivityCard() {
  const { metrics = {} } = useDashboard?.() || {};
  const navigate = useNavigate();

  const actividades = useMemo(() => {
    const feed = [];

    // 1. Pedidos recientes
    (metrics?.listaPedidos || []).slice(0, 3).forEach((p, idx) => {
      feed.push({
        id: `ped-${p.id || idx}`,
        fecha: p.created_at || p.fecha_registro || new Date().toISOString(),
        titulo: `Pedido #${p.id} • ${p.cliente_nombre || 'Cliente'}`,
        tiempo: p.created_at ? new Date(p.created_at).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' }) : 'Reciente',
        badge: `₡${(Number(p.total) || 0).toLocaleString('es-CR')}`,
        badgeClass: 'badge-purple',
        route: '/pedidos',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        ),
        iconColor: '#a855f7'
      });
    });

    // 2. Pagos / Cuentas recientes
    (metrics.listaPagos || []).slice(0, 2).forEach((pago, idx) => {
      feed.push({
        id: `pago-${pago.id || idx}`,
        fecha: pago.created_at || new Date().toISOString(),
        titulo: `Cuenta • ${pago.cliente_nombre || 'Cliente'}`,
        tiempo: pago.fecha_acordada || 'Acordada',
        badge: pago.saldo_pendiente <= 0 ? 'Saldado' : `Saldo ₡${(Number(pago.saldo_pendiente) || 0).toLocaleString('es-CR')}`,
        badgeClass: pago.saldo_pendiente <= 0 ? 'badge-green' : 'badge-amber',
        route: '/pagos',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        ),
        iconColor: 'var(--color-exito)'
      });
    });

    // 3. Préstamos recientes
    (metrics.listaPrestamos || []).slice(0, 2).forEach((pr, idx) => {
      feed.push({
        id: `prest-${pr.id || idx}`,
        fecha: pr.created_at || new Date().toISOString(),
        titulo: `Préstamo • ${pr.beneficiario_nombre || 'Beneficiario'}`,
        tiempo: pr.fecha_entrega || 'Activo',
        badge: `₡${(Number(pr.monto_capital) || 0).toLocaleString('es-CR')}`,
        badgeClass: 'badge-amber',
        route: '/prestamos',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        ),
        iconColor: 'var(--color-dorado)'
      });
    });

    // Si no hay registros aún, mostrar items informativos del sistema
    if (feed.length === 0) {
      feed.push(
        {
          id: 'sys-1',
          titulo: 'Directorio de Clientes Sincronizado',
          tiempo: 'En vivo',
          badge: `${metrics.totalClientes} Clientes`,
          badgeClass: 'badge-green',
          route: '/clientes',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
          ),
          iconColor: 'var(--color-exito)'
        },
        {
          id: 'sys-2',
          titulo: 'Inventario de Productos Activo',
          tiempo: 'En vivo',
          badge: `${metrics.totalStockUnidades} Unids.`,
          badgeClass: 'badge-amber',
          route: '/productos',
          icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          ),
          iconColor: 'var(--color-dorado)'
        }
      );
    }

    return feed.slice(0, 4);
  }, [metrics]);

  return (
    <section className="card-glass recent-activity-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="icon-circle-badge purple-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <h3 className="card-heading">Últimas Transacciones</h3>
            <p className="card-subheading">Registro de actividad en tiempo real</p>
          </div>
        </div>
      </div>

      <div className="activity-feed" id="recent-activity-feed">
        {actividades.map((act) => (
          <div
            key={act.id}
            className="activity-item-row"
            onClick={() => act.route && navigate(act.route)}
            style={{ cursor: act.route ? 'pointer' : 'default' }}
            title={act.route ? `Ir a módulo ${act.route}` : ''}
          >
            <div
              className="activity-icon-badge"
              style={{ color: act.iconColor }}
            >
              {act.icon}
            </div>
            <div className="activity-details">
              <span className="activity-title">{act.titulo}</span>
              <span className="activity-time">{act.tiempo}</span>
            </div>
            <span className={`kpi-badge-pill ${act.badgeClass}`}>{act.badge}</span>
          </div>
        ))}
      </div>

      <div className="activity-card-footer">
        <button
          type="button"
          className="link-view-all-history"
          onClick={() => navigate('/pedidos')}
        >
          <span>Ver todo el historial</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>
  );
}
