import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationIcons } from './NotificationIcons';
import { generarLinkWhatsApp } from '../../utils/utils';

export default function NotificationDropdown() {
  const {
    listaPendientes,
    listaHistorial,
    isOpen,
    tabActiva,
    setTabActiva,
    closeDropdown,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    vaciarHistorial,
    probandoWhatsApp,
    probarAlertaWhatsApp,
  } = useNotifications();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [testFeedback, setTestFeedback] = useState(null);

  // Cerrar al hacer clic fuera o presionar tecla Escape (Esc)
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const bellBtn = document.getElementById('btn-notifications');
        if (bellBtn && bellBtn.contains(e.target)) return;
        closeDropdown();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDropdown]);

  if (!isOpen) return null;

  const handleProbarWhatsApp = async () => {
    setTestFeedback(null);
    const resultado = await probarAlertaWhatsApp();
    if (resultado.ok) {
      setTestFeedback({
        ok: true,
        msg: '¡Alerta de prueba enviada a tu WhatsApp con éxito!'
      });
    } else {
      setTestFeedback({
        ok: false,
        msg: resultado.error || 'No se pudo enviar. Verifica tus credenciales de CallMeBot.'
      });
    }
    setTimeout(() => {
      setTestFeedback(null);
    }, 7000);
  };

  const handleActionClick = (notif) => {
    marcarComoLeida(notif.id);
    if (notif.accion === 'whatsapp_cobro' && notif.linkWhatsApp) {
      window.open(notif.linkWhatsApp, '_blank');
    } else if (notif.tipo === 'cumpleanos') {
      const url = notif.linkWhatsApp || (notif.telefono ? generarLinkWhatsApp(
        notif.telefono,
        `¡Hola ${notif.clienteNombre || 'estimado cliente'}! En ME Variedades te deseamos un muy feliz cumpleaños 🎉🎂`
      ) : null);
      if (url && url !== '#') {
        window.open(url, '_blank');
      }
    } else if (notif.link) {
      navigate(notif.link);
      closeDropdown();
    }
  };

  return (
    <aside
      className="notif-dropdown card-glass notifications-dropdown-menu"
      ref={dropdownRef}
      role="region"
      aria-label="Centro de Notificaciones y Alertas"
      id="notifications-panel"
    >
      {/* Cabecera del panel */}
      <div className="notif-dropdown-header">
        <div className="notif-header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notif-title-text">Notificaciones</span>
        </div>

        {tabActiva === 'pendientes' && listaPendientes.length > 0 && (
          <button
            type="button"
            className="btn-notif-header-action"
            onClick={marcarTodasComoLeidas}
            title="Marcar todas como leídas"
          >
            {NotificationIcons.check_all}
            <span>Marcar leídas</span>
          </button>
        )}

        {tabActiva === 'historial' && listaHistorial.length > 0 && (
          <button
            type="button"
            className="btn-notif-header-action btn-danger-action"
            onClick={vaciarHistorial}
            title="Vaciar todo el historial"
          >
            {NotificationIcons.trash}
            <span>Vaciar historial</span>
          </button>
        )}
      </div>

      {/* Selector de Pestañas */}
      <div className="notif-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'pendientes'}
          className={`notif-tab-btn ${tabActiva === 'pendientes' ? 'active' : ''}`}
          onClick={() => setTabActiva('pendientes')}
        >
          <span>Pendientes</span>
          {listaPendientes.length > 0 && (
            <span className="notif-tab-pill">{listaPendientes.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'historial'}
          className={`notif-tab-btn ${tabActiva === 'historial' ? 'active' : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <span>Historial</span>
          <span className="notif-tab-pill-neutral">{listaHistorial.length}</span>
        </button>
      </div>

      {/* Barra de Utilidad: Prueba Rápida de WhatsApp */}
      <div className="notif-whatsapp-test-bar" style={{
        padding: '0.45rem 0.85rem',
        background: 'rgba(37, 211, 102, 0.06)',
        borderBottom: '1px solid rgba(37, 211, 102, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
      }}>
        <button
          type="button"
          onClick={handleProbarWhatsApp}
          disabled={probandoWhatsApp}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            width: '100%',
            height: '32px',
            background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.2), rgba(18, 140, 126, 0.25))',
            border: '1px solid rgba(37, 211, 102, 0.35)',
            borderRadius: '6px',
            color: '#4ade80',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: probandoWhatsApp ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Envía una alerta de prueba inmediata a tu número de WhatsApp"
        >
          {NotificationIcons.whatsapp}
          <span>{probandoWhatsApp ? 'Enviando alerta a WhatsApp...' : 'Probar alerta a mi WhatsApp'}</span>
        </button>

        {testFeedback && (
          <div style={{
            fontSize: '0.72rem',
            padding: '0.3rem 0.5rem',
            borderRadius: '4px',
            background: testFeedback.ok ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${testFeedback.ok ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: testFeedback.ok ? '#86efac' : '#fca5a5',
            lineHeight: 1.3
          }}>
            {testFeedback.msg}
          </div>
        )}
      </div>

      {/* Contenido de la Lista */}
      <div className="notif-dropdown-body custom-scrollbar">
        {/* Pestaña: PENDIENTES */}
        {tabActiva === 'pendientes' && (
          listaPendientes.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon">{NotificationIcons.inbox_empty}</div>
              <p className="notif-empty-title">Bandeja al día</p>
              <small className="notif-empty-subtitle">No hay alertas pendientes en este momento.</small>
            </div>
          ) : (
            <div className="notif-items-list">
              {listaPendientes.map((item) => (
                <div
                  key={item.id}
                  className={`notif-item-card notif-${item.tipo}`}
                  onClick={() => handleActionClick(item)}
                >
                  <div className="notif-item-icon-box">
                    {NotificationIcons[item.tipo] || NotificationIcons.inbox_empty}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <div className="notif-title-row">
                        <h5>{item.titulo}</h5>
                        {item.etiqueta && (
                          <span className={`notif-pill notif-pill-${item.vencimiento || item.prioridad}`}>
                            {item.etiqueta}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-icon-check"
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLeida(item.id);
                        }}
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                      >
                        {NotificationIcons.check_all}
                      </button>
                    </div>

                    <p>{item.mensaje}</p>

                    {/* Acciones directas por tipo de alerta */}
                    {item.accion === 'whatsapp_cobro' && item.linkWhatsApp && (
                      <div className="notif-item-footer">
                        <a
                          href={item.linkWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="notif-action-link whatsapp notif-btn-cobro"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarComoLeida(item.id);
                          }}
                          title={`Cobrar por WhatsApp a ${item.clienteNombre}`}
                        >
                          {NotificationIcons.whatsapp}
                          <span>Cobrar por WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {item.tipo === 'cumpleanos' && (
                      <div className="notif-item-footer">
                        <a
                          href={item.linkWhatsApp || (item.telefono ? generarLinkWhatsApp(item.telefono, `¡Hola ${item.clienteNombre || 'estimado cliente'}! En ME Variedades te deseamos un muy feliz cumpleaños 🎉🎂`) : '#')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="notif-action-link whatsapp notif-btn-felicitar"
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarComoLeida(item.id);
                          }}
                          title={`Felicitar por WhatsApp a ${item.clienteNombre || 'cliente'}`}
                        >
                          {NotificationIcons.whatsapp}
                          <span>Felicitar por WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {item.tipo === 'venta' && (
                      <div className="notif-item-footer">
                        <button
                          type="button"
                          className="notif-action-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(item);
                          }}
                        >
                          <span>Ver en Ventas →</span>
                        </button>
                      </div>
                    )}

                    {item.tipo === 'pago' && (
                      <div className="notif-item-footer">
                        <button
                          type="button"
                          className="notif-action-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(item);
                          }}
                        >
                          <span>Ver en Pagos →</span>
                        </button>
                      </div>
                    )}

                    {(item.tipo === 'stock_bajo' || item.tipo === 'stock_agotado') && (
                      <div className="notif-item-footer">
                        <button
                          type="button"
                          className="notif-action-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(item);
                          }}
                        >
                          <span>Ver Inventario →</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pestaña: HISTORIAL */}
        {tabActiva === 'historial' && (
          listaHistorial.length === 0 ? (
            <div className="notif-empty-state">
              <div className="notif-empty-icon opacity-50">{NotificationIcons.inbox_empty}</div>
              <p className="notif-empty-title">Historial vacío</p>
              <small className="notif-empty-subtitle">No hay notificaciones archivadas.</small>
            </div>
          ) : (
            <div className="notif-items-list">
              {listaHistorial.map((item) => (
                <div key={item.id} className="notif-item-card notif-item-archived">
                  <div className="notif-item-icon-box opacity-60">
                    {NotificationIcons[item.tipo] || NotificationIcons.inbox_empty}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-top">
                      <h5 className="text-muted">{item.titulo}</h5>
                      <button
                        type="button"
                        className="btn-icon-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarNotificacion(item.id);
                        }}
                        title="Eliminar del historial"
                        aria-label="Eliminar del historial"
                      >
                        {NotificationIcons.trash}
                      </button>
                    </div>
                    <p className="text-muted">{item.mensaje}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </aside>
  );
}
