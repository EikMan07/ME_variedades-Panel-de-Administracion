import Topbar from '../components/layout/Topbar';
import { useAuth } from '../context/AuthContext';
import KPICards from '../components/dashboard/KPICards';
import AnalyticsChartSection from '../components/dashboard/AnalyticsChartSection';
import StockDistributionCard from '../components/dashboard/StockDistributionCard';
import ClientHighlightKPI from '../components/dashboard/ClientHighlightKPI';
import BirthdayCard from '../components/dashboard/BirthdayCard';
import AlertsCard from '../components/dashboard/AlertsCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user || localStorage.getItem('user_name') || sessionStorage.getItem('usuario_activo') || 'María';

  return (
    <>
      <Topbar breadcrumb="Centro de Comando" />

      <main className="dashboard-content">
        {/* Encabezado de Bienvenida Moderno y Profesional */}
        <header className="dashboard-greeting-header">
          <div className="greeting-content">
            <div className="greeting-badge">
              <svg className="greeting-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="greeting-role">Sesión Activa • Panel de Administración</span>
            </div>
            <h1 className="greeting-title">
              Bienvenida, <span id="current-user-name" className="greeting-highlight">{userName}</span>
            </h1>
            <p className="greeting-subtitle">
              <svg className="subtitle-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="18" y2="10"></line>
              </svg>
              Resumen operativo y estado general del negocio para la jornada actual.
            </p>
          </div>
        </header>

        {/* Layout Command Center: 2 Columnas Principales (1fr y 340px) */}
        <div className="command-center-grid">
          {/* Columna Izquierda: Área Principal de Operaciones y Gráficas */}
          <div className="command-col-main">
            {/* Fila de 4 KPIs Horizontales */}
            <KPICards />

            {/* Tarjeta Principal de Análisis Gráfico */}
            <AnalyticsChartSection />

            {/* Tarjeta Inferior de Distribución de Inventario */}
            <StockDistributionCard />
          </div>

          {/* Columna Derecha: Barra Lateral de Control y Alertas CRM (340px) */}
          <div className="command-col-sidebar">
            {/* KPI Destacado: Total Clientes */}
            <ClientHighlightKPI />

            {/* Widget: Cumpleaños del Mes */}
            <BirthdayCard />

            {/* Widget: Atención y Semaforización */}
            <AlertsCard />

            {/* Widget: Últimas Transacciones */}
            <RecentActivityCard />
          </div>
        </div>
      </main>
    </>
  );
}
