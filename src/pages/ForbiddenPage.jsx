import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import logoImg from '../assets/logo-me-variedades.png';

export default function ForbiddenPage() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.14) 0%, #121012 70%)',
      padding: '1.5rem',
      boxSizing: 'border-box',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'rgba(28, 20, 22, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo de Marca con anillo de seguridad carmesí/ámbar */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          padding: '3px',
          background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={logoImg} alt="Logo ME Variedades" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {/* Indicador de Código de Error 403 */}
        <div style={{
          fontSize: '5rem',
          fontWeight: '900',
          letterSpacing: '0.05em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #fca5a5 0%, #ef4444 50%, #991b1b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))'
        }}>
          403
        </div>

        {/* Badge Conceptual (Distinto de 404) */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.95rem',
          borderRadius: '999px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          color: '#fca5a5',
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem'
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Esta sección existe, pero no es para ti
        </div>

        {/* Título y Mensaje */}
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 0.75rem 0'
        }}>
          Acceso Restringido
        </h1>
        <p style={{
          fontSize: '0.92rem',
          color: '#e2d4d8',
          lineHeight: 1.55,
          margin: '0 0 1.75rem 0',
          maxWidth: '430px'
        }}>
          El módulo al que intentas entrar existe en la plataforma de <strong>ME Variedades</strong>, pero tu sesión actual no tiene los privilegios de administración requeridos para visualizarlo.
        </p>

        {/* Botones de Navegación */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.85rem',
          justifyContent: 'center',
          width: '100%'
        }}>
          <Link
            to={ROUTES.DASHBOARD}
            style={{
              flex: '1 1 180px',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8f4b5d 0%, #5e2f3d 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(94, 47, 61, 0.4)',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(244, 180, 200, 0.3)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Ir al Dashboard
          </Link>

          <Link
            to={ROUTES.LOGIN}
            style={{
              flex: '1 1 150px',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontWeight: 600,
              fontSize: '0.88rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Cambiar de cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
