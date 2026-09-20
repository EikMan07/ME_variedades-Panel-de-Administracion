import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClientProvider } from './context/ClientContext';
import { ProductProvider } from './context/ProductContext';
import { VentasProvider } from './context/VentasContext';
import { PagosProvider } from './context/PagosContext';
import { PrestamosProvider } from './context/PrestamosContext';
import { DashboardProvider } from './context/DashboardContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';
import { AppRoutes } from './routes';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ClientProvider>
            <ProductProvider>
              <VentasProvider>
                <PagosProvider>
                  <PrestamosProvider>
                    <DashboardProvider>
                      <NotificationProvider>
                        <AppRoutes />
                        <SpeedInsights />
                      </NotificationProvider>
                    </DashboardProvider>
                  </PrestamosProvider>
                </PagosProvider>
              </VentasProvider>
            </ProductProvider>
          </ClientProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

