import { useState, useMemo } from 'react';
import { formatMoneda, formatFecha, formatBytes, getCategoriaInfo, descargarArchivo } from './facturasUtils';
import { generarExpedientePDF, exportarComprobanteIndividualPDF } from '../../services/pdfExportService';

/**
 * Almacenamiento Centralizado por Cliente ("Cajas / Carpetas de Documentos por Cliente")
 * ME Variedades — Dark Glassmorphism Document Hub
 */
export default function FacturasGrid({
  facturas,
  onVerPreview,
  onEliminar,
  onCrear,
  onCrearParaCliente
}) {
  const [vistaModo, setVistaModo] = useState('carpetas'); // 'carpetas' | 'global'
  const [carpetasColapsadas, setCarpetasColapsadas] = useState({});

  // Agrupación de facturas por cliente
  const gruposClientes = useMemo(() => {
    const map = new Map();

    facturas.forEach((factura) => {
      const clienteId = factura.cliente_id || 'sin_cliente';
      const clienteNombre =
        factura.cliente_nombre ||
        factura.clientes?.nombre_completo ||
        'Cliente Registrado';
      const clienteTelefono =
        factura.cliente_telefono ||
        factura.clientes?.telefono ||
        '';

      if (!map.has(clienteId)) {
        map.set(clienteId, {
          id: clienteId,
          nombre_completo: clienteNombre,
          telefono: clienteTelefono,
          documentos: []
        });
      }

      map.get(clienteId).documentos.push(factura);
    });

    return Array.from(map.values()).sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [facturas]);

  const toggleCarpeta = (clienteId) => {
    setCarpetasColapsadas(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }));
  };

  if (facturas.length === 0) {
    return (
      <div className="card-glass">
        <div className="facturas-empty-state">
          <div className="facturas-empty-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>Archivo Digital de Comprobantes Listo</h3>
          <p>
            Aún no hay comprobantes ni facturas digitales almacenadas. Pulsa el botón para digitalizar el primer documento de ME Variedades.
          </p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => onCrear()}
            id="btn-empty-crear-factura"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Subir Primera Factura</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="facturas-central-container">
      {/* Barra de Controles de Vista */}
      <div className="facturas-view-switcher-bar">
        <div className="view-mode-toggles">
          <button
            type="button"
            className={`btn-view-toggle ${vistaModo === 'carpetas' ? 'active' : ''}`}
            onClick={() => setVistaModo('carpetas')}
            title="Ver organizados por cajas y carpetas de cada cliente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Carpetas por Cliente ({gruposClientes.length})</span>
          </button>

          <button
            type="button"
            className={`btn-view-toggle ${vistaModo === 'global' ? 'active' : ''}`}
            onClick={() => setVistaModo('global')}
            title="Ver todos los documentos en cuadrícula general"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Cuadrícula Global ({facturas.length})</span>
          </button>
        </div>
      </div>

      {/* 1. VISTA POR CARPETAS DE CLIENTE */}
      {vistaModo === 'carpetas' ? (
        <div className="client-vaults-list">
          {gruposClientes.map((grupo) => {
            const isColapsada = !!carpetasColapsadas[grupo.id];
            const cantDocs = grupo.documentos.length;
            const pedidosDocs = grupo.documentos.filter(d => d.tipo_categoria === 'pedidos');
            const pagosDocs = grupo.documentos.filter(d => d.tipo_categoria === 'pagos' || d.tipo_categoria === 'cobros');
            const prestamosDocs = grupo.documentos.filter(d => d.tipo_categoria === 'prestamos');

            return (
              <div key={grupo.id} className="client-vault-card">
                {/* Cabecera de la Carpeta del Cliente */}
                <div className="client-vault-header">
                  <div className="vault-client-left">
                    <div className="vault-folder-icon" onClick={() => toggleCarpeta(grupo.id)}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>

                    <div className="vault-client-info">
                      <div className="vault-client-title-row">
                        <h3 className="vault-client-name">{grupo.nombre_completo}</h3>
                        {grupo.telefono && (
                          <span className="vault-client-tel">{grupo.telefono}</span>
                        )}
                        {grupo.id !== 'sin_cliente' && (
                          <span className="vault-client-badge">
                            ID: CLI-{String(grupo.id).padStart(4, '0')}
                          </span>
                        )}
                      </div>

                      {/* Resumen de tipos de documentos en la carpeta con exportación por categoría */}
                      <div className="vault-categories-summary">
                        <span className="vault-doc-count">
                          {cantDocs} {cantDocs === 1 ? 'comprobante digital' : 'comprobantes digitales'}
                        </span>
                        {pedidosDocs.length > 0 && (
                          <button
                            type="button"
                            className="vault-cat-chip chip-pedidos"
                            title={`Exportar ${pedidosDocs.length} Comprobantes de Pedidos en PDF`}
                            onClick={() => generarExpedientePDF(grupo, pedidosDocs, 'Comprobantes de Pedidos')}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>{pedidosDocs.length} Pedido{pedidosDocs.length > 1 ? 's' : ''} (PDF)</span>
                          </button>
                        )}
                        {pagosDocs.length > 0 && (
                          <button
                            type="button"
                            className="vault-cat-chip chip-pagos"
                            title={`Exportar ${pagosDocs.length} Recibos de Pago / Cobro en PDF`}
                            onClick={() => generarExpedientePDF(grupo, pagosDocs, 'Recibos de Pago y Cobro')}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>{pagosDocs.length} Pago/Cobro (PDF)</span>
                          </button>
                        )}
                        {prestamosDocs.length > 0 && (
                          <button
                            type="button"
                            className="vault-cat-chip chip-prestamos"
                            title={`Exportar ${prestamosDocs.length} Respaldos de Préstamo en PDF`}
                            onClick={() => generarExpedientePDF(grupo, prestamosDocs, 'Respaldos de Préstamos')}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            <span>{prestamosDocs.length} Préstamo{prestamosDocs.length > 1 ? 's' : ''} (PDF)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="vault-client-right">
                    {/* Nivel 3: Botón para compilar Expediente Completo en PDF */}
                    <button
                      type="button"
                      className="btn-export-dossier-pdf"
                      title={`Compilar Expediente Completo de ${grupo.nombre_completo} (${cantDocs} documentos)`}
                      onClick={() => generarExpedientePDF(grupo, grupo.documentos, 'Expediente Completo Consolidado')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>Expediente PDF</span>
                    </button>

                    {/* Botón rápido para subir documento a esta carpeta */}
                    <button
                      type="button"
                      className="btn-upload-to-vault"
                      title={`Subir nuevo comprobante para ${grupo.nombre_completo}`}
                      onClick={() => (onCrearParaCliente ? onCrearParaCliente(grupo) : onCrear())}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Subir archivo</span>
                    </button>

                    {/* Botón Colapsar / Expandir */}
                    <button
                      type="button"
                      className="btn-toggle-vault"
                      onClick={() => toggleCarpeta(grupo.id)}
                      title={isColapsada ? 'Expandir carpeta' : 'Colapsar carpeta'}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{
                          transform: isColapsada ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Cuadrícula de documentos dentro de la carpeta */}
                {!isColapsada && (
                  <div className="vault-documents-grid">
                    {grupo.documentos.map((factura) => renderFacturaCard(factura, onVerPreview, onEliminar))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. VISTA GLOBAL */
        <div className="facturas-grid">
          {facturas.map((factura) => renderFacturaCard(factura, onVerPreview, onEliminar))}
        </div>
      )}
    </div>
  );
}

/**
 * Renderizador de tarjeta de comprobante / documento individual
 */
function renderFacturaCard(factura, onVerPreview, onEliminar) {
  const catInfo = getCategoriaInfo(factura.tipo_categoria);
  const esPdf = factura.archivo_tipo === 'pdf';
  const imgUrl = factura.archivo_url || factura.archivo_data;

  return (
    <div key={factura.id} className="factura-card">
      {/* Cabecera / Miniatura de la tarjeta */}
      <div
        className="factura-card-preview"
        onClick={() => onVerPreview(factura)}
        title="Haz clic para previsualizar en pantalla completa"
      >
        {/* Badge de Categoría */}
        <span className={`factura-badge-cat ${catInfo.className}`}>
          {catInfo.label}
        </span>

        {/* Imagen o PDF placeholder */}
        {!esPdf && imgUrl ? (
          <img
            src={imgUrl}
            alt={factura.archivo_nombre || 'Comprobante'}
            className="factura-card-img"
            loading="lazy"
          />
        ) : (
          <div className="factura-pdf-placeholder">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Documento PDF</span>
          </div>
        )}

        <div className="factura-preview-overlay">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>Ver documento</span>
        </div>
      </div>

      {/* Cuerpo de Información */}
      <div className="factura-card-body">
        {/* Cliente */}
        <div className="factura-cliente-row">
          <div className="factura-cliente-avatar">
            {(factura.cliente_nombre || 'C').charAt(0).toUpperCase()}
          </div>
          <div className="factura-cliente-info">
            <span className="factura-cliente-nombre">{factura.cliente_nombre || 'Cliente registrado'}</span>
            <span className="factura-cliente-tel">{factura.cliente_telefono || 'Sin teléfono'}</span>
          </div>
        </div>

        {/* Detalles */}
        <div className="factura-detalles-box">
          {factura.referencia_id && (
            <div className="factura-detalle-item">
              <span className="factura-detalle-label">Referencia:</span>
              <span className="factura-detalle-val">{factura.referencia_id}</span>
            </div>
          )}

          <div className="factura-detalle-item">
            <span className="factura-detalle-label">Emisión:</span>
            <span className="factura-detalle-val">{formatFecha(factura.fecha_emision)}</span>
          </div>

          {factura.monto && (
            <div className="factura-detalle-item">
              <span className="factura-detalle-label">Monto:</span>
              <span className="factura-detalle-val factura-monto-val">
                {formatMoneda(factura.monto)}
              </span>
            </div>
          )}

          {factura.notas && (
            <div className="factura-detalle-item" style={{ marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-texto-apagado)', fontStyle: 'italic' }}>
                &quot;{factura.notas}&quot;
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer con Acciones */}
      <div className="factura-card-footer">
        <div className="factura-file-meta" title={factura.archivo_nombre}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
          <span>{formatBytes(factura.archivo_size)}</span>
        </div>

        <div className="factura-card-actions">
          {/* Previsualizar */}
          <button
            type="button"
            className="btn-table-action"
            title="Ver en pantalla completa"
            onClick={() => onVerPreview(factura)}
            id={`btn-preview-factura-${factura.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>

          {/* Generar PDF Individual */}
          <button
            type="button"
            className="btn-table-action btn-action-pdf"
            title="Exportar comprobante en PDF profesional"
            onClick={() => exportarComprobanteIndividualPDF(factura)}
            id={`btn-pdf-factura-${factura.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </button>

          {/* Descargar Archivo Original */}
          <button
            type="button"
            className="btn-table-action"
            title="Descargar archivo original"
            onClick={() => descargarArchivo(factura)}
            id={`btn-descargar-factura-${factura.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>

          {/* Eliminar */}
          <button
            type="button"
            className="btn-table-action btn-action-delete"
            title="Eliminar comprobante"
            onClick={() => onEliminar(factura)}
            id={`btn-eliminar-factura-${factura.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
