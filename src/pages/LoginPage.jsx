import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/common/AnimatedBackground';
import FaceLoginModal from '../components/biometrics/FaceLoginModal';
import FaceEnrollModal from '../components/biometrics/FaceEnrollModal';
import { AuthVerifyingScreen } from '../components/biometrics/AuthVerifyingScreen';
import logoImg from '../assets/logo ME variedades.png';

export default function LoginPage() {
  const { login, loginWithFace } = useAuth();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  const [errorUsuario, setErrorUsuario] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');

  // Modales Biométricos
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorGlobal('');
    setErrorUsuario('');
    setErrorContrasena('');

    let valido = true;
    if (!usuario.trim()) {
      setErrorUsuario('El usuario es obligatorio.');
      valido = false;
    }
    if (!contrasena) {
      setErrorContrasena('La contraseña es obligatoria.');
      valido = false;
    }
    if (!valido) return;

    setCargando(true);
    try {
      login(usuario, contrasena);
      setIsVerifying(true);
    } catch (err) {
      setErrorGlobal(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const handleFaceLoginSuccess = (nombreIdentificado) => {
    loginWithFace(nombreIdentificado);
    setShowFaceLogin(false);
    setIsVerifying(true);
  };

  const handleFaceLoginClose = (action) => {
    setShowFaceLogin(false);
    if (action === 'OPEN_ENROLL') {
      setShowFaceEnroll(true);
    }
  };

  return (
    <div className="login-wrapper-page">
      {/* Fondo animado interactivo en Canvas (Partículas de Polvo Estelar) */}
      <AnimatedBackground />

      <main className="login-container">
        {/* Sección Izquierda: Texto de Bienvenida */}
        <section className="login-welcome login-hero-container">
          <h2 className="welcome-top login-subtitle-prefix">BIENVENIDA AL</h2>
          <h1 className="welcome-main login-main-title">PANEL DE CONTROL</h1>
          <div className="welcome-sub login-badge-role">
            ADMINISTRADOR DE ME VARIEDADES
          </div>
          <p className="welcome-desc login-description-text">
            Accede a tus herramientas de gestión exclusivas con tus credenciales o biometría facial.
          </p>
        </section>

        {/* Sección Derecha: Login Card */}
        <section className="login-form-wrapper">
          <div className="login-card">
            {/* Logo circular estilo premium */}
            <div className="logo-circular">
              <img src={logoImg} alt="Logo ME Variedades" className="brand-logo-img" />
            </div>

            {/* Error global */}
            {errorGlobal && (
              <div id="error-global" className="alerta-error" role="alert" aria-live="assertive">
                <svg aria-hidden="true" className="alerta-icono" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{errorGlobal}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="grupo-campo">
                <label htmlFor="usuario" className="etiqueta">
                  Usuario
                </label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  className={`input ${errorUsuario ? 'input-error' : ''}`}
                  placeholder="Ej. maria_admin"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value);
                    if (errorUsuario) setErrorUsuario('');
                    if (errorGlobal) setErrorGlobal('');
                  }}
                  disabled={cargando}
                />
                {errorUsuario && (
                  <span className="texto-error" role="alert">
                    {errorUsuario}
                  </span>
                )}
              </div>

              <div className="grupo-campo">
                <label htmlFor="contrasena" className="etiqueta">
                  Contraseña
                </label>
                <div className="contenedor-contrasena">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="contrasena"
                    name="contrasena"
                    className={`input input-contrasena ${errorContrasena ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={contrasena}
                    onChange={(e) => {
                      setContrasena(e.target.value);
                      if (errorContrasena) setErrorContrasena('');
                      if (errorGlobal) setErrorGlobal('');
                    }}
                    disabled={cargando}
                  />
                  <button
                    type="button"
                    className="boton-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {errorContrasena && (
                  <span className="texto-error" role="alert">
                    {errorContrasena}
                  </span>
                )}
              </div>

              <button
                type="submit"
                id="btn-submit"
                className="boton-submit"
                disabled={cargando}
              >
                <span>{cargando ? 'Iniciando sesión...' : 'ACCEDER'}</span>
              </button>
            </form>

            {/* Divisor Biométrico */}
            <div className="divisor-login">
              <span>o accede sin contraseñas</span>
            </div>

            {/* Botón de Reconocimiento Facial */}
            <button
              type="button"
              className="boton-face-id"
              onClick={() => setShowFaceLogin(true)}
            >
              <svg className="face-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3H5a2 2 0 0 0-2 2v2m18-4h-2a2 2 0 0 0-2-2m-14 18H5a2 2 0 0 1-2-2v-2m18 4h-2a2 2 0 0 1-2-2v-2"></path>
                <circle cx="9" cy="9" r="1"></circle>
                <circle cx="15" cy="9" r="1"></circle>
                <path d="M10 15h4"></path>
              </svg>
              <span>Ingresar con Rostro</span>
            </button>

            {/* Enlace para registrar rostro */}
            <div className="enroll-link-container">
              <button
                type="button"
                className="btn-link-enroll"
                onClick={() => setShowFaceEnroll(true)}
              >
                ¿Aún no registras tu rostro? <strong>Enrolar Biometría Facial</strong>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Login Facial */}
      <FaceLoginModal
        isOpen={showFaceLogin}
        onClose={handleFaceLoginClose}
        onSuccess={handleFaceLoginSuccess}
      />

      {/* Modal: Enrolamiento Biométrico */}
      <FaceEnrollModal
        isOpen={showFaceEnroll}
        onClose={() => setShowFaceEnroll(false)}
        onEnrolled={() => {
          // Callback tras registrar rostro
        }}
      />

      {/* Pantalla de Transición y Verificación de Seguridad */}
      {isVerifying && (
        <AuthVerifyingScreen onFinish={() => navigate('/')} />
      )}
    </div>
  );
}
