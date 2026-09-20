import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/paths';
import logoImg from '../assets/logo-me-variedades.png';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(143, 75, 93, 0.18) 0%, #121012 70%)',
      padding: '1.5rem',
      boxSizing: 'border-box',
      fontFamily: "'Montserrat', sans-serif"
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'rgba(28, 23, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(244, 180, 200, 0.22)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(224, 166, 181, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo de Marca */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          padding: '3px',
          background: 'linear-gradient(135deg, #e0a6b5 0%, #5e2f3d 100%)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={logoImg} alt="Logo ME Variedades" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {/* Indicador de Código de Error 404 */}
        <div style={{
          fontSize: '5rem',
          fontWeight: '900',
          letterSpacing: '0.05em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #f3d2d9 0%, #e0a6b5 50%, #8f4b5d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem',
          filter: 'drop-shadow(0 4px 12px rgba(224, 166, 181, 0.2))'
        }}>
          404
        </div>

        {/* Badge Conceptual */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.85rem',
          borderRadius: '999px',
          background: 'rgba(224, 166, 181, 0.12)',
          border: '1px solid rgba(224, 166, 181, 0.3)',
          color: '#f3d2d9',
          fontSize: '0.78rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Esta ruta no existe en el sistema
        </div>

        {/* Título y Mensaje */}
        <h1 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 0.75rem 0'
        }}>
          Página No Encontrada
        </h1>
        <p style={{
          fontSize: '0.92rem',
          color: '#d4c4c8',
          lineHeight: 1.55,
          margin: '0 0 1.75rem 0',
          maxWidth: '420px'
        }}>
          La dirección que intentas abrir no corresponde a ningún módulo disponible en <strong>ME Variedades</strong> o fue movida en una actualización.
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

          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: '1 1 140px',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(244, 180, 200, 0.2)',
              color: '#f3d2d9',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
}
