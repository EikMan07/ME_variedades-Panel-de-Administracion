import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import { ROUTES } from './paths';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ClientesPage from '../pages/ClientesPage';
import ProductosPage from '../pages/ProductosPage';
import PedidosPage from '../pages/PedidosPage';
import PagosPage from '../pages/PagosPage';
import CobrosPage from '../pages/CobrosPage';
import PrestamosPage from '../pages/PrestamosPage';
import FacturasPage from '../pages/FacturasPage';

/**
 * Enrutador modular principal de la aplicación.
 */
export default function AppRoutes() {
  return (
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

      {/* Redireccion por defecto */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
