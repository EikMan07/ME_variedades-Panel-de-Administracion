import { useState, useRef, useEffect } from 'react';

const MESES = [
  { id: 1, nombre: 'Enero', dias: 31 },
  { id: 2, nombre: 'Febrero', dias: 29 }, // Cubre el 29 de febrero para años bisiestos
  { id: 3, nombre: 'Marzo', dias: 31 },
  { id: 4, nombre: 'Abril', dias: 30 },
  { id: 5, nombre: 'Mayo', dias: 31 },
  { id: 6, nombre: 'Junio', dias: 30 },
  { id: 7, nombre: 'Julio', dias: 31 },
  { id: 8, nombre: 'Agosto', dias: 31 },
  { id: 9, nombre: 'Septiembre', dias: 30 },
  { id: 10, nombre: 'Octubre', dias: 31 },
  { id: 11, nombre: 'Noviembre', dias: 30 },
  { id: 12, nombre: 'Diciembre', dias: 31 },
];

export default function BirthdayDatePicker({
  dia,
  mes,
  onChange,
  hasError = false,
  placeholder = 'Selecciona día y mes...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevMes, setPrevMes] = useState(mes);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => {
    return mes ? Number(mes) - 1 : new Date().getMonth();
  });
  const [showMonthGrid, setShowMonthGrid] = useState(false);

  // Sincronizar vista si cambia el mes desde props
  if (mes !== prevMes) {
    setPrevMes(mes);
    if (mes) {
      setCurrentMonthIndex(Number(mes) - 1);
    }
  }

  const containerRef = useRef(null);

  // Cerrar al hacer clic fuera del calendario
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowMonthGrid(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const mesActual = MESES[currentMonthIndex];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonthIndex((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonthIndex((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const handleSelectDay = (dayNumber) => {
    onChange({
      dia: dayNumber,
      mes: mesActual.id,
      nombreMes: mesActual.nombre,
      textoFormateado: `${dayNumber} de ${mesActual.nombre}`,
    });
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const handleSelectMonthQuick = (monthIdx) => {
    setCurrentMonthIndex(monthIdx);
    setShowMonthGrid(false);
  };

  const handleSetToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonthIndex = today.getMonth();
    const targetMonth = MESES[todayMonthIndex];

    onChange({
      dia: todayDay,
      mes: targetMonth.id,
      nombreMes: targetMonth.nombre,
      textoFormateado: `${todayDay} de ${targetMonth.nombre}`,
    });
    setCurrentMonthIndex(todayMonthIndex);
    setIsOpen(false);
    setShowMonthGrid(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({
      dia: null,
      mes: null,
      nombreMes: '',
      textoFormateado: '',
    });
  };

  // Texto formateado para el input
  const displayText = dia && mes ? `${dia} de ${MESES[Number(mes) - 1]?.nombre || ''}` : '';

  // Calcular desplazamiento del primer día del mes usando año bisiesto de referencia (2024)
  const primerDiaSemana = new Date(2024, currentMonthIndex, 1).getDay();
  // Ajustar para que la semana empiece en Lunes (0 = Lun, 6 = Dom)
  const offsetDias = (primerDiaSemana + 6) % 7;

  return (
    <div className="custom-birthday-picker-container" ref={containerRef}>
      {/* Input Disparador */}
      <div
        className={`birthday-picker-input ${isOpen ? 'active-focus' : ''} ${hasError ? 'input-error' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="picker-input-content">
          <svg className="picker-calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>

          {displayText ? (
            <span className="picker-value-text">{displayText}</span>
          ) : (
            <span className="picker-placeholder-text">{placeholder}</span>
          )}
        </div>

        <div className="picker-actions-right">
          {displayText && (
            <button
              type="button"
              className="btn-picker-clear"
              onClick={handleClear}
              title="Borrar fecha"
              aria-label="Borrar fecha"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}

          <svg
            className={`picker-chevron-icon ${isOpen ? 'open' : ''}`}
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Popover Flotante Compacto */}
      {isOpen && (
        <div className="birthday-calendar-popover compact-floating-popover" role="dialog" aria-label="Calendario de Cumpleaños">
          {/* Cabecera: Navegación de Mes */}
          <div className="calendar-header-bar">
            <button
              type="button"
              className="btn-cal-nav"
              onClick={handlePrevMonth}
              title="Mes anterior"
              aria-label="Mes anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="btn-cal-month-title"
              onClick={(e) => {
                e.stopPropagation();
                setShowMonthGrid((prev) => !prev);
              }}
              title="Haz clic para seleccionar otro mes"
            >
              <span>{mesActual.nombre}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="btn-cal-nav"
              onClick={handleNextMonth}
              title="Mes siguiente"
              aria-label="Mes siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Vista 1: Selector Rápido de Meses */}
          {showMonthGrid ? (
            <div className="calendar-months-grid">
              {MESES.map((m, idx) => {
                const isSelected = Number(mes) === m.id;
                const isCurrentView = currentMonthIndex === idx;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn-month-chip ${isSelected ? 'selected' : ''} ${isCurrentView ? 'current-view' : ''}`}
                    onClick={() => handleSelectMonthQuick(idx)}
                  >
                    {m.nombre.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Cuadrícula de Días (Alineación exacta en 7 columnas) */
            <div className="calendar-days-grid">
              {/* Espacios vacíos para alineación */}
              {Array.from({ length: offsetDias }).map((_, i) => (
                <span key={`empty-${i}`} className="calendar-day-empty"></span>
              ))}

              {/* Días del mes */}
              {Array.from({ length: mesActual.dias }, (_, i) => i + 1).map((dayNum) => {
                  const isSelected = Number(dia) === dayNum && Number(mes) === mesActual.id;
                  const today = new Date();
                  const isToday = today.getDate() === dayNum && today.getMonth() === currentMonthIndex;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                      onClick={() => handleSelectDay(dayNum)}
                      title={`Día ${dayNum} de ${mesActual.nombre}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Pie del Calendario: Acciones con Íconos SVG Profesionales (Sin Emojis) */}
          <div className="calendar-footer-bar">
            <button
              type="button"
              className="btn-cal-footer-action btn-cal-today"
              onClick={handleSetToday}
              title="Establecer fecha actual"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Hoy</span>
            </button>

            <button
              type="button"
              className="btn-cal-footer-action btn-cal-close"
              onClick={() => {
                setIsOpen(false);
                setShowMonthGrid(false);
              }}
              title="Cerrar calendario"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
