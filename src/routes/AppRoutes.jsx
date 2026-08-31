import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import { ROUTES } from './paths';

// Code Splitting Dinámico con React.lazy para carga ultrarrápida
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ClientesPage = lazy(() => import('../pages/ClientesPage'));
const ProductosPage = lazy(() => import('../pages/ProductosPage'));
const PedidosPage = lazy(() => import('../pages/PedidosPage'));
const PagosPage = lazy(() => import('../pages/PagosPage'));
const CobrosPage = lazy(() => import('../pages/CobrosPage'));
const PrestamosPage = lazy(() => import('../pages/PrestamosPage'));
const FacturasPage = lazy(() => import('../pages/FacturasPage'));

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
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Ruta Pública de Autenticación */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Rutas Protegidas dentro del Layout SPA */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.CLIENTES}
          element={
            <ProtectedRoute>
              <Layout>
                <ClientesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.PRODUCTOS}
          element={
            <ProtectedRoute>
              <Layout>
                <ProductosPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.PEDIDOS}
          element={
            <ProtectedRoute>
              <Layout>
                <PedidosPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.PAGOS}
          element={
            <ProtectedRoute>
              <Layout>
                <PagosPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.COBROS}
          element={
            <ProtectedRoute>
              <Layout>
                <CobrosPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.PRESTAMOS}
          element={
            <ProtectedRoute>
              <Layout>
                <PrestamosPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.FACTURAS}
          element={
            <ProtectedRoute>
              <Layout>
                <FacturasPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}
