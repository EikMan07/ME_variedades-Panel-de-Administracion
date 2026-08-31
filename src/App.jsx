import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClientProvider } from './context/ClientContext';
import { ProductProvider } from './context/ProductContext';
import { OrderProvider } from './context/OrderContext';
import { PagosProvider } from './context/PagosContext';
import { CobrosProvider } from './context/CobrosContext';
import { PrestamosProvider } from './context/PrestamosContext';
import { FacturasProvider } from './context/FacturasContext';
import { DashboardProvider } from './context/DashboardContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ClientProvider>
            <ProductProvider>
              <OrderProvider>
                <PagosProvider>
                  <CobrosProvider>
                    <PrestamosProvider>
                      <FacturasProvider>
                        <DashboardProvider>
                          <NotificationProvider>
                            <AppRoutes />
                          </NotificationProvider>
                        </DashboardProvider>
                      </FacturasProvider>
                    </PrestamosProvider>
                  </CobrosProvider>
                </PagosProvider>
              </OrderProvider>
            </ProductProvider>
          </ClientProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

