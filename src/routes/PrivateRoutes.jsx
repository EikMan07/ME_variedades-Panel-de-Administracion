import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import { ROUTES } from './paths';

/**
 * Guardián de rutas privadas (Patrón Práctica #1 de React Router).
 * Si no hay sesión activa, redirige a /login conservando la ubicación previa.
 * Si hay sesión, renderiza el Layout persistente con el <Outlet /> para sus rutas hijas.
 */
export default function PrivateRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
