import { formatMoneda, formatFecha, formatBytes, getCategoriaInfo, descargarArchivo } from './facturasUtils';
import { exportarComprobanteIndividualPDF } from '../../services/pdfExportService';
import Modal from '../common/Modal';

/**
 * Modal Lightbox para previsualizar facturas o comprobantes en pantalla completa.
 */
export default function ModalPreviewFactura({ isOpen, onClose, factura }) {
  if (!factura) return null;

  const catInfo = getCategoriaInfo(factura.tipo_categoria);
  const esPdf = factura.archivo_tipo === 'pdf';

  const iconoModal = (
    <div className="icon-circle-badge slate-badge">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={factura.archivo_nombre || 'Visor de Comprobante'}
      subtitle={`Asociado a: ${factura.cliente_nombre}`}
      icon={iconoModal}
      cardClassName="modal-card-lg"
      footer={
        <>
          <button type="button" className="btn-secondary-action" onClick={onClose}>
            Cerrar
          </button>
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => exportarComprobanteIndividualPDF(factura)}
            id="btn-modal-pdf-factura"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Generar PDF</span>
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => descargarArchivo(factura)}
            id="btn-modal-descargar-factura"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Descargar Archivo</span>
          </button>
        </>
      }
    >
      <div className="lightbox-content">
        {/* Metadatos Superiores */}
        <div className="lightbox-info-grid">
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Categoría:</span>
            <div style={{ marginTop: '0.2rem' }}>
              <span className={`factura-badge-cat ${catInfo.className}`} style={{ position: 'static' }}>
                {catInfo.label}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Cliente:</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-texto-principal)', display: 'block' }}>
              {factura.cliente_nombre}
            </span>
          </div>

          {factura.referencia_id && (
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Referencia:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-dorado)', display: 'block' }}>
                {factura.referencia_id}
              </span>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Fecha de Emisión:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-principal)', display: 'block' }}>
              {formatFecha(factura.fecha_emision)}
            </span>
          </div>

          {factura.monto && (
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Monto:</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#88c985', display: 'block' }}>
                {formatMoneda(factura.monto)}
              </span>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-texto-apagado)', textTransform: 'uppercase' }}>Tamaño:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-texto-secundario)', display: 'block' }}>
              {formatBytes(factura.archivo_size)}
            </span>
          </div>
        </div>

        {/* Visor Multimedia */}
        <div className="lightbox-media-container">
          {!esPdf && factura.archivo_data ? (
            <img
              src={factura.archivo_data}
              alt={factura.archivo_nombre || 'Comprobante'}
              className="lightbox-image"
            />
          ) : esPdf && factura.archivo_data ? (
            <iframe
              src={factura.archivo_data}
              title={factura.archivo_nombre || 'Documento PDF'}
              className="lightbox-pdf-frame"
            />
          ) : (
            <div style={{ padding: '3rem', color: 'var(--color-texto-apagado)' }}>
              No se pudo cargar la vista previa del archivo.
            </div>
          )}
        </div>

        {factura.notas && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--color-texto-apagado)' }}>Observaciones: </span>
            <span style={{ color: 'var(--color-texto-principal)' }}>{factura.notas}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
