import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';

export default function BirthdayCard() {
  const { metrics = {} } = useDashboard?.() || {};

  const { cumpleanerosMes, diaActual, mesNombre } = useMemo(() => {
    const hoy = new Date();
    const mesNum = hoy.getMonth() + 1;
    const diaNum = hoy.getDate();
    const nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const lista = Array.isArray(metrics?.cumpleanerosDelMes) ? [...metrics.cumpleanerosDelMes] : [];

    lista.sort((a, b) => {
      const diaA = Number(a.dia_cumpleanos || a.dia_cumple || a.dia) || 0;
      const diaB = Number(b.dia_cumpleanos || b.dia_cumple || b.dia) || 0;
      return diaA - diaB;
    });

    return {
      cumpleanerosMes: lista,
      diaActual: diaNum,
      mesNombre: nombresMeses[mesNum]
    };
  }, [metrics?.cumpleanerosDelMes]);

  return (
    <section className="card-glass birthday-card" id="dashboard-birthday-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="icon-circle-badge gold-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
          </div>
          <div>
            <h3 className="card-heading">Cumpleaños del Mes</h3>
            <p className="card-subheading">Gestión oportuna de gratificaciones</p>
          </div>
        </div>
        <span className="badge-count gold-badge-count" id="birthday-count-badge" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          {cumpleanerosMes.length} este mes
        </span>
      </div>

      <div className="birthday-list-container" id="birthday-list">
        {cumpleanerosMes.length === 0 ? (
          <div className="loading-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>No hay clientes registrados que cumplan años este mes.</span>
          </div>
        ) : (
          cumpleanerosMes.map((c) => {
            const diaCliente = Number(c.dia_cumpleanos || c.dia_cumple || c.dia);
            const esHoy = diaCliente === diaActual;
            const inicial = c.nombre_completo ? c.nombre_completo.charAt(0).toUpperCase() : 'A';
            const phoneClean = (c.telefono || '').replace(/\D/g, '');

            return (
              <div key={c.id} className={`birthday-command-item ${esHoy ? 'is-today' : ''}`}>
                <div className="birthday-top-row">
                  <div className="birthday-avatar-circle">{inicial}</div>
                  <div className="birthday-main-info">
                    <div className="birthday-name-row">
                      <span className="birthday-client-name">{c.nombre_completo}</span>
                      {esHoy && (
                        <span className="badge-pill-today">¡Hoy!</span>
                      )}
                    </div>
                    <div className="birthday-meta-row">
                      <span className="birthday-date-text">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {diaCliente || ''} de {mesNombre}
                      </span>
                      <span className="birthday-phone-text">Tel: {c.telefono || 'Sin registrar'}</span>
                    </div>
                  </div>
                </div>

                {/* Botón de acción para felicitar / contactar */}
                <a
                  href={`https://wa.me/506${phoneClean}?text=${encodeURIComponent(`¡Hola ${c.nombre_completo}! En ME Variedades te deseamos un muy feliz cumpleaños 🎂✨`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-birthday-congratulate"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span>Felicitar / Contactar</span>
                </a>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
