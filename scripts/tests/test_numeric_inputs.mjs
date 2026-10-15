// Simulación de los manejadores desacoplados de inputs numéricos

function testHandlers() {
  console.log('--- Test 1: handleCantidad (Ventas) ---');
  let cantidad = 1;
  const stockDisponible = 10;
  
  const handleCantidadChange = (val) => {
    if (val === '') {
      cantidad = '';
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      cantidad = parsed;
    }
  };

  const handleCantidadBlur = () => {
    if (cantidad === '' || Number(cantidad) < 1) {
      cantidad = 1;
    } else if (stockDisponible > 0 && Number(cantidad) > stockDisponible) {
      cantidad = stockDisponible;
    }
  };

  // Usuario presiona Backspace en un campo con '1'
  handleCantidadChange('');
  console.log('Tras Backspace (debe ser ""):', JSON.stringify(cantidad));
  if (cantidad !== '') throw new Error('Falló Backspace: no quedó vacío');

  // Usuario escribe '3' en el campo vacío
  handleCantidadChange('3');
  console.log('Tras escribir "3" (debe ser 3):', cantidad);
  if (cantidad !== 3) throw new Error('Falló escritura');

  // Usuario borra todo y desenfoca (blur)
  handleCantidadChange('');
  handleCantidadBlur();
  console.log('Tras desenfocar campo vacío (debe ser 1):', cantidad);
  if (cantidad !== 1) throw new Error('Falló blur');

  // Usuario intenta escribir más del stock y desenfoca
  handleCantidadChange('99');
  handleCantidadBlur();
  console.log('Tras superar stock y desenfocar (debe ser 10):', cantidad);
  if (cantidad !== 10) throw new Error('Falló límite de stock');

  console.log('--- Test 2: handleNumPlazos (Préstamos y Ventas) ---');
  let numPlazos = 2;

  const handleNumPlazosChange = (val) => {
    if (val === '') {
      numPlazos = '';
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      numPlazos = parsed;
    }
  };

  const handleNumPlazosBlur = () => {
    if (numPlazos === '' || Number(numPlazos) < 1) {
      numPlazos = 1;
    }
  };

  // Usuario borra el 2
  handleNumPlazosChange('');
  console.log('Tras Backspace (debe ser ""):', JSON.stringify(numPlazos));
  if (numPlazos !== '') throw new Error('Falló Backspace');

  // Usuario escribe '4'
  handleNumPlazosChange('4');
  console.log('Tras escribir "4" (debe ser 4):', numPlazos);
  if (numPlazos !== 4) throw new Error('Falló escritura');

  // Usuario borra y sale
  handleNumPlazosChange('');
  handleNumPlazosBlur();
  console.log('Tras desenfocar vacío (debe ser 1):', numPlazos);
  if (numPlazos !== 1) throw new Error('Falló blur');

  console.log('\nTodos los tests pasaron exitosamente!');
}

testHandlers();
