import { useState, useRef, useEffect, useMemo } from 'react';
import '../../styles/datepicker.css';

const MESES = [
  { id: 1, nombre: 'Enero', corto: 'Ene' },
  { id: 2, nombre: 'Febrero', corto: 'Feb' },
  { id: 3, nombre: 'Marzo', corto: 'Mar' },
  { id: 4, nombre: 'Abril', corto: 'Abr' },
  { id: 5, nombre: 'Mayo', corto: 'May' },
  { id: 6, nombre: 'Junio', corto: 'Jun' },
  { id: 7, nombre: 'Julio', corto: 'Jul' },
  { id: 8, nombre: 'Agosto', corto: 'Ago' },
  { id: 9, nombre: 'Septiembre', corto: 'Sep' },
  { id: 10, nombre: 'Octubre', corto: 'Oct' },
  { id: 11, nombre: 'Noviembre', corto: 'Nov' },
  { id: 12, nombre: 'Diciembre', corto: 'Dic' },
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Componente CustomDatePicker Modular (Día, Mes y Año).
 * Reemplaza selectores nativos con un Popover flotante Dark Glassmorphism.
 *
 * @param {string} value - Fecha en formato ISO YYYY-MM-DD
 * @param {function} onChange - Callback que recibe la fecha en formato YYYY-MM-DD
 * @param {boolean} hasError - Indica si el campo tiene error de validación
 * @param {string} placeholder - Texto cuando no hay fecha seleccionada
 * @param {string} id - Identificador para accesibilidad
 */
export default function CustomDatePicker({
  value,
  onChange,
  hasError = false,
  placeholder = 'Selecciona una fecha...',
  id,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'

  // Desglosar la fecha inicial o tomar la fecha actual
  const fechaParseada = useMemo(() => {
    if (!value || typeof value !== 'string') return null;
    const partes = value.split('T')[0].split('-');
    if (partes.length < 3) return null;
    const year = parseInt(partes[0], 10);
    const month = parseInt(partes[1], 10);
    const day = parseInt(partes[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month, day, monthIndex: month - 1 };
  }, [value]);

  const hoy = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthIndex: d.getMonth(),
      day: d.getDate(),
    };
  }, []);

  const [viewYear, setViewYear] = useState(() => fechaParseada ? fechaParseada.year : hoy.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(() => fechaParseada ? fechaParseada.monthIndex : hoy.monthIndex);
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const y = fechaParseada ? fechaParseada.year : hoy.year;
    return Math.floor(y / 12) * 12;
  });

  const containerRef = useRef(null);

  // Sincronizar vista cuando cambia el valor externo
  useEffect(() => {
    if (fechaParseada) {
      setViewYear(fechaParseada.year);
      setViewMonthIndex(fechaParseada.monthIndex);
      setYearRangeStart(Math.floor(fechaParseada.year / 12) * 12);
    }
  }, [fechaParseada]);

  // Manejador de click fuera del popover y tecla Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setViewMode('days');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Cálculo de días del mes actual con años bisiestos
  const diasEnMes = useMemo(() => {
    return new Date(viewYear, viewMonthIndex + 1, 0).getDate();
  }, [viewYear, viewMonthIndex]);

  // Desfase del primer día de la semana (Lunes = 0, Domingo = 6)
  const offsetPrimerDia = useMemo(() => {
    const primerDia = new Date(viewYear, viewMonthIndex, 1).getDay();
    return (primerDia + 6) % 7;
  }, [viewYear, viewMonthIndex]);

  // Formato visible en input (DD/MM/AAAA)
  const textoVisible = useMemo(() => {
    if (!fechaParseada) return '';
    const d = String(fechaParseada.day).padStart(2, '0');
    const m = String(fechaParseada.month).padStart(2, '0');
    const y = fechaParseada.year;
    const nombreMesCorto = MESES[fechaParseada.monthIndex]?.corto || '';
    return `${d} ${nombreMesCorto} ${y} (${d}/${m}/${y})`;
  }, [fechaParseada]);

  // Navegación Anterior
  const handlePrev = (e) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      if (viewMonthIndex === 0) {
        setViewMonthIndex(11);
        setViewYear(prev => prev - 1);
      } else {
        setViewMonthIndex(prev => prev - 1);
      }
    } else if (viewMode === 'months') {
      setViewYear(prev => prev - 1);
    } else if (viewMode === 'years') {
      setYearRangeStart(prev => prev - 12);
    }
  };

  // Navegación Siguiente
  const handleNext = (e) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      if (viewMonthIndex === 11) {
        setViewMonthIndex(0);
        setViewYear(prev => prev + 1);
      } else {
        setViewMonthIndex(prev => prev + 1);
      }
    } else if (viewMode === 'months') {
      setViewYear(prev => prev + 1);
    } else if (viewMode === 'years') {
      setYearRangeStart(prev => prev + 12);
    }
  };

  // Alternar Modo de Vista (Días -> Meses -> Años -> Días)
  const handleToggleViewMode = (e) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      setViewMode('months');
    } else if (viewMode === 'months') {
      setViewMode('years');
    } else {
      setViewMode('days');
    }
  };

  // Selección de Día
  const handleSelectDay = (diaNum) => {
    const mesFormat = String(viewMonthIndex + 1).padStart(2, '0');
    const diaFormat = String(diaNum).padStart(2, '0');
    const isoString = `${viewYear}-${mesFormat}-${diaFormat}`;

    onChange(isoString);
    setIsOpen(false);
    setViewMode('days');
  };

  // Selección de Mes
  const handleSelectMonth = (monthIdx) => {
    setViewMonthIndex(monthIdx);
    setViewMode('days');
  };

  // Selección de Año
  const handleSelectYear = (year) => {
    setViewYear(year);
    setViewMode('months');
  };

  // Botón "Hoy"
  const handleSetToday = (e) => {
    e.stopPropagation();
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const isoString = `${y}-${m}-${dia}`;

    onChange(isoString);
    setViewYear(y);
    setViewMonthIndex(d.getMonth());
    setIsOpen(false);
    setViewMode('days');
  };

  // Botón "Limpiar"
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Rango de 12 años para la vista de años
  const listaAnios = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
  }, [yearRangeStart]);

  return (
    <div className="custom-datepicker-wrapper" ref={containerRef}>
      {/* Input Disparador */}
      <div
        id={id}
        className={`custom-datepicker-trigger ${isOpen ? 'active-focus' : ''} ${hasError ? 'input-error' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="datepicker-trigger-content">
          <svg className="datepicker-cal-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>

          {textoVisible ? (
            <span className="datepicker-val-text">{textoVisible}</span>
          ) : (
            <span className="datepicker-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="datepicker-actions-right">
          {textoVisible && !disabled && (
            <button
              type="button"
              className="btn-datepicker-clear"
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
            className={`datepicker-chevron-icon ${isOpen ? 'open' : ''}`}
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

      {/* Popover Flotante */}
      {isOpen && (
        <div className="custom-datepicker-popover" role="dialog" aria-label="Selector de fecha">
          {/* Header con Navegación y Título */}
          <div className="datepicker-header">
            <button
              type="button"
              className="btn-datepicker-nav"
              onClick={handlePrev}
              title="Anterior"
              aria-label="Anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              type="button"
              className="btn-datepicker-view-toggle"
              onClick={handleToggleViewMode}
              title="Cambiar vista de calendario"
            >
              {viewMode === 'days' && (
                <>
                  <span>{MESES[viewMonthIndex].nombre} {viewYear}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              )}
              {viewMode === 'months' && (
                <>
                  <span>{viewYear}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </>
              )}
              {viewMode === 'years' && (
                <span>{yearRangeStart} - {yearRangeStart + 11}</span>
              )}
            </button>

            <button
              type="button"
              className="btn-datepicker-nav"
              onClick={handleNext}
              title="Siguiente"
              aria-label="Siguiente"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          {/* Vista 1: Cuadrícula de Días */}
          {viewMode === 'days' && (
            <>
              <div className="datepicker-weekdays">
                {DIAS_SEMANA.map((diaSemana) => (
                  <span key={diaSemana} className="datepicker-weekday-label">
                    {diaSemana}
                  </span>
                ))}
              </div>

              <div className="datepicker-days-grid">
                {/* Espacios vacíos de offset */}
                {Array.from({ length: offsetPrimerDia }).map((_, idx) => (
                  <span key={`empty-${idx}`} className="datepicker-day-empty"></span>
                ))}

                {/* Días del mes */}
                {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((diaNum) => {
                  const isSelected =
                    fechaParseada &&
                    fechaParseada.year === viewYear &&
                    fechaParseada.monthIndex === viewMonthIndex &&
                    fechaParseada.day === diaNum;

                  const isToday =
                    hoy.year === viewYear &&
                    hoy.monthIndex === viewMonthIndex &&
                    hoy.day === diaNum;

                  return (
                    <button
                      key={diaNum}
                      type="button"
                      className={`datepicker-day-cell ${isSelected ? 'selected' : isToday ? 'is-today' : ''}`}
                      onClick={() => handleSelectDay(diaNum)}
                      title={`Día ${diaNum} de ${MESES[viewMonthIndex].nombre} de ${viewYear}`}
                    >
                      {diaNum}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Vista 2: Selector Rápido de Meses (3x4) */}
          {viewMode === 'months' && (
            <div className="datepicker-months-grid">
              {MESES.map((m, idx) => {
                const isSelected =
                  fechaParseada &&
                  fechaParseada.year === viewYear &&
                  fechaParseada.monthIndex === idx;

                const isCurrentMonth = viewMonthIndex === idx;

                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`btn-datepicker-chip ${isSelected ? 'selected' : isCurrentMonth ? 'current-view' : ''}`}
                    onClick={() => handleSelectMonth(idx)}
                  >
                    {m.corto}
                  </button>
                );
              })}
            </div>
          )}

          {/* Vista 3: Selector de Años (3x4) */}
          {viewMode === 'years' && (
            <div className="datepicker-years-grid">
              {listaAnios.map((yearNum) => {
                const isSelected = fechaParseada && fechaParseada.year === yearNum;
                const isCurrentYear = viewYear === yearNum;

                return (
                  <button
                    key={yearNum}
                    type="button"
                    className={`btn-datepicker-chip ${isSelected ? 'selected' : isCurrentYear ? 'current-view' : ''}`}
                    onClick={() => handleSelectYear(yearNum)}
                  >
                    {yearNum}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer: Acciones "Hoy" y "Cerrar" */}
          <div className="datepicker-footer">
            <button
              type="button"
              className="btn-datepicker-action"
              onClick={handleSetToday}
              title="Seleccionar fecha actual"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Hoy</span>
            </button>

            <button
              type="button"
              className="btn-datepicker-action btn-datepicker-close"
              onClick={() => {
                setIsOpen(false);
                setViewMode('days');
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
