import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor (Debounce)
 * Evita recálculos y peticiones repetitivas al escribir en inputs de búsqueda.
 * 
 * @param {any} value - Valor a debouncificar
 * @param {number} delay - Retraso en milisegundos (por defecto 300ms)
 * @returns {any} Valor debouncificado
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
