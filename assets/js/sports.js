// Catálogo por deporte: posiciones, estadísticas que se registran por jugador
// y los indicadores (KPI) que se calculan para el tablero.
// Cada métrica: k = clave guardada en la tabla estadisticas, l = nombre, c = abreviatura de columna.

const FUTBOL_METRICAS = [
  { k: 'goles', l: 'Goles', c: 'Gol' },
  { k: 'asistencias', l: 'Asistencias', c: 'Asis' },
  { k: 'remates', l: 'Remates', c: 'Rem' },
  { k: 'remates_arco', l: 'Remates al arco', c: 'Arco' },
  { k: 'faltas', l: 'Faltas cometidas', c: 'Falt' },
  { k: 'amarillas', l: 'Tarjetas amarillas', c: 'TA' },
  { k: 'rojas', l: 'Tarjetas rojas', c: 'TR' },
  { k: 'atajadas', l: 'Atajadas', c: 'Ataj' },
];

export const DEPORTES = {
  futbol11: {
    nombre: 'Fútbol 11',
    anota: 'goles',
    empates: true,
    posiciones: ['Portero', 'Defensa central', 'Lateral', 'Volante de marca', 'Volante', 'Extremo', 'Delantero'],
    metricas: [...FUTBOL_METRICAS, { k: 'minutos', l: 'Minutos jugados', c: 'Min' }],
  },
  futbol_sala: {
    nombre: 'Fútbol sala',
    anota: 'goles',
    empates: true,
    posiciones: ['Portero', 'Cierre', 'Ala', 'Pívot', 'Universal'],
    metricas: FUTBOL_METRICAS,
  },
  baloncesto: {
    nombre: 'Baloncesto',
    anota: 'puntos',
    empates: false,
    posiciones: ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'],
    metricas: [
      { k: 't2', l: 'Dobles anotados', c: '2A' },
      { k: 't2_int', l: 'Dobles intentados', c: '2I' },
      { k: 't3', l: 'Triples anotados', c: '3A' },
      { k: 't3_int', l: 'Triples intentados', c: '3I' },
      { k: 'tl', l: 'Tiros libres anotados', c: 'TLA' },
      { k: 'tl_int', l: 'Tiros libres intentados', c: 'TLI' },
      { k: 'rebotes', l: 'Rebotes', c: 'Reb' },
      { k: 'asistencias', l: 'Asistencias', c: 'Asis' },
      { k: 'robos', l: 'Robos', c: 'Rob' },
      { k: 'tapones', l: 'Tapones', c: 'Tap' },
      { k: 'perdidas', l: 'Pérdidas', c: 'Pérd' },
      { k: 'faltas', l: 'Faltas personales', c: 'Falt' },
      { k: 'minutos', l: 'Minutos jugados', c: 'Min' },
    ],
  },
  voleibol: {
    nombre: 'Voleibol',
    anota: 'sets',
    empates: false,
    posiciones: ['Armador', 'Opuesto', 'Punta receptor', 'Central', 'Líbero'],
    metricas: [
      { k: 'ataque_pts', l: 'Puntos de ataque', c: 'Atq' },
      { k: 'ataque_err', l: 'Errores de ataque', c: 'E.Atq' },
      { k: 'bloqueos', l: 'Puntos de bloqueo', c: 'Bloq' },
      { k: 'aces', l: 'Aces (saque directo)', c: 'Ace' },
      { k: 'saque_err', l: 'Errores de saque', c: 'E.Saq' },
      { k: 'recepciones', l: 'Recepciones', c: 'Rec' },
      { k: 'recepcion_err', l: 'Errores de recepción', c: 'E.Rec' },
      { k: 'defensas', l: 'Defensas', c: 'Def' },
      { k: 'colocaciones', l: 'Colocaciones (asistencias)', c: 'Col' },
    ],
  },
  balonmano: {
    nombre: 'Balonmano',
    anota: 'goles',
    empates: true,
    posiciones: ['Portero', 'Central', 'Lateral', 'Extremo', 'Pivote'],
    metricas: [
      { k: 'goles', l: 'Goles', c: 'Gol' },
      { k: 'lanzamientos', l: 'Lanzamientos', c: 'Lanz' },
      { k: 'asistencias', l: 'Asistencias', c: 'Asis' },
      { k: 'paradas', l: 'Paradas (portero)', c: 'Par' },
      { k: 'robos', l: 'Robos', c: 'Rob' },
      { k: 'perdidas', l: 'Pérdidas', c: 'Pérd' },
      { k: 'exclusiones', l: 'Exclusiones 2 min', c: '2 min' },
      { k: 'amarillas', l: 'Tarjetas amarillas', c: 'TA' },
      { k: 'rojas', l: 'Tarjetas rojas', c: 'TR' },
    ],
  },
};

export const CATEGORIAS = { femenino: 'Femenino', masculino: 'Masculino' };
export const CONDICIONES = { local: 'Local', visitante: 'Visitante', neutral: 'Neutral' };

export const deporte = (k) => DEPORTES[k] || DEPORTES.futbol11;

// ---------------------------------------------------------------------------
// Cálculos
// ---------------------------------------------------------------------------

export const resultado = (p) => (p.marcador_favor > p.marcador_contra ? 'V' : p.marcador_favor < p.marcador_contra ? 'D' : 'E');
const div = (a, b) => (b > 0 ? a / b : null);
const sum = (arr, f) => arr.reduce((t, x) => t + (f ? f(x) : x), 0);

// Puntos de un jugador según el deporte (para "máximo anotador")
export function puntosJugador(dep, s) {
  const v = (k) => s[k] || 0;
  if (dep === 'baloncesto') return 2 * v('t2') + 3 * v('t3') + v('tl');
  if (dep === 'voleibol') return v('ataque_pts') + v('bloqueos') + v('aces');
  return v('goles');
}

// Valoración simple de baloncesto (estilo FIBA/PIR sin rebotes separados)
function valoracion(s) {
  const v = (k) => s[k] || 0;
  const pts = 2 * v('t2') + 3 * v('t3') + v('tl');
  const fallos = (v('t2_int') - v('t2')) + (v('t3_int') - v('t3')) + (v('tl_int') - v('tl'));
  return pts + v('rebotes') + v('asistencias') + v('robos') + v('tapones') - Math.max(0, fallos) - v('perdidas') - v('faltas');
}

// Agrega las filas de estadisticas: totales por jugador y por partido.
export function agregar(partidos, jugadores, filas) {
  const porJugador = new Map(jugadores.map((j) => [j.id, { jugador: j, pj: 0, tot: {} }]));
  const porPartido = new Map(partidos.map((p) => [p.id, {}]));
  const jugaron = new Map();
  for (const f of filas) {
    const v = Number(f.valor) || 0;
    const pj = porJugador.get(f.jugador_id);
    if (pj) pj.tot[f.metrica] = (pj.tot[f.metrica] || 0) + v;
    const pp = porPartido.get(f.partido_id);
    if (pp) pp[f.metrica] = (pp[f.metrica] || 0) + v;
    if (!jugaron.has(f.jugador_id)) jugaron.set(f.jugador_id, new Set());
    jugaron.get(f.jugador_id).add(f.partido_id);
  }
  for (const [id, set] of jugaron) { const pj = porJugador.get(id); if (pj) pj.pj = set.size; }
  return { porJugador: [...porJugador.values()], porPartido };
}

// Resumen de temporada: KPI, líderes y columnas para la tabla de jugadores.
export function resumen(equipo, partidos, jugadores, filas) {
  const dep = equipo.deporte;
  const ps = [...partidos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.creado_en?.localeCompare?.(b.creado_en || '') || 0);
  const pj = ps.length;
  const v = ps.filter((p) => resultado(p) === 'V').length;
  const e = ps.filter((p) => resultado(p) === 'E').length;
  const d = ps.filter((p) => resultado(p) === 'D').length;
  const favor = sum(ps, (p) => p.marcador_favor);
  const contra = sum(ps, (p) => p.marcador_contra);
  const { porJugador, porPartido } = agregar(ps, jugadores, filas);
  const tot = (k) => sum(porJugador, (x) => x.tot[k] || 0);
  const lider = (f, min = 1) => {
    const rows = porJugador.map((x) => ({ x, v: f(x) })).filter((r) => r.v != null && r.v >= min).sort((a, b) => b.v - a.v);
    return rows.length ? rows[0] : null;
  };
  const ranking = (f) => porJugador.map((x) => ({ label: nombreCorto(x.jugador), value: f(x) })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);

  const base = { pj, v, e, d, favor, contra, partidos: ps, porJugador, porPartido };
  const T = (k) => (x) => x.tot[k] || 0;

  if (dep === 'baloncesto') {
    const tcA = tot('t2') + tot('t3'), tcI = tot('t2_int') + tot('t3_int');
    return {
      ...base,
      registro: `${v} V · ${d} D`,
      kpis: [
        { l: 'Victorias', v: div(v, pj), f: 'pct0', sub: `${v} de ${pj}` },
        { l: 'Puntos por partido', v: div(favor, pj), f: 'dec1', sub: `${fmtDec1(div(contra, pj))} en contra` },
        { l: 'Diferencial por partido', v: div(favor - contra, pj), f: 'signed1' },
        { l: 'Tiros de campo', v: div(tcA, tcI), f: 'pct1', sub: `${tcA} de ${tcI}` },
        { l: 'Triples', v: div(tot('t3'), tot('t3_int')), f: 'pct1', sub: `${tot('t3')} de ${tot('t3_int')}` },
        { l: 'Tiros libres', v: div(tot('tl'), tot('tl_int')), f: 'pct1', sub: `${tot('tl')} de ${tot('tl_int')}` },
      ],
      extras: [
        { l: 'Rebotes por partido', v: div(tot('rebotes'), pj), f: 'dec1' },
        { l: 'Asistencias por partido', v: div(tot('asistencias'), pj), f: 'dec1' },
        { l: 'Pérdidas por partido', v: div(tot('perdidas'), pj), f: 'dec1' },
        { l: 'Asistencias por pérdida', v: div(tot('asistencias'), tot('perdidas')), f: 'dec2' },
      ],
      lideres: [
        { l: 'Máximo anotador', r: lider((x) => puntosJugador(dep, x.tot)), u: 'pts' },
        { l: 'Máximo reboteador', r: lider(T('rebotes')), u: 'reb' },
        { l: 'Máximo asistidor', r: lider(T('asistencias')), u: 'asis' },
        { l: 'Mejor valoración', r: lider((x) => valoracion(x.tot)), u: 'val' },
      ],
      ranking: { titulo: 'Puntos por jugador', filas: ranking((x) => puntosJugador(dep, x.tot)) },
      serie: { favor: 'Puntos a favor', contra: 'Puntos en contra' },
      columnas: [
        { l: 'Pts', f: (x) => puntosJugador(dep, x.tot) },
        { l: 'Pts/PJ', f: (x) => div(puntosJugador(dep, x.tot), x.pj), d: 1 },
        { l: 'Reb', f: T('rebotes') },
        { l: 'Asis', f: T('asistencias') },
        { l: 'Rob', f: T('robos') },
        { l: 'TC %', f: (x) => div((x.tot.t2 || 0) + (x.tot.t3 || 0), (x.tot.t2_int || 0) + (x.tot.t3_int || 0)), pct: true },
        { l: 'Val', f: (x) => valoracion(x.tot) },
      ],
    };
  }

  if (dep === 'voleibol') {
    const parciales = ps.flatMap((p) => p.parciales || []);
    const ptsFavor = sum(parciales, (s) => Number(s[0]) || 0), ptsContra = sum(parciales, (s) => Number(s[1]) || 0);
    const ataques = tot('ataque_pts') + tot('ataque_err');
    return {
      ...base,
      registro: `${v} V · ${d} D`,
      kpis: [
        { l: 'Victorias', v: div(v, pj), f: 'pct0', sub: `${v} de ${pj}` },
        { l: 'Sets ganados', v: favor, f: 'int', sub: `${contra} perdidos` },
        { l: 'Relación de sets', v: div(favor, contra), f: 'dec2', sub: 'ganados por perdido' },
        { l: 'Puntos por set', v: div(ptsFavor, parciales.length), f: 'dec1', sub: parciales.length ? `${fmtDec1(div(ptsContra, parciales.length))} del rival` : 'sin parciales' },
        { l: 'Acierto de ataque', v: div(tot('ataque_pts'), ataques), f: 'pct1', sub: `${tot('ataque_err')} errores` },
        { l: 'Balance de saque', v: tot('aces') - tot('saque_err'), f: 'signed0', sub: `${tot('aces')} aces · ${tot('saque_err')} errores` },
      ],
      extras: [
        { l: 'Bloqueos por set', v: div(tot('bloqueos'), favor + contra), f: 'dec2' },
        { l: 'Recepción sin error', v: div(tot('recepciones') - tot('recepcion_err'), tot('recepciones')), f: 'pct1' },
        { l: 'Defensas por partido', v: div(tot('defensas'), pj), f: 'dec1' },
        { l: 'Aces por partido', v: div(tot('aces'), pj), f: 'dec1' },
      ],
      lideres: [
        { l: 'Máximo anotador', r: lider((x) => puntosJugador(dep, x.tot)), u: 'pts' },
        { l: 'Mejor sacador', r: lider(T('aces')), u: 'aces' },
        { l: 'Mejor bloqueador', r: lider(T('bloqueos')), u: 'bloq' },
        { l: 'Mejor defensor', r: lider((x) => (x.tot.defensas || 0) + (x.tot.recepciones || 0) - (x.tot.recepcion_err || 0)), u: 'acciones' },
      ],
      ranking: { titulo: 'Puntos por jugador', filas: ranking((x) => puntosJugador(dep, x.tot)) },
      serie: { favor: 'Sets ganados', contra: 'Sets perdidos' },
      columnas: [
        { l: 'Pts', f: (x) => puntosJugador(dep, x.tot) },
        { l: 'Atq', f: T('ataque_pts') },
        { l: 'Acierto', f: (x) => div(x.tot.ataque_pts || 0, (x.tot.ataque_pts || 0) + (x.tot.ataque_err || 0)), pct: true },
        { l: 'Bloq', f: T('bloqueos') },
        { l: 'Ace', f: T('aces') },
        { l: 'E.Saq', f: T('saque_err') },
        { l: 'Def', f: T('defensas') },
      ],
    };
  }

  // Deportes de goles: fútbol 11, fútbol sala, balonmano
  const puntos = 3 * v + e;
  const invictas = ps.filter((p) => p.marcador_contra === 0).length;
  if (dep === 'balonmano') {
    return {
      ...base,
      registro: `${v} V · ${e} E · ${d} D`,
      kpis: [
        { l: 'Puntos', v: 2 * v + e, f: 'int', sub: `de ${2 * pj} posibles` },
        { l: 'Goles a favor por partido', v: div(favor, pj), f: 'dec1', sub: `${favor} en total` },
        { l: 'Goles en contra por partido', v: div(contra, pj), f: 'dec1', sub: `${contra} en total` },
        { l: 'Eficacia de lanzamiento', v: div(tot('goles'), tot('lanzamientos')), f: 'pct1', sub: `${tot('goles')} de ${tot('lanzamientos')}` },
        { l: 'Paradas del portero', v: div(tot('paradas'), tot('paradas') + contra), f: 'pct1', sub: `${tot('paradas')} paradas` },
        { l: 'Exclusiones por partido', v: div(tot('exclusiones'), pj), f: 'dec1' },
      ],
      extras: [
        { l: 'Diferencia de goles', v: favor - contra, f: 'signed0' },
        { l: 'Asistencias por partido', v: div(tot('asistencias'), pj), f: 'dec1' },
        { l: 'Robos por partido', v: div(tot('robos'), pj), f: 'dec1' },
        { l: 'Pérdidas por partido', v: div(tot('perdidas'), pj), f: 'dec1' },
      ],
      lideres: [
        { l: 'Máximo goleador', r: lider(T('goles')), u: 'goles' },
        { l: 'Máximo asistidor', r: lider(T('asistencias')), u: 'asis' },
        { l: 'Más paradas', r: lider(T('paradas')), u: 'paradas' },
        { l: 'Más robos', r: lider(T('robos')), u: 'robos' },
      ],
      ranking: { titulo: 'Goles por jugador', filas: ranking(T('goles')) },
      serie: { favor: 'Goles a favor', contra: 'Goles en contra' },
      columnas: [
        { l: 'Gol', f: T('goles') },
        { l: 'Gol/PJ', f: (x) => div(x.tot.goles || 0, x.pj), d: 1 },
        { l: 'Eficacia', f: (x) => div(x.tot.goles || 0, x.tot.lanzamientos || 0), pct: true },
        { l: 'Asis', f: T('asistencias') },
        { l: 'Par', f: T('paradas') },
        { l: '2 min', f: T('exclusiones') },
      ],
    };
  }

  return {
    ...base,
    registro: `${v} V · ${e} E · ${d} D`,
    kpis: [
      { l: 'Puntos', v: puntos, f: 'int', sub: `${fmtPct0(div(puntos, 3 * pj))} de ${3 * pj} posibles` },
      { l: 'Goles a favor', v: favor, f: 'int', sub: `${fmtDec1(div(favor, pj))} por partido` },
      { l: 'Goles en contra', v: contra, f: 'int', sub: `${fmtDec1(div(contra, pj))} por partido` },
      { l: 'Diferencia de goles', v: favor - contra, f: 'signed0' },
      { l: 'Vallas invictas', v: invictas, f: 'int', sub: `en ${pj} partidos` },
      { l: 'Efectividad de remate', v: div(tot('goles'), tot('remates')), f: 'pct1', sub: `${tot('goles')} goles en ${tot('remates')} remates` },
    ],
    extras: [
      { l: 'Remates al arco', v: div(tot('remates_arco'), tot('remates')), f: 'pct1' },
      { l: 'Faltas por partido', v: div(tot('faltas'), pj), f: 'dec1' },
      { l: 'Tarjetas amarillas', v: tot('amarillas'), f: 'int' },
      { l: 'Tarjetas rojas', v: tot('rojas'), f: 'int' },
    ],
    lideres: [
      { l: 'Máximo goleador', r: lider(T('goles')), u: 'goles' },
      { l: 'Máximo asistidor', r: lider(T('asistencias')), u: 'asis' },
      { l: 'Goles + asistencias', r: lider((x) => (x.tot.goles || 0) + (x.tot.asistencias || 0)), u: 'G+A' },
      { l: 'Más atajadas', r: lider(T('atajadas')), u: 'atajadas' },
    ],
    ranking: { titulo: 'Goles por jugador', filas: ranking(T('goles')) },
    serie: { favor: 'Goles a favor', contra: 'Goles en contra' },
    columnas: [
      { l: 'Gol', f: T('goles') },
      { l: 'Asis', f: T('asistencias') },
      { l: 'G+A/PJ', f: (x) => div((x.tot.goles || 0) + (x.tot.asistencias || 0), x.pj), d: 2 },
      { l: 'Rem', f: T('remates') },
      { l: 'Falt', f: T('faltas') },
      { l: 'TA', f: T('amarillas') },
      { l: 'TR', f: T('rojas') },
    ],
  };
}

// El hallazgo de la temporada: una frase para leer primero.
export function hallazgo(eq, r) {
  if (!r.pj) return 'Aún no hay partidos registrados. Registra el primero para ver el rendimiento.';
  const ultimos = r.partidos.slice(-5).map(resultado);
  let racha = 0; const ult = ultimos.at(-1);
  for (let i = r.partidos.length - 1; i >= 0 && resultado(r.partidos[i]) === ult; i--) racha++;
  const nombreRes = { V: ['victoria', 'victorias'], E: ['empate', 'empates'], D: ['derrota', 'derrotas'] }[ult];
  const frases = [];
  if (racha >= 2) frases.push(`${racha} ${nombreRes[1]} seguidas`);
  else frases.push(`Último partido: ${nombreRes[0]} ${r.partidos.at(-1).marcador_favor}–${r.partidos.at(-1).marcador_contra} ante ${r.partidos.at(-1).rival}`);
  const l = r.lideres[0];
  if (l?.r) {
    const totalEq = l.u === 'goles' ? r.favor : null;
    const share = totalEq ? ` (${fmtPct0(l.r.v / totalEq)} de los goles del equipo)` : '';
    frases.push(`${nombreCorto(l.r.x.jugador)} lidera con ${fmtInt(l.r.v)} ${l.u}${share}`);
  }
  return frases.join('. ') + '.';
}

export function nombreCorto(j) {
  if (!j) return '—';
  const partes = j.nombre.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[1][0]}.` : partes[0];
}

// ---------------------------------------------------------------------------
// Formatos (es-CO: coma decimal, punto de miles)
// ---------------------------------------------------------------------------
const nf = (o) => new Intl.NumberFormat('es-CO', o);
const MINUS = '−';
export const fmtInt = (x) => (x == null ? '—' : nf({ maximumFractionDigits: 0 }).format(x));
export const fmtDec1 = (x) => (x == null ? '—' : nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x));
export const fmtDec2 = (x) => (x == null ? '—' : nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x));
export const fmtPct0 = (x) => (x == null ? '—' : nf({ style: 'percent', maximumFractionDigits: 0 }).format(x));
export const fmtPct1 = (x) => (x == null ? '—' : nf({ style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(x));
const signed = (f) => (x) => (x == null ? '—' : (x > 0 ? '+' : x < 0 ? MINUS : '') + f(Math.abs(x)));
export const FORMATOS = { int: fmtInt, dec1: fmtDec1, dec2: fmtDec2, pct0: fmtPct0, pct1: fmtPct1, signed0: signed(fmtInt), signed1: signed(fmtDec1) };
export const formatear = (kpi) => FORMATOS[kpi.f](kpi.v);
