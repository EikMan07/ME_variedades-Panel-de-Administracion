import { useState, useEffect } from 'react';

export const AuthVerifyingScreen = ({ onFinish }) => {
  const [etapa, setEtapa] = useState('escaneando'); // 'escaneando' -> 'aprobado'

  useEffect(() => {
    // A los 850ms cambia a estado aprobado
    const timer1 = setTimeout(() => {
      setEtapa('aprobado');
    }, 850);

    // A los 1650ms completa la animación y monta el dashboard
    const timer2 = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div className="auth-verifying-fullscreen" role="alert" aria-live="polite">
      <div className="auth-verifying-box">
        {/* Contenedor del Escudo / Spinner Vectorial */}
        <div className={`auth-security-badge ${etapa}`}>
          <div className="auth-glow-ring"></div>
          {etapa === 'escaneando' ? (
            <svg className="auth-circular-spinner" viewBox="0 0 50 50">
              <circle className="auth-spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="3" />
              <circle className="auth-spinner-head" cx="25" cy="25" r="20" fill="none" strokeWidth="3.5" />
            </svg>
          ) : (
            <svg className="auth-success-check" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </div>

        {/* Textos de Estado */}
        <div className="auth-verifying-labels">
          <h3>
            {etapa === 'escaneando' ? 'Verificando Credenciales...' : 'Acceso Autorizado'}
          </h3>
          <p>
            {etapa === 'escaneando' 
              ? 'Validando firma de seguridad del administrador' 
              : 'Iniciando sesión en Centro de Comando ME Variedades'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthVerifyingScreen;
