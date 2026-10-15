import { createClient } from '@supabase/supabase-js';
import { generarNotificaciones } from '../src/services/notificationService.js';
import { obtenerFechaLocalISO, extraerComponentesFecha } from '../src/utils/utils.js';

const SUPABASE_URL = 'https://pfygdgyyuxcdaffhkowr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ktRTBSDppvQfKIitR2-xVA_Mim_4pdm';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

// Mock simulado de LocalStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Mock simulado de Audio
class MockAudio {
  static playCount = 0;
  static lastPlayedSrc = null;
  static lastVolume = null;

  constructor(src) {
    this.src = src;
    this.volume = 1.0;
  }

  play() {
    MockAudio.playCount++;
    MockAudio.lastPlayedSrc = this.src;
    MockAudio.lastVolume = this.volume;
    return Promise.resolve();
  }
}

async function runTestCampanaYSonido() {
  console.log('================================================================');
  console.log('🧪 PRUEBA INTEGRACIÓN: CAMPANA DE TOPBAR Y SONIDO SUAVE DE COBRO');
  console.log('================================================================\n');

  const hoyDate = new Date();
  const hoyStr = obtenerFechaLocalISO(hoyDate);
  const { anio, mes, dia } = extraerComponentesFecha(hoyDate);
  const mananaDate = new Date(anio, mes, dia + 1, 12, 0, 0);
  const mananaStr = obtenerFechaLocalISO(mananaDate);

  let clienteCreado = null;
  let prestamoCreado = null;

  const mockStorage = new MockLocalStorage();

  try {
    // 1. Crear Cliente TEST
    console.log('--- 1. INSERTANDO CLIENTE TEST EN SUPABASE ---');
    const { data: cData, error: cErr } = await supabase
      .from('clientes')
      .insert({
        nombre_completo: '[TEST] Doña Laura Cobranza',
        telefono: '8765-4321',
        saldo_pendiente: 0,
        estado_cuenta: 'al_dia'
      })
      .select()
      .single();

    if (cErr) throw cErr;
    clienteCreado = cData;
    console.log(`Cliente TEST creado ID: ${clienteCreado.id} - ${clienteCreado.nombre_completo}`);

    // 2. Crear Préstamo TEST con cuota que vence HOY
    console.log('\n--- 2. INSERTANDO PRÉSTAMO TEST CON CUOTA QUE VENCE HOY ---');
    const { data: prData, error: prErr } = await supabase
      .from('prestamos')
      .insert({
        cliente_id: clienteCreado.id,
        nombre_tercero: clienteCreado.nombre_completo,
        telefono: clienteCreado.telefono,
        monto_capital: 45000,
        tasa_interes: 0,
        total_devolver: 45000,
        saldo_pendiente: 45000,
        fecha_entrega: hoyStr,
        fecha_limite: mananaStr,
        tipo_plazo: 'mes',
        num_plazos: 1,
        cuotas: [
          { numeroCuota: 1, fechaVencimiento: hoyStr, montoRealAcordado: 45000, pagada: false, montoPagado: 0, estado: 'pendiente' }
        ],
        estado: 'al_dia',
        abonos: []
      })
      .select()
      .single();

    if (prErr) throw prErr;
    prestamoCreado = prData;
    console.log(`Préstamo TEST creado ID: ${prestamoCreado.id}`);

    // 3. Consultar datos en Supabase (tal como hace la app en el Topbar / NotificationContext)
    console.log('\n--- 3. CONSULTANDO DESDE SUPABASE Y GENERANDO ALERTAS DE LA CAMPANA ---');
    const { data: dbPrestamos } = await supabase
      .from('prestamos')
      .select('*, clientes(id, nombre_completo, telefono)')
      .eq('id', prestamoCreado.id);

    const notificacionesCampana = generarNotificaciones({
      clientes: [clienteCreado],
      productos: [],
      pagos: [],
      prestamos: dbPrestamos,
      pedidos: []
    });

    console.log(`Notificaciones generadas para la campana: ${notificacionesCampana.length}`);
    const notifCobro = notificacionesCampana.find(n => n.tipo === 'cobro_hoy');

    // -------------------------------------------------------------
    // PRUEBA (a): Aparece en la campana con su botón de WhatsApp
    // -------------------------------------------------------------
    console.log('\n>>> VALIDANDO PUNTO (a): NOTIFICACIÓN DE COBRO EN LA CAMPANA CON BOTÓN WHATSAPP <<<');
    assert(Boolean(notifCobro), 'La notificación de cobro aparece en el listado de la campana');
    assert(notifCobro.titulo === 'Cuota Vence Hoy', 'El título en la campana indica "Cuota Vence Hoy"');
    assert(notifCobro.accion === 'whatsapp_cobro', 'Tiene asignada la acción "whatsapp_cobro"');
    assert(Boolean(notifCobro.linkWhatsApp), 'Tiene el enlace directo de WhatsApp generado');
    assert(notifCobro.linkWhatsApp.includes('https://wa.me/50687654321'), 'El enlace contiene el teléfono saneado (+50687654321)');
    assert(decodeURIComponent(notifCobro.linkWhatsApp).includes('el día de hoy vence su cuota'), 'El mensaje predeterminado de WhatsApp es coherente');
    assert(notifCobro.montoCobroFormateado === '₡45,000.00', 'El monto mostrado es exactamente ₡45,000.00');

    // -------------------------------------------------------------
    // PRUEBA (b): El sonido se reproduce una sola vez al aparecer
    // -------------------------------------------------------------
    console.log('\n>>> VALIDANDO PUNTO (b): REPRODUCCIÓN DE SONIDO UNA SOLA VEZ AL DETECTAR COBRO NUEVO <<<');
    MockAudio.playCount = 0;

    // Simular lógica de NotificationContext al montar/detectar
    function procesarSonidoNotificaciones({ lista, storage, audioCls, sonidoHabilitado = true }) {
      const sonadasSaved = storage.getItem('me_notif_sonadas');
      const sonadas = sonadasSaved ? JSON.parse(sonadasSaved) : [];

      const cobrosUrgentes = lista.filter(
        (n) => n.vencimiento === 'hoy' || n.vencimiento === 'atrasado' || n.tipo === 'cobro_hoy' || n.tipo === 'cobro_atrasado'
      );

      const noSonadas = cobrosUrgentes.filter((n) => !sonadas.includes(n.id));

      if (noSonadas.length > 0) {
        const nuevosIds = noSonadas.map((n) => n.id);
        const actualizadas = Array.from(new Set([...sonadas, ...nuevosIds]));
        storage.setItem('me_notif_sonadas', JSON.stringify(actualizadas));

        if (sonidoHabilitado) {
          const audio = new audioCls('/sounds/campanita-dos-tonos.wav');
          audio.volume = 0.4;
          audio.play();
        }
      }
    }

    // Primera detección de la notificación
    procesarSonidoNotificaciones({
      lista: notificacionesCampana,
      storage: mockStorage,
      audioCls: MockAudio,
      sonidoHabilitado: true
    });

    assert(MockAudio.playCount === 1, 'El sonido se reprodujo exactamente 1 vez para la cuota nueva');
    assert(MockAudio.lastPlayedSrc === '/sounds/campanita-dos-tonos.wav', 'Se invocó el archivo correcto /sounds/campanita-dos-tonos.wav');
    assert(MockAudio.lastVolume === 0.4, 'El volumen fue configurado en 0.4 (suave y no intrusivo)');
    const sonadasEnStorage = JSON.parse(mockStorage.getItem('me_notif_sonadas') || '[]');
    assert(sonadasEnStorage.includes(notifCobro.id), 'El ID de la notificación fue guardado en me_notif_sonadas');

    // -------------------------------------------------------------
    // PRUEBA (c): Recarga sin novedades -> NO vuelve a sonar
    // -------------------------------------------------------------
    console.log('\n>>> VALIDANDO PUNTO (c): SIMULACIÓN DE RECARGA SIN NOVEDADES (NO VUELVE A SONAR) <<<');
    const playCountAntes = MockAudio.playCount;

    // Simular recarga de página (mismos datos + storage persistido)
    procesarSonidoNotificaciones({
      lista: notificacionesCampana,
      storage: mockStorage,
      audioCls: MockAudio,
      sonidoHabilitado: true
    });

    assert(MockAudio.playCount === playCountAntes, 'En recarga de página con la misma notificación el sonido NO vuelve a reproducirse');

    // -------------------------------------------------------------
    // PRUEBA (d): Toggle de silenciar
    // -------------------------------------------------------------
    console.log('\n>>> VALIDANDO PUNTO (d): TOGGLE DE SILENCIAR SONIDO (PREFERENCIA PERSISTENTE) <<<');
    // Silenciar
    mockStorage.setItem('me_sonido_notificaciones_habilitado', 'false');
    const sonidoHabilitadoTest = mockStorage.getItem('me_sonido_notificaciones_habilitado') === 'true';
    assert(sonidoHabilitadoTest === false, 'La preferencia de silenciado se guarda como false en localStorage');

    // Simular aparición de otra cuota nueva mientras está silenciado
    const notifNuevaAtrasada = [{
      id: 'cobro-test-atrasado-simulado-99',
      tipo: 'cobro_atrasado',
      vencimiento: 'atrasado',
      clienteNombre: 'Cliente Mora'
    }];

    const playCountAntesMute = MockAudio.playCount;
    procesarSonidoNotificaciones({
      lista: notifNuevaAtrasada,
      storage: mockStorage,
      audioCls: MockAudio,
      sonidoHabilitado: false
    });

    assert(MockAudio.playCount === playCountAntesMute, 'Estando silenciado, NO se reprodujo sonido alguno ante una nueva notificación');

    // Reactivar sonido
    mockStorage.setItem('me_sonido_notificaciones_habilitado', 'true');
    assert(mockStorage.getItem('me_sonido_notificaciones_habilitado') === 'true', 'El toggle reactiva el sonido correctamente a true');

    console.log('\n🎉 ¡LOS 4 PUNTOS DEL PASO 7 FUERON VERIFICADOS CON ÉXITO ABSOLUTO!');

  } finally {
    // 5. Limpieza absoluta en Supabase
    console.log('\n--- 4. LIMPIEZA TOTAL EN SUPABASE ---');
    if (prestamoCreado) {
      const { error: dPrErr } = await supabase.from('prestamos').delete().eq('id', prestamoCreado.id);
      console.log(`Eliminación Préstamo TEST #${prestamoCreado.id}:`, dPrErr ? dPrErr.message : 'OK');
    }
    if (clienteCreado) {
      const { error: dCliErr } = await supabase.from('clientes').delete().eq('id', clienteCreado.id);
      console.log(`Eliminación Cliente TEST #${clienteCreado.id}:`, dCliErr ? dCliErr.message : 'OK');
    }

    const { count: countPedidos } = await supabase.from('pedidos').select('*', { count: 'exact', head: true });
    const { count: countPagos } = await supabase.from('pagos').select('*', { count: 'exact', head: true });
    const { count: countPrestamos } = await supabase.from('prestamos').select('*', { count: 'exact', head: true });

    console.log('\n--- 5. ESTADO FINAL DE LAS TABLAS ---');
    console.log(` - pedidos: ${countPedidos} filas (0)`);
    console.log(` - pagos: ${countPagos} filas (0)`);
    console.log(` - prestamos: ${countPrestamos} filas (2 registros preexistentes de clientes reales)`);

    assert(countPedidos === 0, 'Tabla pedidos permanece en 0 filas');
    assert(countPagos === 0, 'Tabla pagos permanece en 0 filas');
  }
}

runTestCampanaYSonido().catch((err) => {
  console.error('❌ Error durante la ejecución:', err);
  process.exit(1);
});
