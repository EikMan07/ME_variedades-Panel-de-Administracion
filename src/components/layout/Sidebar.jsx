import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../routes/paths';
import Modal from '../common/Modal';
import logoImg from '../../assets/logo-me-variedades.png';

export default function Sidebar({ onOpenChatbot }) {
  const { user, isSidebarCollapsed, isSidebarMobileOpen, logout, closeMobileSidebar } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  const handleNavClick = () => {
    if (window.innerWidth <= 1024) {
      closeMobileSidebar();
    }
  };

  return (
    <>
      <aside
        id="app-sidebar"
        className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isSidebarMobileOpen ? 'open active' : ''}`}
        aria-label="Menú principal de navegación"
      >
        {/* Encabezado con Logo (Fijo Superior) */}
        <div className="sidebar-header">
          <NavLink to={ROUTES.DASHBOARD} className="sidebar-brand" onClick={handleNavClick}>
            <div className="brand-logo-circle">
              <img src={logoImg} alt="Logo ME Variedades" className="brand-logo-img" />
            </div>
            <div className="brand-text">
              <span className="brand-title">
                <span className="m-black">M</span>
                <span className="e-rose">E</span> VARIEDADES
              </span>
              <span className="brand-subtitle">Panel Administrativo</span>
            </div>
          </NavLink>
          <button
            id="btn-sidebar-close"
            className="btn-icon-mobile"
            onClick={closeMobileSidebar}
            aria-label="Cerrar menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Área Central de Navegación (Enlaces con Scroll Interno) */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">INICIO</div>
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink
                to={ROUTES.DASHBOARD}
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Dashboard"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span className="links_name">Dashboard</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-section-title">ADMINISTRACIÓN</div>
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink
                to="/clientes"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Clientes"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="links_name">Clientes</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/productos"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Productos e Inventario"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span className="links_name">Productos e Inventario</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-section-title">CAJA / TRANSACCIONES</div>
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink
                to="/ventas"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Ventas"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span className="links_name">Ventas</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/prestamos"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Préstamos a Terceros"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span className="links_name">Préstamos</span>
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink
                to="/pagos"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Pagos y Cuentas"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <span className="links_name">Pagos y Cuentas</span>
              </NavLink>
            </li>
          </ul>

          <div className="nav-section-title">CONSULTAS / REPORTES</div>
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink
                to="/estado-cuenta"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={handleNavClick}
                title="Estado de Cuenta"
              >
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  <line x1="8" y1="7" x2="16" y2="7"></line>
                  <line x1="8" y1="11" x2="16" y2="11"></line>
                </svg>
                <span className="links_name">Estado de Cuenta</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Sección Inferior (Asistencia, Perfil y Salir anclados con margin-top: auto) */}
        <div className="sidebar-bottom-section">
          <div className="sidebar-assistant-box">
            <div className="nav-section-title">ASISTENCIA</div>
            <button
              type="button"
              className="nav-link nav-link-ai"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
              title="Asistente Virtual IA"
              onClick={() => {
                if (onOpenChatbot) onOpenChatbot();
                handleNavClick();
              }}
            >
              <svg className="nav-icon ai-glow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
              </svg>
              <span className="links_name">Asistente IA</span>
              <span className="badge-ai">Online</span>
            </button>
          </div>

          {/* Perfil de Usuario y Logout */}
          <div className="sidebar-user">
            <div className="user-card" title={`Usuario: ${user || 'María'}`}>
              <div className="user-avatar">
                <span>{user ? user.charAt(0).toUpperCase() : 'M'}</span>
              </div>
              <div className="user-info">
                <span className="user-name">{user || 'María'}</span>
                <span className="user-role">Administradora</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-logout"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
              onClick={() => setShowLogoutModal(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Modal de Confirmación de Logout */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Cerrar Sesión"
        subtitle="Confirmación de salida del sistema"
        cardClassName="modal-card-sm"
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        }
        footer={
          <>
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={handleConfirmLogout}
            >
              <span>Cerrar Sesión</span>
            </button>
          </>
        }
      >
        <p className="modal-confirm-text">
          ¿Estás segura de que deseas cerrar tu sesión en <strong>ME Variedades</strong>?
        </p>
        <p className="modal-confirm-subtext">
          Tendrás que ingresar tus credenciales nuevamente para acceder al panel administrativo.
        </p>
      </Modal>
    </>
  );
}
