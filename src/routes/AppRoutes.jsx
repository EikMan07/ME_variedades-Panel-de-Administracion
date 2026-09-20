import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoutes from './PrivateRoutes';
import { ROUTES } from './paths';

// Code Splitting Dinámico con React.lazy para carga ultrarrápida
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ClientesPage = lazy(() => import('../pages/ClientesPage'));
const ProductosPage = lazy(() => import('../pages/ProductosPage'));
const VentasPage = lazy(() => import('../pages/VentasPage'));
const PagosPage = lazy(() => import('../pages/PagosPage'));
const PrestamosPage = lazy(() => import('../pages/PrestamosPage'));
const EstadoCuentaPage = lazy(() => import('../pages/EstadoCuentaPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'));

// Fallback de carga elegante y sin parpadeos
function PageLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
      gap: '1rem'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid rgba(244, 180, 200, 0.15)',
        borderTopColor: '#f4b4c8',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{
        fontSize: '0.88rem',
        color: '#a1a1aa',
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 500
      }}>
        Cargando módulo...
      </span>
    </div>
  );
}

/**
 * Enrutador modular principal de la aplicación optimizado con Code Splitting.
 * Implementa el patrón canónico con PrivateRoutes (guardián único + Layout persistente con Outlet).
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Ruta Pública de Autenticación */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Páginas de Estado HTTP y Seguridad (Acceso público/general) */}
        <Route path={ROUTES.FORBIDDEN} element={<ForbiddenPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

        {/* Redirección canónica de la raíz al Dashboard con nombre */}
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

        {/* Rutas Protegidas bajo el Guardián Único Reutilizable (PrivateRoutes) */}
        <Route element={<PrivateRoutes />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.CLIENTES} element={<ClientesPage />} />
          <Route path={ROUTES.PRODUCTOS} element={<ProductosPage />} />
          <Route path={ROUTES.VENTAS} element={<VentasPage />} />
          <Route path="/pedidos" element={<Navigate to={ROUTES.VENTAS} replace />} />
          <Route path={ROUTES.PAGOS} element={<PagosPage />} />
          <Route path={ROUTES.PRESTAMOS} element={<PrestamosPage />} />
          <Route path={ROUTES.ESTADO_CUENTA} element={<EstadoCuentaPage />} />
        </Route>

        {/* Comodín 404 para cualquier ruta inexistente */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
