import { useState } from 'react';
import Modal from '../common/Modal';
import BirthdayDatePicker from '../common/BirthdayDatePicker';
import { useClients } from '../../context/ClientContext';
import { useToast } from '../common/Toast';

function ClientFormContent({ clientToEdit, onClose }) {
  const { agregarCliente, actualizarCliente } = useClients();
  const { showToast } = useToast();

  const [nombre, setNombre] = useState(() => clientToEdit?.nombre_completo || '');
  const [telefono, setTelefono] = useState(() => clientToEdit?.telefono || '');
  const [diaCumple, setDiaCumple] = useState(
    () => clientToEdit?.dia_cumpleanos || clientToEdit?.dia_cumple || null
  );
  const [mesCumple, setMesCumple] = useState(
    () => clientToEdit?.mes_cumpleanos || clientToEdit?.mes_cumple || null
  );
  const [errores, setErrores] = useState({});

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (val.length > 4) {
      val = val.slice(0, 4) + '-' + val.slice(4);
    }
    setTelefono(val);
    if (errores.telefono) {
      setErrores((prev) => ({ ...prev, telefono: '' }));
    }
  };

  const handleBirthdayChange = ({ dia, mes }) => {
    setDiaCumple(dia);
    setMesCumple(mes);
    if (errores.fecha_nacimiento) {
      setErrores((prev) => ({ ...prev, fecha_nacimiento: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!diaCumple || !mesCumple) {
      setErrores((prev) => ({
        ...prev,
        fecha_nacimiento: 'Por favor selecciona el día y mes de cumpleaños en el calendario.',
      }));
      return;
    }

    const nombresMeses = [
      '',
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const nombreMes = nombresMeses[Number(mesCumple)] || mesCumple;
    const fechaTexto = `${diaCumple} de ${nombreMes}`;

    const datos = {
      nombre_completo: nombre.trim(),
      telefono: telefono,
      dia_cumple: Number(diaCumple),
      mes_cumple: Number(mesCumple),
      dia_cumpleanos: Number(diaCumple),
      mes_cumpleanos: Number(mesCumple),
      fecha_nacimiento: fechaTexto,
      estado_cuenta: clientToEdit?.estado_cuenta || 'Sin deudas activas',
    };

    try {
      if (clientToEdit) {
        const res = await actualizarCliente(clientToEdit.id, datos);
        if (res && !res.success) {
          if (res.errores) setErrores(res.errores);
          else if (res.error) showToast({ tipo: 'error', mensaje: `Error: ${res.error}` });
          return;
        }
        showToast({
          tipo: 'success',
          mensaje: 'Cliente actualizado exitosamente.'
        });
      } else {
        const res = await agregarCliente(datos);
        if (res && !res.success) {
          if (res.errores) setErrores(res.errores);
          else if (res.error) showToast({ tipo: 'error', mensaje: `Error: ${res.error}` });
          return;
        }
        showToast({
          tipo: 'success',
          mensaje: 'Cliente registrado exitosamente.'
        });
      }

      setNombre('');
      setTelefono('');
      setDiaCumple(null);
      setMesCumple(null);
      setErrores({});

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      showToast({
        tipo: 'error',
        mensaje: 'Hubo un error al registrar el cliente. Por favor intenta de nuevo.'
      });
    }
  };

  return (
    <form id="form-cliente" onSubmit={handleSubmit} noValidate>
      {/* Campo 1: Nombre Completo */}
      <div className="form-group">
        <label htmlFor="nombre_completo" className="form-label">
          Nombre Completo <span className="required-star">*</span>
        </label>
        <input
          type="text"
          id="nombre_completo"
          className={`input-form ${errores.nombre_completo ? 'input-error' : ''}`}
          placeholder="Ej. Elena Rostrán"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (errores.nombre_completo) setErrores((prev) => ({ ...prev, nombre_completo: '' }));
          }}
          autoComplete="off"
        />
        {errores.nombre_completo && (
          <span className="input-error-msg visible">{errores.nombre_completo}</span>
        )}
      </div>

      {/* Campo 2: Teléfono */}
      <div className="form-group">
        <label htmlFor="telefono" className="form-label">
          Teléfono de Contacto <span className="required-star">*</span>
        </label>
        <input
          type="text"
          id="telefono"
          className={`input-form ${errores.telefono ? 'input-error' : ''}`}
          placeholder="Ej. 8845-1234 (8 dígitos)"
          value={telefono}
          onChange={handlePhoneChange}
          maxLength="9"
          autoComplete="off"
        />
        {errores.telefono && (
          <span className="input-error-msg visible">{errores.telefono}</span>
        )}
      </div>

      {/* Campo 3: Cumpleaños (Selector Visual de Día y Mes sin Año) */}
      <div className="form-group">
        <label className="form-label">
          Cumpleaños (Día y Mes) <span className="required-star">*</span>
        </label>

        <BirthdayDatePicker
          dia={diaCumple}
          mes={mesCumple}
          onChange={handleBirthdayChange}
          hasError={Boolean(errores.fecha_nacimiento)}
          placeholder="Seleccionar día y mes..."
        />

        {errores.fecha_nacimiento && (
          <span className="input-error-msg visible">{errores.fecha_nacimiento}</span>
        )}
      </div>

      <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem', padding: '1.1rem 1.5rem' }}>
        <button type="button" className="btn-secondary-action" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary-action">
          <span>{clientToEdit ? 'Actualizar Cambios' : 'Guardar Cliente'}</span>
        </button>
      </div>
    </form>
  );
}

export default function ClientModal({ isOpen, onClose, clientToEdit }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
      subtitle={
        clientToEdit
          ? 'Actualiza los datos del contacto comercial'
          : 'Ingresa la información requerida para el alta en el sistema.'
      }
      icon={
        <div className="icon-circle-badge rose-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      }
    >
      <ClientFormContent
        key={clientToEdit ? `edit-${clientToEdit.id}` : 'new-client'}
        clientToEdit={clientToEdit}
        onClose={onClose}
      />
    </Modal>
  );
}
