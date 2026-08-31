import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationIcons } from './NotificationIcons';

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
  } = useNotifications();

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const bellBtn = document.getElementById('btn-notifications');
        if (bellBtn && bellBtn.contains(e.target)) return;
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  if (!isOpen) return null;

  const handleActionClick = (notif) => {
    marcarComoLeida(notif.id);
    if (notif.accion === 'whatsapp' && notif.telefono) {
      const telLimpio = notif.telefono.replace(/[^0-9]/g, '');
      const numCompleto = telLimpio.startsWith('506') ? telLimpio : `506${telLimpio}`;
      const msg = encodeURIComponent(
        `Estimado cliente, en ME Variedades le deseamos un feliz cumpleaños.`
      );
      window.open(`https://wa.me/${numCompleto}?text=${msg}`, '_blank');
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
                      <h5>{item.titulo}</h5>
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

                    {item.accion === 'whatsapp' && item.telefono && (
                      <div className="notif-item-footer">
                        <button
                          type="button"
                          className="notif-action-link whatsapp"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(item);
                          }}
                        >
                          {NotificationIcons.whatsapp}
                          <span>Enviar felicitación</span>
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
