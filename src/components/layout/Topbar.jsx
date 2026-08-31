import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import logoImg from '../../assets/logo ME variedades.png';

export default function Topbar({
  breadcrumb = 'Centro de Comando',
  rightActions = null
}) {
  const { toggleSidebar } = useAuth();
  const { unreadCount, toggleDropdown, isOpen } = useNotifications();

  const fechaFormateada = useMemo(() => {
    const hoy = new Date();
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = hoy.toLocaleDateString('es-ES', opciones);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          id="btn-sidebar-toggle"
          className="btn-hamburger"
          onClick={toggleSidebar}
          aria-label="Abrir menú de navegación"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {/* Breadcrumb Contextual */}
        <div className="topbar-breadcrumb topbar-brand-breadcrumb">
          <div className="breadcrumb-logo-circle">
            <img src={logoImg} alt="ME Variedades" className="breadcrumb-logo-img topbar-logo-img" />
          </div>
          <div className="breadcrumb-text topbar-titles-wrapper">
            <span className="breadcrumb-brand brand-prefix-text">ME VARIEDADES</span>
            <span className="breadcrumb-separator">/</span>
            <h1 className="breadcrumb-current current-module-title">{breadcrumb}</h1>
          </div>
        </div>
      </div>

      <div className="topbar-right" style={{ position: 'relative' }}>
        {rightActions}

        <div className="date-badge" id="current-date-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{fechaFormateada}</span>
        </div>

        {/* Campana de Notificaciones con Badge */}
        <div className="notif-bell-container" style={{ position: 'relative', marginRight: 0 }}>
          <button
            id="btn-notifications"
            className={`btn-topbar-action ${isOpen ? 'active' : ''}`}
            title={unreadCount > 0 ? `${unreadCount} notificaciones pendientes` : 'Notificaciones'}
            aria-label="Ver alertas pendientes"
            onClick={toggleDropdown}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* Panel Flotante de Notificaciones */}
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
