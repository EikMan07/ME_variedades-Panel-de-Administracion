import { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return sessionStorage.getItem('usuario_activo') || null;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('me_sidebar_collapsed') === 'true';
  });

  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('usuario_activo', user);
    } else {
      sessionStorage.removeItem('usuario_activo');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('me_sidebar_collapsed', isSidebarCollapsed ? 'true' : 'false');
    if (isSidebarCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isSidebarCollapsed]);

  const login = (usuario, contrasena) => {
    const usuarioLimpio = (usuario || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Autenticación estricta: ÚNICA Y EXCLUSIVAMENTE usuario "maria" con contraseña "DSE777"
    const esAdminValido = (
      (usuarioLimpio === 'maria' || usuarioLimpio === 'maria@mevariedades.com') &&
      contrasena === 'DSE777'
    );

    if (esAdminValido) {
      setUser('María');
      return { success: true };
    } else {
      throw new Error('Usuario o contraseña incorrectos. Por favor intenta de nuevo.');
    }
  };

  const loginWithFace = (nombreIdentificado) => {
    const nombre = nombreIdentificado || 'María';
    setUser(nombre);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('usuario_activo');
    localStorage.removeItem('me_sidebar_collapsed');
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setIsSidebarMobileOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const closeMobileSidebar = () => {
    setIsSidebarMobileOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSidebarCollapsed,
        isSidebarMobileOpen,
        login,
        loginWithFace,
        logout,
        toggleSidebar,
        closeMobileSidebar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
