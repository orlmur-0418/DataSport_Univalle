// Motor de análisis: va más allá de los totales y explica qué decide los partidos,
// cuánto rinde el equipo frente a lo esperado, hacia dónde va y quién sube o baja.
// Todo se calcula con los datos que el profesor ya registra.
import { resultado, agregar, puntosJugador, nombreCorto, fmtInt, fmtDec1, fmtDec2, fmtPct0, fmtPct1 } from './sports.js';

const MINUS = '−';
const div = (a, b) => (b > 0 ? a / b : null);
const sum = (arr, f = (x) => x) => arr.reduce((t, x) => t + (f(x) || 0), 0);
const media = (arr) => (arr.length ? sum(arr) / arr.length : null);
const signo = (f) => (x) => (x == null ? '—' : (x > 0 ? '+' : x < 0 ? MINUS : '') + f(Math.abs(x)));
const v = (t, k) => t?.[k] || 0;

// ---------------------------------------------------------------------------
// Configuración por deporte
// ---------------------------------------------------------------------------
// Métricas de equipo por partido. f devuelve un número o [numerador, denominador]
// (los cocientes se agregan sumando partes, no promediando porcentajes).
// menos: true cuando un valor más bajo es mejor.
const FUTBOL_PARTIDO = [
  { l: 'Goles a favor', f: (p) => p.marcador_favor, d: 1, marcador: true },
  { l: 'Goles en contra', f: (p) => p.marcador_contra, d: 1, menos: true, marcador: true },
  { l: 'Remates', f: (p, t) => v(t, 'remates'), d: 1 },
  { l: 'Remates al arco', f: (p, t) => v(t, 'remates_arco'), d: 1 },
  { l: 'Conversión de remates', f: (p, t) => [v(t, 'goles'), v(t, 'remates')], pct: true },
  { l: 'Precisión (al arco / remates)', f: (p, t) => [v(t, 'remates_arco'), v(t, 'remates')], pct: true },
  { l: 'Faltas cometidas', f: (p, t) => v(t, 'faltas'), d: 1, menos: true },
  { l: 'Tarjetas amarillas', f: (p, t) => v(t, 'amarillas'), d: 1, menos: true },
  { l: 'Atajadas del portero', f: (p, t) => v(t, 'atajadas'), d: 1 },
];

const tiros = (t) => ({ fgm: v(t, 't2') + v(t, 't3'), fga: v(t, 't2_int') + v(t, 't3_int'), t3: v(t, 't3'), ftm: v(t, 'tl'), fta: v(t, 'tl_int'), pts: 2 * v(t, 't2') + 3 * v(t, 't3') + v(t, 'tl') });

const CFG = {
  baloncesto: {
    unidad: 'puntos', corto: 'pts', cerrado: 5,
    partido: [
      { l: 'Puntos a favor', f: (p) => p.marcador_favor, d: 1, marcador: true },
      { l: 'Puntos en contra', f: (p) => p.marcador_contra, d: 1, menos: true, marcador: true },
      { l: 'Tiro efectivo (eFG%)', f: (p, t) => { const x = tiros(t); return [x.fgm + 0.5 * x.t3, x.fga]; }, pct: true },
      { l: 'Tiro real (TS%)', f: (p, t) => { const x = tiros(t); return [x.pts, 2 * (x.fga + 0.44 * x.fta)]; }, pct: true },
      { l: 'Triples anotados', f: (p, t) => v(t, 't3'), d: 1 },
      { l: 'Tiros libres intentados', f: (p, t) => v(t, 'tl_int'), d: 1 },
      { l: 'Rebotes', f: (p, t) => v(t, 'rebotes'), d: 1 },
      { l: 'Asistencias', f: (p, t) => v(t, 'asistencias'), d: 1 },
      { l: 'Pérdidas', f: (p, t) => v(t, 'perdidas'), d: 1, menos: true },
      { l: 'Robos', f: (p, t) => v(t, 'robos'), d: 1 },
      { l: 'Tapones', f: (p, t) => v(t, 'tapones'), d: 1 },
      { l: 'Faltas personales', f: (p, t) => v(t, 'faltas'), d: 1, menos: true },
    ],
    // Game Score de John Hollinger, con rebotes totales (0,5 por rebote)
    indice: (t) => { const x = tiros(t); return x.pts + 0.4 * x.fgm - 0.7 * x.fga - 0.4 * (x.fta - x.ftm) + 0.5 * v(t, 'rebotes') + v(t, 'robos') + 0.7 * v(t, 'asistencias') + 0.7 * v(t, 'tapones') - 0.4 * v(t, 'faltas') - v(t, 'perdidas'); },
    indiceNombre: 'Game Score',
    indiceNota: 'Game Score de Hollinger: puntos + 0,4·tiros anotados − 0,7·tiros intentados − 0,4·libres fallados + 0,5·rebotes + robos + 0,7·asistencias + 0,7·tapones − 0,4·faltas − pérdidas.',
    porMinutos: 36,
    produccion: [
      { l: 'Pts/36', f: (t) => tiros(t).pts, rate: true },
      { l: 'Reb/36', f: (t) => v(t, 'rebotes'), rate: true },
      { l: 'Asis/36', f: (t) => v(t, 'asistencias'), rate: true },
      { l: 'TS%', f: (t) => { const x = tiros(t); return div(x.pts, 2 * (x.fga + 0.44 * x.fta)); }, pct: true },
      { l: 'eFG%', f: (t) => { const x = tiros(t); return div(x.fgm + 0.5 * x.t3, x.fga); }, pct: true },
      { l: 'Asis/Pérd', f: (t) => div(v(t, 'asistencias'), v(t, 'perdidas')), d: 2 },
    ],
    minMinutos: 60,
  },
  futbol11: {
    unidad: 'goles', corto: 'goles', cerrado: 1, partido: FUTBOL_PARTIDO,
    indice: (t) => v(t, 'goles') + 0.75 * v(t, 'asistencias') + 0.25 * v(t, 'remates_arco') + 0.2 * v(t, 'atajadas') - 0.5 * v(t, 'amarillas') - 2 * v(t, 'rojas'),
    indiceNombre: 'Índice de aporte',
    indiceNota: 'Índice de aporte: goles + 0,75·asistencias + 0,25·remates al arco + 0,2·atajadas − 0,5·amarillas − 2·rojas. Es una medida propia de la plataforma.',
    porMinutos: 90,
    produccion: [
      { l: 'Gol/90', f: (t) => v(t, 'goles'), rate: true, d: 2 },
      { l: 'Asis/90', f: (t) => v(t, 'asistencias'), rate: true, d: 2 },
      { l: 'Rem/90', f: (t) => v(t, 'remates'), rate: true, d: 1 },
      { l: 'Conversión', f: (t) => div(v(t, 'goles'), v(t, 'remates')), pct: true },
      { l: 'Min por gol', f: (t) => (v(t, 'goles') ? v(t, 'minutos') / v(t, 'goles') : null), d: 0 },
    ],
    minMinutos: 180,
  },
  futbol_sala: {
    unidad: 'goles', corto: 'goles', cerrado: 1, partido: FUTBOL_PARTIDO,
    indice: (t) => v(t, 'goles') + 0.75 * v(t, 'asistencias') + 0.25 * v(t, 'remates_arco') + 0.2 * v(t, 'atajadas') - 0.5 * v(t, 'amarillas') - 2 * v(t, 'rojas'),
    indiceNombre: 'Índice de aporte',
    indiceNota: 'Índice de aporte: goles + 0,75·asistencias + 0,25·remates al arco + 0,2·atajadas − 0,5·amarillas − 2·rojas. Es una medida propia de la plataforma.',
    produccion: [
      { l: 'Gol/PJ', f: (t) => v(t, 'goles'), perPJ: true, d: 2 },
      { l: 'Asis/PJ', f: (t) => v(t, 'asistencias'), perPJ: true, d: 2 },
      { l: 'Rem/PJ', f: (t) => v(t, 'remates'), perPJ: true, d: 1 },
      { l: 'Conversión', f: (t) => div(v(t, 'goles'), v(t, 'remates')), pct: true },
      { l: 'Precisión', f: (t) => div(v(t, 'remates_arco'), v(t, 'remates')), pct: true },
    ],
  },
  voleibol: {
    unidad: 'puntos', corto: 'pts', cerrado: null,
    partido: [
      { l: 'Sets ganados', f: (p) => p.marcador_favor, d: 1, marcador: true },
      { l: 'Puntos ganados del total', f: (p) => { const s = p.parciales || []; return [sum(s, (x) => +x[0]), sum(s, (x) => +x[0] + +x[1])]; }, pct: true, marcador: true },
      { l: 'Puntos de ataque', f: (p, t) => v(t, 'ataque_pts'), d: 1 },
      { l: 'Eficacia de ataque', f: (p, t) => [v(t, 'ataque_pts') - v(t, 'ataque_err'), v(t, 'ataque_pts') + v(t, 'ataque_err')], pct: true },
      { l: 'Errores de ataque', f: (p, t) => v(t, 'ataque_err'), d: 1, menos: true },
      { l: 'Puntos de bloqueo', f: (p, t) => v(t, 'bloqueos'), d: 1 },
      { l: 'Aces', f: (p, t) => v(t, 'aces'), d: 1 },
      { l: 'Errores de saque', f: (p, t) => v(t, 'saque_err'), d: 1, menos: true },
      { l: 'Errores de recepción', f: (p, t) => v(t, 'recepcion_err'), d: 1, menos: true },
      { l: 'Defensas', f: (p, t) => v(t, 'defensas'), d: 1 },
    ],
    indice: (t) => v(t, 'ataque_pts') + v(t, 'bloqueos') + v(t, 'aces') - v(t, 'ataque_err') - v(t, 'saque_err') - v(t, 'recepcion_err'),
    indiceNombre: 'Puntos netos',
    indiceNota: 'Puntos netos: puntos de ataque + bloqueos + aces − errores de ataque, saque y recepción.',
    produccion: [
      { l: 'Pts/PJ', f: (t) => v(t, 'ataque_pts') + v(t, 'bloqueos') + v(t, 'aces'), perPJ: true, d: 1 },
      { l: 'Netos/PJ', f: (t) => v(t, 'ataque_pts') + v(t, 'bloqueos') + v(t, 'aces') - v(t, 'ataque_err') - v(t, 'saque_err') - v(t, 'recepcion_err'), perPJ: true, d: 1 },
      { l: 'Ef. ataque', f: (t) => div(v(t, 'ataque_pts') - v(t, 'ataque_err'), v(t, 'ataque_pts') + v(t, 'ataque_err')), pct: true },
      { l: 'Ace/Error', f: (t) => div(v(t, 'aces'), v(t, 'saque_err')), d: 2 },
      { l: 'Recepción', f: (t) => div(v(t, 'recepciones') - v(t, 'recepcion_err'), v(t, 'recepciones')), pct: true },
    ],
  },
  balonmano: {
    unidad: 'goles', corto: 'goles', cerrado: 3,
    partido: [
      { l: 'Goles a favor', f: (p) => p.marcador_favor, d: 1, marcador: true },
      { l: 'Goles en contra', f: (p) => p.marcador_contra, d: 1, menos: true, marcador: true },
      { l: 'Eficacia de lanzamiento', f: (p, t) => [v(t, 'goles'), v(t, 'lanzamientos')], pct: true },
      { l: 'Paradas del portero', f: (p, t) => [v(t, 'paradas'), v(t, 'paradas') + p.marcador_contra], pct: true },
      { l: 'Lanzamientos', f: (p, t) => v(t, 'lanzamientos'), d: 1 },
      { l: 'Asistencias', f: (p, t) => v(t, 'asistencias'), d: 1 },
      { l: 'Robos', f: (p, t) => v(t, 'robos'), d: 1 },
      { l: 'Pérdidas', f: (p, t) => v(t, 'perdidas'), d: 1, menos: true },
      { l: 'Exclusiones de 2 min', f: (p, t) => v(t, 'exclusiones'), d: 1, menos: true },
    ],
    indice: (t) => v(t, 'goles') + 0.7 * v(t, 'asistencias') + v(t, 'robos') + 0.5 * v(t, 'paradas') - v(t, 'perdidas') - 0.5 * (v(t, 'lanzamientos') - v(t, 'goles')) - v(t, 'exclusiones'),
    indiceNombre: 'Índice de aporte',
    indiceNota: 'Índice de aporte: goles + 0,7·asistencias + robos + 0,5·paradas − pérdidas − 0,5·lanzamientos fallados − exclusiones. Es una medida propia de la plataforma.',
    produccion: [
      { l: 'Gol/PJ', f: (t) => v(t, 'goles'), perPJ: true, d: 1 },
      { l: 'Eficacia', f: (t) => div(v(t, 'goles'), v(t, 'lanzamientos')), pct: true },
      { l: 'Asis/PJ', f: (t) => v(t, 'asistencias'), perPJ: true, d: 1 },
      { l: 'Rob − Pérd', f: (t) => v(t, 'robos') - v(t, 'perdidas'), d: 0, signed: true },
      { l: 'Par/PJ', f: (t) => v(t, 'paradas'), perPJ: true, d: 1 },
    ],
  },
};

export const configAnalisis = (dep) => CFG[dep] || CFG.futbol11;

// ---------------------------------------------------------------------------
// Probabilidades para el rendimiento esperado
// ---------------------------------------------------------------------------
const poisson = (l, k) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
function poissonResultado(lf, lc) { // P(victoria), P(empate) con goles de Poisson
  let w = 0, d = 0;
  for (let a = 0; a <= 15; a++) for (let b = 0; b <= 15; b++) { const p = poisson(lf, a) * poisson(lc, b); if (a > b) w += p; else if (a === b) d += p; }
  return { w, d };
}
const phi = (x) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const dd = 0.3989423 * Math.exp(-x * x / 2); const p = dd * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
// Probabilidad de ganar un set a "meta" puntos (diferencia de 2) si se gana cada rally con prob. p
function probSet(p, meta) {
  const memo = new Map();
  const f = (a, b) => {
    if (a >= meta && a - b >= 2) return 1;
    if (b >= meta && b - a >= 2) return 0;
    if (a >= meta - 1 && b >= meta - 1 && a === b) return (p * p) / (p * p + (1 - p) * (1 - p)); // empate en ventaja
    const k = a + ',' + b; if (memo.has(k)) return memo.get(k);
    const r = p * f(a + 1, b) + (1 - p) * f(a, b + 1); memo.set(k, r); return r;
  };
  return f(0, 0);
}
function probPartidoVoley(p) { // al mejor de 5 sets, quinto a 15
  const s = probSet(p, 25), q = probSet(p, 15);
  const g3 = s ** 3, g4 = 3 * s ** 3 * (1 - s), g5 = 6 * s ** 2 * (1 - s) ** 2 * q;
  return g3 + g4 + g5;
}

// ---------------------------------------------------------------------------
// Análisis completo
// ---------------------------------------------------------------------------
export function analizar(eq, partidos, jugadores, filas) {
  const dep = eq.deporte, cfg = configAnalisis(dep);
  const ps = [...partidos].sort((a, b) => a.fecha.localeCompare(b.fecha) || String(a.creado_en).localeCompare(String(b.creado_en)));
  const pj = ps.length;
  const { porJugador, porPartido } = agregar(ps, jugadores, filas);
  const tot = (p) => porPartido.get(p.id) || {};
  const out = { pj, cfg, hallazgos: [], suficiente: pj >= 3 };
  if (!pj) return out;

  // ----- 1. Qué separa las victorias de las derrotas
  const V = ps.filter((p) => resultado(p) === 'V'), D = ps.filter((p) => resultado(p) === 'D'), E = ps.filter((p) => resultado(p) === 'E');
  const agregarMetrica = (m, lista) => {
    if (!lista.length) return null;
    const vals = lista.map((p) => m.f(p, tot(p)));
    if (Array.isArray(vals[0])) return div(sum(vals, (x) => x[0]), sum(vals, (x) => x[1]));
    return media(vals);
  };
  out.decide = { v: V.length, d: D.length, e: E.length, filas: [] };
  if (V.length >= 2 && D.length >= 2) {
    // tamaño del efecto: diferencia de medias dividida por la dispersión partido a partido,
    // así una métrica de pocas unidades (tarjetas) no pesa más que una de muchas (rebotes)
    const porP = (m, p) => { const x = m.f(p, tot(p)); return Array.isArray(x) ? (x[1] > 0 ? x[0] / x[1] : null) : x; };
    for (const m of cfg.partido) {
      const a = agregarMetrica(m, V), b = agregarMetrica(m, D);
      if (a == null || b == null) continue;
      const vals = ps.map((p) => porP(m, p)).filter((x) => x != null);
      const mu = media(vals), sd = Math.sqrt(media(vals.map((x) => (x - mu) ** 2)) || 0);
      if (!sd) continue;
      out.decide.filas.push({ ...m, enV: a, enD: b, brecha: (a - b) / sd });
    }
    out.decide.filas.sort((x, y) => Math.abs(y.brecha) - Math.abs(x.brecha));
    // la lectura destaca el indicador que más cambia y que acompaña a las victorias
    const top = out.decide.filas.find((x) => !x.marcador && Math.abs(x.brecha) >= 0.4 && (x.menos ? x.enV < x.enD : x.enV > x.enD));
    if (top) {
      const f = (x) => (top.pct ? fmtPct1(x) : fmtDec1(x));
      out.hallazgos.push({ tipo: 'decide', peso: 3, texto: `${top.l} es el indicador que más cambia entre ganar y perder: ${f(top.enV)} por partido en las victorias frente a ${f(top.enD)} en las derrotas.` });
    }
  }

  // ----- 2. Rendimiento esperado (¿los resultados reflejan el nivel?)
  const favor = sum(ps, (p) => p.marcador_favor), contra = sum(ps, (p) => p.marcador_contra);
  const puntosReales = dep === 'balonmano' ? 2 * V.length + E.length : dep.startsWith('futbol') ? 3 * V.length + E.length : V.length;
  if (pj >= 3) {
    let esperado = null, metodo = '', base = '';
    if (dep === 'baloncesto') {
      const x = 11.5; const pw = favor ** x / (favor ** x + contra ** x);
      esperado = pw * pj; metodo = 'Pitagórica (exponente 11,5, usado en baloncesto universitario)'; base = `${fmtInt(favor)} puntos a favor y ${fmtInt(contra)} en contra`;
    } else if (dep.startsWith('futbol')) {
      const { w, d } = poissonResultado(favor / pj, contra / pj);
      esperado = (3 * w + d) * pj; metodo = 'Modelo de Poisson con los goles promedio a favor y en contra'; base = `${fmtDec1(favor / pj)} goles a favor y ${fmtDec1(contra / pj)} en contra por partido`;
    } else if (dep === 'balonmano') {
      const dif = ps.map((p) => p.marcador_favor - p.marcador_contra), mu = media(dif);
      const sd = Math.max(1.5, Math.sqrt(media(dif.map((x) => (x - mu) ** 2))));
      const w = 1 - phi((0.5 - mu) / sd), d = phi((0.5 - mu) / sd) - phi((-0.5 - mu) / sd);
      esperado = (2 * w + d) * pj; metodo = 'Distribución normal de la diferencia de goles por partido'; base = `una diferencia media de ${signo(fmtDec1)(mu)} goles`;
    } else if (dep === 'voleibol') {
      const pf = sum(ps, (p) => sum(p.parciales || [], (s) => +s[0])), pc = sum(ps, (p) => sum(p.parciales || [], (s) => +s[1]));
      if (pf + pc > 0) { const r = pf / (pf + pc); esperado = probPartidoVoley(r) * pj; metodo = 'Probabilidad de ganar cada rally aplicada a sets a 25 y quinto set a 15'; base = `${fmtPct1(r)} de los rallies ganados`; }
    }
    if (esperado != null) {
      const unidad = dep === 'voleibol' || dep === 'baloncesto' ? 'victorias' : 'puntos';
      const delta = puntosReales - esperado;
      out.esperado = { esperado, real: puntosReales, delta, unidad, metodo, base, maximo: dep === 'balonmano' ? 2 * pj : dep.startsWith('futbol') ? 3 * pj : pj };
      const umbral = unidad === 'victorias' ? 0.75 : 2;
      const lectura = delta > umbral ? `suma más de lo que su juego sugiere (${signo(fmtDec1)(delta)}): está ganando los partidos ajustados, algo que suele no sostenerse` : delta < -umbral ? `suma menos de lo que su juego sugiere (${signo(fmtDec1)(delta)}): merece mejores resultados y es esperable que mejoren` : 'tiene los resultados que corresponden a su nivel de juego';
      out.esperado.lectura = lectura;
      out.hallazgos.push({ tipo: 'esperado', peso: Math.abs(delta) > umbral ? 3 : 1, texto: `Con ${base}, lo esperable eran ${fmtDec1(esperado)} ${unidad}; lleva ${fmtInt(puntosReales)}. El equipo ${lectura}.` });
    }
  }

  // ----- 3. Tendencia: diferencia por partido y media móvil de 3
  const difDe = (p) => (dep === 'voleibol' && p.parciales?.length ? sum(p.parciales, (s) => +s[0] - +s[1]) : p.marcador_favor - p.marcador_contra);
  const difs = ps.map(difDe);
  const movil = difs.map((_, i) => (i < 2 ? null : media(difs.slice(i - 2, i + 1))));
  out.tendencia = { labels: ps.map((p) => p.fecha), difs, movil, unidad: dep === 'voleibol' ? 'puntos' : cfg.unidad };
  if (pj >= 5) {
    const ult = media(difs.slice(-3)), temp = media(difs);
    out.tendencia.ultimos = ult; out.tendencia.temporada = temp;
    const cambio = ult - temp, ref = Math.max(1, Math.abs(temp), dep === 'baloncesto' || dep === 'voleibol' ? 4 : 0.6);
    if (Math.abs(cambio) / ref > 0.35) out.hallazgos.push({ tipo: 'tendencia', peso: 2, texto: `${cambio > 0 ? 'Tendencia al alza' : 'Tendencia a la baja'}: en los últimos 3 partidos la diferencia media es ${signo(fmtDec1)(ult)} ${out.tendencia.unidad}, frente a ${signo(fmtDec1)(temp)} en la temporada.` });
  }

  // ----- 4. Contexto: local/visitante, partidos cerrados, primer set
  const registro = (lista) => ({ v: lista.filter((p) => resultado(p) === 'V').length, e: lista.filter((p) => resultado(p) === 'E').length, d: lista.filter((p) => resultado(p) === 'D').length, n: lista.length });
  const ctx = [];
  const loc = ps.filter((p) => p.condicion === 'local'), vis = ps.filter((p) => p.condicion === 'visitante');
  ctx.push({ l: 'Como local', r: registro(loc), dif: loc.length ? media(loc.map(difDe)) : null });
  ctx.push({ l: 'Como visitante', r: registro(vis), dif: vis.length ? media(vis.map(difDe)) : null });
  let cerrados;
  if (dep === 'voleibol') { cerrados = ps.filter((p) => p.marcador_favor + p.marcador_contra === 5); ctx.push({ l: 'Partidos a 5 sets', r: registro(cerrados), dif: null }); }
  else { cerrados = ps.filter((p) => Math.abs(p.marcador_favor - p.marcador_contra) <= cfg.cerrado); ctx.push({ l: `Partidos cerrados (≤${cfg.cerrado} ${cfg.corto})`, r: registro(cerrados), dif: null }); }
  const abiertos = ps.filter((p) => !cerrados.includes(p));
  ctx.push({ l: 'Partidos con diferencia amplia', r: registro(abiertos), dif: abiertos.length ? media(abiertos.map(difDe)) : null });
  out.contexto = ctx;
  const pctV = (r) => (r.n ? (r.v + 0.5 * r.e) / r.n : null);
  if (loc.length >= 2 && vis.length >= 2) {
    const a = pctV(registro(loc)), b = pctV(registro(vis));
    if (Math.abs(a - b) >= 0.25) out.hallazgos.push({ tipo: 'contexto', peso: 2, texto: `${a > b ? 'Rinde mucho mejor en casa' : 'Rinde mejor de visitante'}: ${fmtRegistro(registro(loc), dep)} como local y ${fmtRegistro(registro(vis), dep)} como visitante.` });
  }
  if (cerrados.length >= 2) {
    const r = registro(cerrados);
    out.hallazgos.push({ tipo: 'cerrados', peso: r.v === 0 || r.d === 0 ? 2 : 1, texto: `En ${dep === 'voleibol' ? 'partidos que llegan al quinto set' : 'partidos cerrados'} el registro es ${fmtRegistro(r, dep)}${r.d > r.v ? ': el equipo suele perder los finales ajustados' : r.v > r.d ? ': el equipo sabe cerrar los partidos ajustados' : ''}.` });
  }
  if (dep === 'voleibol') {
    const conSets = ps.filter((p) => p.parciales?.length);
    const porSet = [0, 1, 2, 3, 4].map((i) => { const s = conSets.map((p) => p.parciales[i]).filter(Boolean); return { n: s.length, g: s.filter((x) => +x[0] > +x[1]).length }; }).filter((x) => x.n);
    out.sets = porSet.map((x, i) => ({ label: `Set ${i + 1}`, n: x.n, g: x.g, pct: x.g / x.n }));
    const gana1 = conSets.filter((p) => +p.parciales[0][0] > +p.parciales[0][1]), pierde1 = conSets.filter((p) => +p.parciales[0][0] < +p.parciales[0][1]);
    out.primerSet = { gana: registro(gana1), pierde: registro(pierde1) };
    if (gana1.length && pierde1.length) out.hallazgos.push({ tipo: 'sets', peso: 2, texto: `Ganando el primer set: ${fmtRegistro(registro(gana1), dep)}. Perdiéndolo: ${fmtRegistro(registro(pierde1), dep)}.` });
    const peor = [...out.sets].filter((x) => x.n >= 3).sort((a, b) => a.pct - b.pct)[0];
    if (peor && peor.pct < 0.5) out.hallazgos.push({ tipo: 'sets', peso: 1, texto: `El ${peor.label.toLowerCase()} es el más difícil: gana ${fmtInt(peor.g)} de ${fmtInt(peor.n)} (${fmtPct0(peor.pct)}).` });
  }

  // ----- 5. Eficiencia y origen de la producción
  out.eficiencia = eficiencia(dep, ps, porJugador, porPartido, favor, contra);

  // ----- 6. Jugadores: forma reciente con el índice de cada deporte
  const statsJP = new Map(); // jugador -> partido -> métricas
  for (const f of filas) { if (!statsJP.has(f.jugador_id)) statsJP.set(f.jugador_id, new Map()); const m = statsJP.get(f.jugador_id); if (!m.has(f.partido_id)) m.set(f.partido_id, {}); m.get(f.partido_id)[f.metrica] = Number(f.valor); }
  out.forma = [];
  for (const x of porJugador) {
    const mp = statsJP.get(x.jugador.id); if (!mp) continue;
    const jugados = ps.filter((p) => mp.has(p.id));
    if (jugados.length < 3) continue;
    const serie = jugados.map((p) => cfg.indice(mp.get(p.id)));
    const temp = media(serie), ult = media(serie.slice(-3)), prev = jugados.length > 3 ? media(serie.slice(0, -3)) : temp;
    out.forma.push({ jugador: x.jugador, pj: jugados.length, temporada: temp, ultimos: ult, cambio: ult - prev, serie });
  }
  out.forma.sort((a, b) => b.temporada - a.temporada);
  const relevantes = out.forma.filter((f) => f.temporada >= Math.max(1, 0.25 * (out.forma[0]?.temporada || 0)));
  const sube = [...relevantes].sort((a, b) => b.cambio / Math.max(1, Math.abs(b.temporada)) - a.cambio / Math.max(1, Math.abs(a.temporada)))[0];
  const baja = [...relevantes].sort((a, b) => a.cambio / Math.max(1, Math.abs(a.temporada)) - b.cambio / Math.max(1, Math.abs(b.temporada)))[0];
  const umbralForma = (f) => Math.abs(f.cambio) / Math.max(1, Math.abs(f.temporada)) > 0.3;
  if (baja && baja.cambio < 0 && umbralForma(baja)) out.hallazgos.push({ tipo: 'forma', peso: 2, texto: `${nombreCorto(baja.jugador)} baja: ${cfg.indiceNombre} de ${fmtDec1(baja.ultimos)} en los últimos 3 partidos, frente a ${fmtDec1(baja.temporada)} de promedio.` });
  if (sube && sube.cambio > 0 && umbralForma(sube) && sube !== baja) out.hallazgos.push({ tipo: 'forma', peso: 2, texto: `${nombreCorto(sube.jugador)} está en alza: ${cfg.indiceNombre} de ${fmtDec1(sube.ultimos)} en los últimos 3 partidos, frente a ${fmtDec1(sube.temporada)} de promedio.` });

  // ----- 7. Producción por minutos o por partido
  out.produccion = porJugador.filter((x) => x.pj > 0).map((x) => {
    const min = x.tot.minutos || 0;
    const ok = cfg.porMinutos ? min >= (cfg.minMinutos || 0) : x.pj >= 2;
    return { jugador: x.jugador, pj: x.pj, min, ok, valores: cfg.produccion.map((c) => { const raw = c.f(x.tot); if (raw == null) return null; if (c.rate) return min ? (raw / min) * cfg.porMinutos : null; if (c.perPJ) return raw / x.pj; return raw; }) };
  }).filter((r) => r.ok).sort((a, b) => (b.valores[0] ?? -1) - (a.valores[0] ?? -1));

  // ----- 8. Dependencia: cuánto del ataque cae en pocas manos
  const aportes = porJugador.map((x) => ({ j: x.jugador, v: puntosJugador(dep, x.tot) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const totalAporte = sum(aportes, (x) => x.v);
  if (totalAporte > 0) {
    const top1 = aportes[0].v / totalAporte, top3 = sum(aportes.slice(0, 3), (x) => x.v) / totalAporte;
    out.dependencia = { top1, top3, anotadores: aportes.length, lider: aportes[0].j, aportes, totalAporte };
    const que = dep === 'voleibol' ? 'de los puntos' : dep === 'baloncesto' ? 'de los puntos' : 'de los goles';
    if (top1 >= 0.35) out.hallazgos.push({ tipo: 'dependencia', peso: 2, texto: `Alta dependencia: ${nombreCorto(aportes[0].j)} aporta el ${fmtPct0(top1)} ${que} del equipo.` });
    else out.hallazgos.push({ tipo: 'dependencia', peso: 1, texto: `Ataque repartido: ${aportes.length} jugadores han anotado y las 3 principales figuras suman el ${fmtPct0(top3)} ${que}.` });
  }

  out.hallazgos.sort((a, b) => b.peso - a.peso);
  return out;
}

export function fmtRegistro(r, dep) {
  const conE = dep === 'futbol11' || dep === 'futbol_sala' || dep === 'balonmano';
  return conE ? `${r.v}-${r.e}-${r.d}` : `${r.v}-${r.d}`;
}

// Tarjetas de eficiencia por deporte: cada una con su valor y una lectura
function eficiencia(dep, ps, porJugador, porPartido, favor, contra) {
  const T = {}; for (const m of porPartido.values()) for (const [k, x] of Object.entries(m)) T[k] = (T[k] || 0) + x;
  const pj = ps.length, out = { tarjetas: [], origen: null };
  if (dep === 'baloncesto') {
    const x = tiros(T);
    out.tarjetas = [
      { l: 'Tiro efectivo (eFG%)', v: fmtPct1(div(x.fgm + 0.5 * x.t3, x.fga)), n: 'Tiros de campo, con el triple valiendo 1,5' },
      { l: 'Tiro real (TS%)', v: fmtPct1(div(x.pts, 2 * (x.fga + 0.44 * x.fta))), n: 'Incluye tiros libres' },
      { l: 'Tasa de tiros libres', v: fmtDec2(div(x.fta, x.fga)), n: 'Libres intentados por tiro de campo' },
      { l: 'Asistencias por pérdida', v: fmtDec2(div(v(T, 'asistencias'), v(T, 'perdidas'))), n: 'Más de 1,5 indica buen manejo' },
      { l: 'Canastas asistidas', v: fmtPct0(div(v(T, 'asistencias'), x.fgm)), n: 'Asistencias por tiro de campo anotado' },
      { l: 'Robos + tapones por partido', v: fmtDec1(div(v(T, 'robos') + v(T, 'tapones'), pj)), n: 'Acciones defensivas registradas' },
    ];
    const total = x.pts || 1;
    out.origen = { titulo: 'De dónde salen los puntos', filas: [{ label: 'Dobles', value: 2 * v(T, 't2') }, { label: 'Triples', value: 3 * v(T, 't3') }, { label: 'Tiros libres', value: v(T, 'tl') }], total, unidad: 'pts' };
  } else if (dep === 'voleibol') {
    const parc = ps.flatMap((p) => p.parciales || []);
    const pf = sum(parc, (s) => +s[0]), pc = sum(parc, (s) => +s[1]);
    const propios = v(T, 'ataque_pts') + v(T, 'bloqueos') + v(T, 'aces');
    out.tarjetas = [
      { l: 'Rallies ganados', v: fmtPct1(div(pf, pf + pc)), n: `${fmtInt(pf)} de ${fmtInt(pf + pc)} puntos jugados` },
      { l: 'Eficacia de ataque', v: fmtPct1(div(v(T, 'ataque_pts') - v(T, 'ataque_err'), v(T, 'ataque_pts') + v(T, 'ataque_err'))), n: '(puntos − errores) / ataques terminados' },
      { l: 'Relación ace / error de saque', v: fmtDec2(div(v(T, 'aces'), v(T, 'saque_err'))), n: 'Más de 1 = el saque suma' },
      { l: 'Recepción sin error', v: fmtPct1(div(v(T, 'recepciones') - v(T, 'recepcion_err'), v(T, 'recepciones'))), n: `${fmtInt(v(T, 'recepcion_err'))} errores en ${fmtInt(v(T, 'recepciones'))} recepciones` },
      { l: 'Errores propios por set', v: fmtDec1(div(v(T, 'ataque_err') + v(T, 'saque_err') + v(T, 'recepcion_err'), parc.length)), n: 'Ataque + saque + recepción' },
      { l: 'Puntos regalados por el rival', v: fmtPct0(div(Math.max(0, pf - propios), pf)), n: 'Puntos que no vinieron de acciones propias' },
    ];
    out.origen = { titulo: 'De dónde salen los puntos', filas: [{ label: 'Ataque', value: v(T, 'ataque_pts') }, { label: 'Bloqueo', value: v(T, 'bloqueos') }, { label: 'Saque directo', value: v(T, 'aces') }, { label: 'Errores del rival', value: Math.max(0, pf - propios) }], total: pf || 1, unidad: 'pts' };
  } else if (dep === 'balonmano') {
    out.tarjetas = [
      { l: 'Eficacia de lanzamiento', v: fmtPct1(div(v(T, 'goles'), v(T, 'lanzamientos'))), n: `${fmtInt(v(T, 'goles'))} goles en ${fmtInt(v(T, 'lanzamientos'))} lanzamientos` },
      { l: 'Paradas del portero', v: fmtPct1(div(v(T, 'paradas'), v(T, 'paradas') + contra)), n: 'Paradas / (paradas + goles recibidos)' },
      { l: 'Goles asistidos', v: fmtPct0(div(v(T, 'asistencias'), v(T, 'goles'))), n: 'Asistencias por gol' },
      { l: 'Balance robos − pérdidas', v: signo(fmtInt)(v(T, 'robos') - v(T, 'perdidas')), n: 'Por temporada' },
      { l: 'Exclusiones por partido', v: fmtDec1(div(v(T, 'exclusiones'), pj)), n: 'Minutos jugados con uno menos' },
      { l: 'Diferencia por partido', v: signo(fmtDec1)(div(favor - contra, pj)), n: 'Goles a favor − en contra' },
    ];
  } else {
    out.tarjetas = [
      { l: 'Conversión de remates', v: fmtPct1(div(v(T, 'goles'), v(T, 'remates'))), n: `Un gol cada ${fmtDec1(div(v(T, 'remates'), v(T, 'goles')))} remates` },
      { l: 'Precisión', v: fmtPct1(div(v(T, 'remates_arco'), v(T, 'remates'))), n: 'Remates que van al arco' },
      { l: 'Eficacia al arco', v: fmtPct1(div(v(T, 'goles'), v(T, 'remates_arco'))), n: 'Goles por remate al arco' },
      { l: 'Goles asistidos', v: fmtPct0(div(v(T, 'asistencias'), v(T, 'goles'))), n: 'Jugadas colectivas frente a individuales' },
      { l: 'Vallas invictas', v: fmtPct0(div(ps.filter((p) => p.marcador_contra === 0).length, pj)), n: `${ps.filter((p) => p.marcador_contra === 0).length} de ${pj} partidos sin recibir gol` },
      { l: 'Atajadas por gol recibido', v: fmtDec1(div(v(T, 'atajadas'), contra)), n: 'Trabajo del portero' },
    ];
  }
  return out;
}
