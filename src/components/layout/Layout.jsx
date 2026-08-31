import Sidebar from './Sidebar';
import Chatbot from '../chatbot/Chatbot';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const { isSidebarCollapsed, isSidebarMobileOpen, closeMobileSidebar } = useAuth();

  return (
    <div className={`app-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />

      {/* Overlay para cerrar sidebar en móviles */}
      <div
        className={`sidebar-overlay ${isSidebarMobileOpen ? 'active' : ''}`}
        onClick={closeMobileSidebar}
      />

      <div className="app-main-wrapper">
        {children}

        <footer className="app-footer">
          <p>© 2026 ME Variedades — Plataforma de Administración Digital. Desarrollado para María.</p>
          <div className="footer-links">
            <span className="system-status-indicator">
              <span className="dot-online" /> Sistema Operativo
            </span>
          </div>
        </footer>
      </div>

      {/* Widget de Asistente Virtual Global */}
      <Chatbot />
    </div>
  );
}
