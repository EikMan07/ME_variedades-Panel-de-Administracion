import { useState, useMemo, useRef, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useClients } from '../context/ClientContext';
import { useVentas } from '../context/VentasContext';
import { usePrestamos } from '../context/PrestamosContext';
import { usePagos } from '../context/PagosContext';
import { formatearMoneda, formatearFecha, calcularMoratoriaElemento } from '../utils/utils';

export default function EstadoCuentaPage() {
  const { clientes = [] } = useClients();
  const { ventas = [] } = useVentas();
  const { prestamos = [] } = usePrestamos();
  const { pagos = [] } = usePagos?.() || { pagos: [] };

  const [clienteBusqueda, setClienteBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const autocompleteRef = useRef(null);

  // Cerrar desplegable de búsqueda al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de clientes en autocompletado
  const clientesFiltrados = useMemo(() => {
    if (!clienteBusqueda.trim()) return clientes.slice(0, 8);
    const q = clienteBusqueda.toLowerCase().trim();
    return clientes.filter((c) => {
      const nombre = (c.nombre_completo || c.nombre || '').toLowerCase();
      const tel = (c.telefono || '').replace(/[\s-]/g, '');
      const codigo = `cli-${String(c.id).padStart(4, '0')}`.toLowerCase();
      return nombre.includes(q) || tel.includes(q) || codigo.includes(q);
    }).slice(0, 8);
  }, [clientes, clienteBusqueda]);

  const handleSeleccionarCliente = (c) => {
    const nombre = c.nombre_completo || c.nombre || '';
    setClienteSeleccionado(c);
    setClienteBusqueda(nombre);
    setShowDropdown(false);
  };

  // Consolidación de movimientos contables para el cliente seleccionado
  const estadoCuenta = useMemo(() => {
    if (!clienteSeleccionado) {
      return { movimientos: [], totalFacturado: 0, totalPagado: 0, saldoPendiente: 0 };
    }

    const cId = String(clienteSeleccionado.id);
    const lista = [];

    // 1. Procesar Ventas
    ventas.forEach((v) => {
      const ventaCId = String(v.clienteId || v.cliente_id);
      if (ventaCId !== cId) return;

      const esContado = (v.modalidad || v.tipo_venta || '').toLowerCase() === 'contado';
      const montoOriginal = Number(v.precio_venta_real ?? v.total ?? v.costo_total ?? 0);

      let totalPagado = 0;
      let saldoRestante = 0;

      if (esContado) {
        totalPagado = montoOriginal;
        saldoRestante = 0;
      } else {
        const cuotas = v.cuotas || v.creditoData?.cuotas || [];
        if (cuotas.length > 0) {
          totalPagado = cuotas.reduce((acc, c) => {
            if (c.pagada) return acc + Number(c.montoRealAcordado || c.monto || c.montoSugerido || 0);
            return acc + Number(c.montoPagado || 0);
          }, 0);
        } else {
          totalPagado = Number(v.total_pagado || 0);
        }
        saldoRestante = Math.max(0, montoOriginal - totalPagado);
      }

      const fechaMov = v.fecha_venta || v.fecha || (v.created_at ? v.created_at.split('T')[0] : '2026-09-01');
      const productoNombre = v.productoNombre || v.productos?.nombre || v.producto?.nombre || 'Mercancía general';

      let moraVenta = 0;
      if (!esContado && Number(v.moratoria_monto) > 0) {
        const resMora = calcularMoratoriaElemento(v);
        moraVenta = resMora.moraTotal;
      }

      lista.push({
        id: `vta-${v.id}`,
        folio: `#VTA-${String(v.id).padStart(4, '0')}`,
        fecha: fechaMov,
        tipo: esContado ? 'Venta Contado' : 'Venta Crédito',
        concepto: esContado ? `Venta al contado: ${productoNombre}` : `Venta a crédito: ${productoNombre}`,
        montoOriginal,
        pagosAbonos: totalPagado,
        saldoRestante,
        moraAcumulada: moraVenta,
        estado: saldoRestante <= 0 ? 'Liquidado' : 'Pendiente',
      });
    });

    // 2. Procesar Préstamos
    prestamos.forEach((pr) => {
      const prestamoCId = String(pr.cliente_id || pr.clienteId);
      if (prestamoCId !== cId) return;

      const capital = Number(pr.monto_capital || pr.capital || 0);
      const tasa = Number(pr.tasa_interes || pr.tasaInteres || 0);
      const montoOriginal = Number(pr.total_devolver || pr.monto_total || (capital + (capital * tasa) / 100));

      const saldoRestante = Number(pr.saldo_pendiente !== undefined ? pr.saldo_pendiente : montoOriginal);
      const totalPagado = Math.max(0, montoOriginal - saldoRestante);
      const fechaMov = pr.fecha_entrega || (pr.fecha_registro ? pr.fecha_registro.split('T')[0] : '2026-09-01');

      let moraPrestamo = 0;
      if (Number(pr.moratoria_monto) > 0) {
        const resMora = calcularMoratoriaElemento(pr);
        moraPrestamo = resMora.moraTotal;
      }

      lista.push({
        id: `pr-${pr.id}`,
        folio: `#PR-${String(pr.id).padStart(4, '0')}`,
        fecha: fechaMov,
        tipo: 'Préstamo',
        concepto: `Préstamo de dinero (Capital CRC ${capital.toLocaleString('en-US', { minimumFractionDigits: 2 })}, Tasa ${tasa}%)`,
        montoOriginal,
        pagosAbonos: totalPagado,
        saldoRestante,
        moraAcumulada: moraPrestamo,
        estado: saldoRestante <= 0 ? 'Liquidado' : 'Activo',
      });
    });

    // 3. Procesar Cuentas por Cobrar adicionales
    pagos.forEach((p) => {
      const pagoCId = String(p.cliente_id || p.clienteId);
      if (pagoCId !== cId) return;

      const yaRegistrado = lista.some((m) => m.folio.includes(String(p.id)));
      if (yaRegistrado) return;

      const montoOriginal = Number(p.monto_total || p.montoTotal || 0);
      const saldoRestante = Number(p.saldo_pendiente !== undefined ? p.saldo_pendiente : 0);
      const totalPagado = Math.max(0, montoOriginal - saldoRestante);
      const fechaMov = p.fecha_registro ? p.fecha_registro.split('T')[0] : '2026-09-01';

      lista.push({
        id: `pgo-${p.id}`,
        folio: `#CTA-${String(p.id).padStart(4, '0')}`,
        fecha: fechaMov,
        tipo: 'Cuenta por Cobrar',
        concepto: p.concepto || 'Saldo en cuenta',
        montoOriginal,
        pagosAbonos: totalPagado,
        saldoRestante,
        estado: saldoRestante <= 0 ? 'Liquidado' : 'Pendiente',
      });
    });

    // Ordenar cronológicamente (más recientes primero)
    lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const totalFacturado = lista.reduce((sum, m) => sum + m.montoOriginal, 0);
    const totalPagado = lista.reduce((sum, m) => sum + m.pagosAbonos, 0);
    const saldoPendiente = lista.reduce((sum, m) => sum + m.saldoRestante, 0);
    const totalMoraAcumulada = lista.reduce((sum, m) => sum + (m.moraAcumulada || 0), 0);
    const saldoTotalConMora = saldoPendiente + totalMoraAcumulada;

    return {
      movimientos: lista,
      totalFacturado,
      totalPagado,
      saldoPendiente,
      totalMoraAcumulada,
      saldoTotalConMora,
    };
  }, [clienteSeleccionado, ventas, prestamos, pagos]);

  // Generación y descarga formal en PDF con jsPDF y autoTable
  const handleDescargarPDF = async () => {
    if (!clienteSeleccionado) {
      alert('Por favor selecciona un cliente antes de exportar el estado de cuenta.');
      return;
    }

    try {
      setIsExportingPDF(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const clienteNombre = clienteSeleccionado.nombre_completo || clienteSeleccionado.nombre || 'Cliente';
      const clienteTel = clienteSeleccionado.telefono || 'Sin registrar';

      // Sanitizador universal para asegurar inmunidad a errores de codificación en jsPDF
      const cleanPDFText = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/₡\s*/g, 'CRC ')
          .replace(/[\u20A1]\s*/g, 'CRC ');
      };

      // 1. Encabezado Oficial ME VARIEDADES (#12111A con filete dorado #F59E0B)
      doc.setFillColor(18, 17, 26);
      doc.rect(0, 0, pageWidth, 36, 'F');

      // Línea de acento dorado
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 0, pageWidth, 2.5, 'F');

      // Título del negocio
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('ME VARIEDADES', 14, 15);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // #94A3B8
      doc.text('Comprobante Oficial de Movimientos', 14, 21);
      doc.text('Costa Rica • Atención al Cliente', 14, 26);

      // Bloque derecho: ESTADO DE CUENTA y fecha de emisión (sin ID interno de cliente)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(245, 158, 11); // #F59E0B
      doc.text('ESTADO DE CUENTA', pageWidth - 14, 16, { align: 'right' });

      const hoy = new Date();
      const fechaEmisionStr = hoy.toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225); // #CBD5E1
      doc.text(`Emisión: ${fechaEmisionStr}`, pageWidth - 14, 23.5, { align: 'right' });

      // 2. Ficha del Titular (Caja suave con esquinas redondeadas y borde sutil)
      let y = 43;
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.setLineWidth(0.3);
      doc.roundedRect(14, y, pageWidth - 28, 20, 2.5, 2.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // #64748B
      doc.text('TITULAR DE LA CUENTA', 19, y + 6.5);

      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42); // #0F172A
      doc.text(clienteNombre, 19, y + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // #475569
      doc.text(`Teléfono: ${clienteTel}`, pageWidth - 19, y + 14, { align: 'right' });

      // 3. Tarjetas KPI de Resumen Financiero Ejecutivo
      y += 26;
      const boxWidth = (pageWidth - 28 - 8) / 3;

      // Tarjeta 1: Total Facturado
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.roundedRect(14, y, boxWidth, 19, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL FACTURADO', 18, y + 6.5);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`CRC ${estadoCuenta.totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18, y + 14);

      // Tarjeta 2: Total Pagado / Abonos (Verde Esmeralda suave)
      doc.setFillColor(240, 253, 244); // #F0FDF4
      doc.setDrawColor(187, 247, 208); // #BBF7D0
      doc.roundedRect(14 + boxWidth + 4, y, boxWidth, 19, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61); // #15803D
      doc.text('TOTAL PAGADO / ABONOS', 18 + boxWidth + 4, y + 6.5);
      doc.setFontSize(11);
      doc.setTextColor(4, 120, 87); // #047857
      doc.text(`CRC ${estadoCuenta.totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18 + boxWidth + 4, y + 14);

      // Tarjeta 3: Saldo Neto Pendiente (Ámbar elegante)
      doc.setFillColor(255, 251, 235); // #FFFBEB
      doc.setDrawColor(253, 230, 138); // #FDE68A
      doc.roundedRect(14 + (boxWidth * 2) + 8, y, boxWidth, 19, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9); // #B45309
      doc.text('SALDO NETO PENDIENTE', 18 + (boxWidth * 2) + 8, y + 6.5);
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text(`CRC ${estadoCuenta.saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 18 + (boxWidth * 2) + 8, y + 14);

      // 4. Tabla de Movimientos (autoTable profesional con ajuste de línea y contraste óptimo)
      y += 25;

      const bodyData = estadoCuenta.movimientos.length > 0
        ? estadoCuenta.movimientos.map((m) => [
            cleanPDFText(m.fecha),
            cleanPDFText(m.tipo),
            `CRC ${m.montoOriginal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `CRC ${m.pagosAbonos.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `CRC ${m.saldoRestante.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            cleanPDFText(m.estado),
          ])
        : [[
            hoy.toISOString().split('T')[0],
            'Informativo',
            'CRC 0.00',
            'CRC 0.00',
            'CRC 0.00',
            'Al día',
          ]];

      autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Tipo', 'Original', 'Pagado', 'Saldo', 'Estado']],
        body: bodyData,
        theme: 'grid',
        margin: { left: 14, right: 14 },
        headStyles: {
          fillColor: [30, 27, 46], // #1E1B2E Fondo oscuro sobrio oficial
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // #F8FAFC Fondo alternado muy sutil
        },
        styles: {
          overflow: 'linebreak',
          fontSize: 8,
          textColor: [30, 41, 59], // #1E293B
          cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
          lineColor: [226, 232, 240], // #E2E8F0
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { cellWidth: 28 }, // Fecha
          1: { cellWidth: 32 }, // Tipo
          2: { cellWidth: 32, halign: 'right' }, // Original
          3: { cellWidth: 30, halign: 'right', textColor: [4, 120, 87] }, // Pagado (verde)
          4: { cellWidth: 34, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }, // Saldo (ámbar)
          5: { cellWidth: 26, halign: 'center' }, // Estado
        },
      });

      // Línea mínima de mora acumulada en PDF para evitar reclamos y garantizar transparencia
      const finalY = doc.lastAutoTable?.finalY || 240;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);

      if (estadoCuenta.totalMoraAcumulada > 0) {
        doc.setTextColor(180, 83, 9); // Ámbar oficial
        doc.text(
          `* Mora acumulada: CRC ${estadoCuenta.totalMoraAcumulada.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Saldo exigible total: CRC ${estadoCuenta.saldoTotalConMora.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
          14,
          Math.min(278, finalY + 8)
        );
      } else {
        doc.setTextColor(100, 116, 139); // Slate neutro
        doc.text(
          `* Mora acumulada: CRC 0.00 (Cuenta sin atrasos)`,
          14,
          Math.min(278, finalY + 8)
        );
      }

      // Pie de página de agradecimiento
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Gracias por su preferencia y confianza comercial en ME Variedades.', 14, Math.min(286, finalY + 15));

      const nombreArchivo = `Estado_Cuenta_${clienteNombre.replace(/\s+/g, '_')}_${hoy.toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);
    } catch (err) {
      console.error('Error al generar PDF de estado de cuenta:', err);
      alert('Ocurrió un error al generar el PDF. Por favor intente nuevamente.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <Topbar breadcrumb="Estado de Cuenta" />

      <main className="estado-cuenta-content">
        {/* Encabezado de la Página */}
        <div className="page-header mb-6">
          <h1 className="text-2xl font-bold text-white">Estado de Cuenta</h1>
          <p className="text-gray-400 text-sm mt-1">
            Consulta consolidada en tiempo real de ventas, compras a crédito y préstamos por cliente con descarga oficial en PDF.
          </p>
        </div>

        {/* Tarjeta de Búsqueda y Selección de Cliente */}
        <section className="edc-selector-card">
          <div className="edc-client-search" ref={autocompleteRef}>
            <label className="edc-search-label">
              Seleccionar Cliente *
            </label>
            <div className="edc-input-wrapper">
              <input
                type="text"
                className="search-input-field edc-search-input"
                placeholder="Escribe el nombre o teléfono del cliente..."
                value={clienteBusqueda}
                onChange={(e) => {
                  setClienteBusqueda(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowDropdown(false);
                }}
              />
              {clienteBusqueda && (
                <button
                  type="button"
                  className="edc-clear-btn"
                  onClick={() => {
                    setClienteBusqueda('');
                    setClienteSeleccionado(null);
                    setShowDropdown(false);
                  }}
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}

              {showDropdown && (
                <div className="edc-autocomplete-dropdown">
                  {clientesFiltrados.length === 0 ? (
                    <div className="edc-autocomplete-empty">
                      No se encontraron clientes coincidentes
                    </div>
                  ) : (
                    clientesFiltrados.map((c) => (
                      <div
                        key={c.id}
                        className="edc-autocomplete-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSeleccionarCliente(c);
                        }}
                        onClick={() => handleSeleccionarCliente(c)}
                      >
                        <div className="edc-item-name">{c.nombre_completo || c.nombre}</div>
                        <div className="edc-item-meta">
                          Tel: {c.telefono || 'Sin teléfono'} • Cédula: {c.cedula || 'N/A'} • ID: CLI-{String(c.id).padStart(4, '0')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="edc-selector-actions">
            {clienteSeleccionado && (
              <div className="edc-client-meta-badges">
                <div className="badge-edc-id">
                  ID: CLI-{String(clienteSeleccionado.id).padStart(4, '0')}
                </div>
                <div className="edc-meta-phone">
                  Teléfono: <strong>{clienteSeleccionado.telefono || 'Sin registrar'}</strong>
                </div>
                <div className="edc-meta-count">
                  {estadoCuenta.movimientos.length} movimientos encontrados
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-edc-pdf"
              onClick={handleDescargarPDF}
              disabled={!clienteSeleccionado || isExportingPDF}
              id="btn-descargar-estado-cuenta-pdf"
              title={!clienteSeleccionado ? 'Selecciona un cliente para descargar su estado de cuenta' : 'Descargar Estado de Cuenta (PDF)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar Estado de Cuenta (PDF)'}</span>
            </button>
          </div>
        </section>

        {/* Panel Resumen de 3 Métricas */}
        {clienteSeleccionado && (
          <section className="edc-summary-grid">
            {/* 1. Total Facturado */}
            <div className="edc-summary-card">
              <div className="edc-summary-icon" style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#e4e4e7' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <div className="edc-summary-info">
                <span className="edc-summary-label">Total Facturado</span>
                <span className="edc-summary-value">{formatearMoneda(estadoCuenta.totalFacturado)}</span>
              </div>
            </div>

            {/* 2. Total Pagado */}
            <div className="edc-summary-card">
              <div className="edc-summary-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="edc-summary-info">
                <span className="edc-summary-label">Total Pagado / Abonos</span>
                <span className="edc-summary-value" style={{ color: '#34d399' }}>
                  {formatearMoneda(estadoCuenta.totalPagado)}
                </span>
              </div>
            </div>

            {/* 3. Saldo Pendiente */}
            <div className="edc-summary-card">
              <div className="edc-summary-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="edc-summary-info">
                <span className="edc-summary-label">Saldo Neto Pendiente</span>
                <span className="edc-summary-value" style={{ color: estadoCuenta.saldoPendiente > 0 ? '#f59e0b' : '#34d399' }}>
                  {formatearMoneda(estadoCuenta.saldoPendiente)}
                </span>
                {estadoCuenta.totalMoraAcumulada > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    +{formatearMoneda(estadoCuenta.totalMoraAcumulada)} mora (Total: {formatearMoneda(estadoCuenta.saldoTotalConMora)})
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tabla de Historial Consolidado */}
        <section className="edc-table-card">
          <div className="edc-table-header">
            <h2 className="edc-table-title">
              {clienteSeleccionado
                ? `Historial Contable: ${clienteSeleccionado.nombre_completo || clienteSeleccionado.nombre}`
                : 'Historial de Movimientos'}
            </h2>
            {clienteSeleccionado && (
              <span style={{ fontSize: '0.82rem', color: '#a1a1aa' }}>
                {estadoCuenta.movimientos.length} operaciones registradas
              </span>
            )}
          </div>

          {!clienteSeleccionado ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#a1a1aa' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.4rem' }}>Selecciona un cliente</h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.86rem' }}>
                Busca un cliente en el selector superior para ver su estado de cuenta consolidado, balance financiero y generar su comprobante en PDF.
              </p>
            </div>
          ) : estadoCuenta.movimientos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 2rem', color: '#a1a1aa' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Sin movimientos contables</h3>
              <p style={{ fontSize: '0.86rem' }}>Este cliente no tiene ventas, compras a crédito ni préstamos registrados.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="orders-data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th className="edc-col-folio" style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>Folio</th>
                    <th>Tipo</th>
                    <th>Detalle / Concepto</th>
                    <th style={{ textAlign: 'right' }}>Monto Original</th>
                    <th style={{ textAlign: 'right' }}>Pagado / Abonos</th>
                    <th style={{ textAlign: 'right' }}>Saldo Restante</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {estadoCuenta.movimientos.map((m) => (
                    <tr key={m.id}>
                      <td style={{ color: '#e4e4e7', whiteSpace: 'nowrap' }}>
                        {formatearFecha(m.fecha, 'corto')}
                      </td>
                      <td className="edc-col-folio" style={{ minWidth: '110px', whiteSpace: 'nowrap' }}>
                        <span
                          className="edc-folio-badge"
                          style={{
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 'fit-content',
                            padding: '4px 10px',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {m.folio}
                        </span>
                      </td>
                      <td style={{ color: '#a1a1aa', whiteSpace: 'nowrap' }}>{m.tipo}</td>
                      <td style={{ color: '#f4f4f5', maxWidth: '300px' }}>{m.concepto}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                        {formatearMoneda(m.montoOriginal)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399', whiteSpace: 'nowrap' }}>
                        {formatearMoneda(m.pagosAbonos)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: m.saldoRestante > 0 ? '#f59e0b' : '#a1a1aa', whiteSpace: 'nowrap' }}>
                        {formatearMoneda(m.saldoRestante)}
                        {m.moraAcumulada > 0 && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#fb7185', fontWeight: 600 }}>
                            +{formatearMoneda(m.moraAcumulada)} mora
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={m.estado === 'Liquidado' ? 'badge-edc-liquidado' : m.estado === 'Activo' ? 'badge-edc-activo' : 'badge-edc-pendiente'}>
                          {m.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
