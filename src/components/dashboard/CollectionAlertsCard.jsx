import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { obtenerNotificacionesCobro } from '../../services/cobroNotificationService';

export default function CollectionAlertsCard() {
  const { metrics = {} } = useDashboard?.() || {};

  const notificaciones = useMemo(() => {
    return obtenerNotificacionesCobro({
      prestamos: metrics?.listaPrestamos || [],
      pedidos: metrics?.listaPedidos || [],
      pagos: metrics?.listaPagos || []
    });
  }, [metrics?.listaPrestamos, metrics?.listaPedidos, metrics?.listaPagos]);

  const conteoAtrasados = notificaciones.filter((n) => n.vencimiento === 'atrasado').length;
  const conteoHoy = notificaciones.filter((n) => n.vencimiento === 'hoy').length;
  const conteoManana = notificaciones.filter((n) => n.vencimiento === 'manana').length;

  return (
    <section
      className="card-glass collection-alerts-card"
      id="dashboard-collection-alerts-card"
      aria-label="Notificaciones de cobro y vencimientos de cuotas"
    >
      {/* Cabecera destacada del recuadro */}
      <div className="card-header">
        <div className="card-title-group">
          <div className="icon-circle-badge collection-crimson-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div>
            <h3 className="card-heading">Avisos de Cobro</h3>
            <p className="card-subheading">Gestión de cuotas y recordatorios</p>
          </div>
        </div>

        {notificaciones.length > 0 && (
          <div className="collection-header-badges">
            {conteoAtrasados > 0 && (
              <span className="badge-count badge-count-urgent" title="Cuotas atrasadas">
                {conteoAtrasados} atrasado{conteoAtrasados > 1 ? 's' : ''}
              </span>
            )}
            {(conteoHoy > 0 || conteoManana > 0) && (
              <span className="badge-count badge-count-pending" title="Vencimientos hoy o mañana">
                {conteoHoy + conteoManana} por vencer
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cuerpo del listado */}
      <div className="collection-alerts-body custom-scrollbar" id="collection-alerts-list">
        {notificaciones.length === 0 ? (
          <div className="collection-empty-state">
            <div className="collection-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="collection-empty-title">Cobros al Día</p>
            <span className="collection-empty-desc">
              No hay cuotas atrasadas ni vencimientos programados para hoy o mañana.
            </span>
          </div>
        ) : (
          <div className="collection-items-list">
            {notificaciones.map((item) => {
              const inicial = item.clienteNombre ? item.clienteNombre.charAt(0).toUpperCase() : 'C';

              return (
                <div
                  key={item.id}
                  className={`collection-item-card item-urgency-${item.vencimiento}`}
                  id={`item-${item.id}`}
                >
                  <div className="collection-item-top">
                    <div className="collection-avatar">{inicial}</div>
                    <div className="collection-info-main">
                      <div className="collection-name-row">
                        <span className="collection-client-name" title={item.clienteNombre}>
                          {item.clienteNombre}
                        </span>

                        {item.vencimiento === 'atrasado' && (
                          <span className="badge-pill-urgency badge-atrasado">
                            <span className="pulse-dot red-dot"></span>
                            Atrasado
                          </span>
                        )}
                        {item.vencimiento === 'hoy' && (
                          <span className="badge-pill-urgency badge-hoy">
                            <span className="pulse-dot amber-dot"></span>
                            Vence Hoy
                          </span>
                        )}
                        {item.vencimiento === 'manana' && (
                          <span className="badge-pill-urgency badge-manana">
                            Mañana
                          </span>
                        )}
                      </div>

                      <div className="collection-detail-row">
                        <span className="collection-concept-text">{item.concepto}</span>
                      </div>
                    </div>
                  </div>

                  <div className="collection-item-bottom">
                    <div className="collection-amount-block">
                      <span className="collection-amount-label">Monto a pagar:</span>
                      <span className="collection-amount-value">{item.montoCobroFormateado}</span>
                    </div>

                    {item.linkWhatsApp && item.linkWhatsApp !== '#' ? (
                      <a
                        href={item.linkWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-collection-whatsapp"
                        title={`Cobrar por WhatsApp a ${item.clienteNombre}`}
                        aria-label={`Cobrar por WhatsApp a ${item.clienteNombre}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span>Cobrar</span>
                      </a>
                    ) : (
                      <span className="collection-no-phone">Sin teléfono</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
