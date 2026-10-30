// Datos de ejemplo (sintéticos) para el modo demostración.
// Se generan con una semilla fija: los totales de cada partido cuadran con su marcador.

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function crearDemo() {
  const r = rng(20260830);
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const pesado = (items, peso) => { const tot = items.reduce((t, x) => t + peso(x), 0); let u = r() * tot; for (const x of items) { u -= peso(x); if (u <= 0) return x; } return items.at(-1); };
  let n = 0; const id = (p) => `${p}-${(++n).toString(36).padStart(4, '0')}`;
  const creado = '2026-08-01T12:00:00.000Z';

  const perfil = { id: 'demo-profesor', email: 'profesora.demo@correounivalle.edu.co', nombre: 'Profesora de ejemplo', es_admin: true };
  const equipos = [], jugadores = [], partidos = [], estadisticas = [];
  const stat = (partido_id, jugador_id, metrica, valor) => { if (valor > 0) estadisticas.push({ partido_id, jugador_id, metrica, valor }); };
  const rivales = ['Javeriana Cali', 'ICESI', 'Autónoma de Occidente', 'San Buenaventura', 'Santiago de Cali', 'Unicatólica', 'Universidad Libre', 'Escuela Nacional del Deporte', 'UNAD Palmira'];
  const fechas = (k) => { const out = []; let d = new Date('2026-08-15T00:00:00'); for (let i = 0; i < k; i++) { out.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + int(6, 9) * 86400000); } return out; };

  const plantel = (equipo, lista) => lista.map(([nombre, dorsal, posicion]) => { const j = { id: id('j'), equipo_id: equipo.id, nombre, dorsal, posicion, activo: true, creado_en: creado }; jugadores.push(j); return j; });

  // --- Fútbol 11 femenino --------------------------------------------------
  const fut = { id: 'demo-futbol', profesor_id: perfil.id, nombre: 'Univalle Fútbol Femenino', deporte: 'futbol11', categoria: 'femenino', temporada: '2026', creado_en: creado };
  equipos.push(fut);
  const pf = plantel(fut, [
    ['Valentina Ríos', 1, 'Portero'], ['Laura Mosquera', 2, 'Lateral'], ['Daniela Caicedo', 3, 'Defensa central'], ['Juliana Ocoró', 4, 'Defensa central'],
    ['Mariana Vélez', 5, 'Volante de marca'], ['Sara Angulo', 6, 'Lateral'], ['Isabella Quiñones', 7, 'Extremo'], ['Camila Torres', 8, 'Volante'],
    ['Natalia Riascos', 9, 'Delantero'], ['Ana María Lucumí', 10, 'Volante'], ['Paula Cuero', 11, 'Extremo'], ['Manuela Arboleda', 12, 'Portero'],
    ['Sofía Valencia', 14, 'Defensa central'], ['Gabriela Hurtado', 16, 'Volante'], ['Luisa Fernanda Rivas', 17, 'Delantero'], ['María José Carabalí', 19, 'Extremo'],
  ]);
  const pesoGol = { Delantero: 6, Extremo: 4, Volante: 2.5, 'Volante de marca': 1, Lateral: 0.6, 'Defensa central': 0.5, Portero: 0 };
  const marcadoresF = [[2, 1], [0, 0], [3, 1], [1, 2], [4, 0], [2, 2], [1, 0], [3, 2], [2, 0]];
  fechas(9).forEach((fecha, i) => {
    const [gf, gc] = marcadoresF[i];
    const p = { id: id('p'), equipo_id: fut.id, fecha, rival: rivales[i], condicion: i % 2 ? 'visitante' : 'local', competicion: 'Liga Universitaria ASCUN Valle', marcador_favor: gf, marcador_contra: gc, parciales: null, notas: null, creado_en: creado };
    partidos.push(p);
    const titulares = [pf[0], ...pf.slice(1, 11).filter(() => true)];
    const suplentes = [pf[12], pf[13], pf[14], pf[15]].sort(() => r() - 0.5).slice(0, 3);
    const enCancha = [...titulares, ...suplentes];
    const g = {}, a = {};
    for (let k = 0; k < gf; k++) {
      const goleadora = pesado(enCancha, (j) => pesoGol[j.posicion] ?? 1);
      g[goleadora.id] = (g[goleadora.id] || 0) + 1;
      if (r() < 0.7) { const asis = pesado(enCancha.filter((j) => j !== goleadora), (j) => (j.posicion.startsWith('Volante') ? 3 : j.posicion === 'Extremo' ? 3 : 1) * (j.posicion === 'Portero' ? 0.05 : 1)); a[asis.id] = (a[asis.id] || 0) + 1; }
    }
    for (const j of enCancha) {
      const sup = suplentes.includes(j);
      const min = sup ? int(10, 30) : (j.posicion !== 'Portero' && r() < 0.25 ? int(60, 85) : 90);
      const goles = g[j.id] || 0;
      const rem = goles + (j.posicion === 'Portero' ? 0 : int(0, (pesoGol[j.posicion] || 0) > 2 ? 2 : 1));
      stat(p.id, j.id, 'minutos', min);
      stat(p.id, j.id, 'goles', goles);
      stat(p.id, j.id, 'asistencias', a[j.id] || 0);
      stat(p.id, j.id, 'remates', rem);
      stat(p.id, j.id, 'remates_arco', Math.min(rem, goles + int(0, Math.max(0, rem - goles))));
      stat(p.id, j.id, 'faltas', j.posicion === 'Portero' ? 0 : int(0, j.posicion.includes('marca') || j.posicion.includes('central') ? 3 : 2));
      stat(p.id, j.id, 'amarillas', r() < 0.06 ? 1 : 0);
      if (j.posicion === 'Portero') stat(p.id, j.id, 'atajadas', int(1, 6));
    }
  });

  // --- Voleibol masculino --------------------------------------------------
  const vol = { id: 'demo-voleibol', profesor_id: perfil.id, nombre: 'Univalle Voleibol Masculino', deporte: 'voleibol', categoria: 'masculino', temporada: '2026', creado_en: creado };
  equipos.push(vol);
  const pv = plantel(vol, [
    ['Santiago Mina', 1, 'Armador'], ['Juan David Cortés', 4, 'Opuesto'], ['Andrés Murillo', 5, 'Punta receptor'], ['Kevin Banguera', 7, 'Central'],
    ['Sebastián Holguín', 8, 'Punta receptor'], ['Brayan Asprilla', 10, 'Central'], ['Miguel Ángel Rentería', 12, 'Líbero'], ['Felipe Castaño', 13, 'Armador'],
    ['Cristian Ibargüen', 15, 'Opuesto'], ['Jhon Edwar Palacios', 17, 'Central'], ['Daniel Saa', 18, 'Punta receptor'], ['Esteban Lozano', 20, 'Líbero'],
  ]);
  const setsV = [[3, 1], [2, 3], [3, 0], [3, 2], [1, 3], [3, 1], [3, 0]];
  fechas(7).forEach((fecha, i) => {
    const [sf, sc] = setsV[i];
    const orden = []; let a1 = 0, b1 = 0;
    while (a1 < sf || b1 < sc) { const ganamos = (a1 < sf && (b1 >= sc || r() < 0.55)); if (ganamos) a1++; else b1++; orden.push(ganamos); }
    // el último set lo gana quien gana el partido
    if (orden.at(-1) !== (sf > sc)) { const k = orden.lastIndexOf(sf > sc); [orden[k], orden[orden.length - 1]] = [orden[orden.length - 1], orden[k]]; }
    const parciales = orden.map((ganamos, k) => { const quinto = k === 4; const top = quinto ? 15 : 25; const ventaja = r() < 0.2; const perdedor = ventaja ? top - 1 + int(0, 2) : int(quinto ? 8 : 15, top - 2); const w = ventaja ? perdedor + 2 : top; return ganamos ? [w, perdedor] : [perdedor, w]; });
    const p = { id: id('p'), equipo_id: vol.id, fecha, rival: rivales[(i + 3) % rivales.length], condicion: i % 2 ? 'local' : 'visitante', competicion: 'Copa Universitaria del Valle', marcador_favor: sf, marcador_contra: sc, parciales, notas: null, creado_en: creado };
    partidos.push(p);
    const ptsPropios = Math.round(parciales.reduce((t, s) => t + s[0], 0) * 0.78); // el resto: errores del rival
    const enCancha = [pv[0], pv[1], pv[2], pv[3], pv[4], pv[5], pv[6], pick([pv[8], pv[10]])];
    const ataque = enCancha.filter((j) => !['Líbero', 'Armador'].includes(j.posicion));
    const reparto = {}; const add = (j, k, v) => { reparto[j.id] = reparto[j.id] || {}; reparto[j.id][k] = (reparto[j.id][k] || 0) + v; };
    for (let k = 0; k < ptsPropios; k++) {
      const u = r();
      if (u < 0.8) add(pesado(ataque, (j) => ({ Opuesto: 4, 'Punta receptor': 3, Central: 2 }[j.posicion] || 1)), 'ataque_pts', 1);
      else if (u < 0.93) add(pesado(ataque, (j) => (j.posicion === 'Central' ? 4 : 1)), 'bloqueos', 1);
      else add(pick(enCancha.filter((j) => j.posicion !== 'Líbero')), 'aces', 1);
    }
    for (const j of enCancha) {
      const s = reparto[j.id] || {};
      stat(p.id, j.id, 'ataque_pts', s.ataque_pts || 0);
      stat(p.id, j.id, 'ataque_err', ataque.includes(j) ? int(1, 7) : 0);
      stat(p.id, j.id, 'bloqueos', s.bloqueos || 0);
      stat(p.id, j.id, 'aces', s.aces || 0);
      stat(p.id, j.id, 'saque_err', j.posicion === 'Líbero' ? 0 : int(0, 3));
      const rec = ['Líbero', 'Punta receptor'].includes(j.posicion) ? int(8, 18) : int(0, 3);
      stat(p.id, j.id, 'recepciones', rec);
      stat(p.id, j.id, 'recepcion_err', rec ? int(0, Math.min(3, rec)) : 0);
      stat(p.id, j.id, 'defensas', j.posicion === 'Líbero' ? int(8, 16) : int(1, 6));
      stat(p.id, j.id, 'colocaciones', j.posicion === 'Armador' ? int(18, 34) : int(0, 2));
    }
  });

  // --- Baloncesto femenino -------------------------------------------------
  const bal = { id: 'demo-baloncesto', profesor_id: perfil.id, nombre: 'Univalle Baloncesto Femenino', deporte: 'baloncesto', categoria: 'femenino', temporada: '2026', creado_en: creado };
  equipos.push(bal);
  const pb = plantel(bal, [
    ['Alejandra Zúñiga', 4, 'Base'], ['Tatiana Grueso', 5, 'Escolta'], ['Melissa Obando', 6, 'Alero'], ['Yuliana Perea', 7, 'Ala-pívot'],
    ['Carolina Mejía', 8, 'Pívot'], ['Diana Marcela Solís', 9, 'Base'], ['Estefanía Castro', 10, 'Escolta'], ['Lina Marcela Góngora', 11, 'Alero'],
    ['Karen Viveros', 12, 'Pívot'], ['Ángela Rodallega', 13, 'Ala-pívot'],
  ]);
  const marcadoresB = [[68, 61], [55, 63], [72, 58], [61, 59], [49, 66], [77, 70], [64, 52], [58, 60]];
  fechas(8).forEach((fecha, i) => {
    const [pf2, pc] = marcadoresB[i];
    const p = { id: id('p'), equipo_id: bal.id, fecha, rival: rivales[(i + 5) % rivales.length], condicion: i % 2 ? 'visitante' : 'local', competicion: 'Liga Universitaria ASCUN Valle', marcador_favor: pf2, marcador_contra: pc, parciales: null, notas: null, creado_en: creado };
    partidos.push(p);
    const peso = { Base: 2.2, Escolta: 3, Alero: 2.6, 'Ala-pívot': 2, Pívot: 2.2 };
    const s = Object.fromEntries(pb.map((j) => [j.id, { t2: 0, t3: 0, tl: 0 }]));
    let resto = pf2;
    while (resto > 0) {
      const j = pesado(pb, (x) => peso[x.posicion] * (x.dorsal < 9 ? 1.6 : 0.6));
      const u = r();
      if (resto >= 3 && u < 0.22 && j.posicion !== 'Pívot') { s[j.id].t3++; resto -= 3; }
      else if (resto >= 2 && u < 0.82) { s[j.id].t2++; resto -= 2; }
      else { s[j.id].tl++; resto -= 1; }
    }
    pb.forEach((j) => {
      const x = s[j.id];
      const titular = j.dorsal < 9;
      stat(p.id, j.id, 'minutos', titular ? int(24, 34) : int(6, 18));
      stat(p.id, j.id, 't2', x.t2); stat(p.id, j.id, 't2_int', x.t2 + int(x.t2 ? 1 : 0, Math.max(1, Math.round(x.t2 * 1.2))));
      stat(p.id, j.id, 't3', x.t3); stat(p.id, j.id, 't3_int', x.t3 + (j.posicion === 'Pívot' ? 0 : int(0, 4)));
      stat(p.id, j.id, 'tl', x.tl); stat(p.id, j.id, 'tl_int', x.tl + (x.tl ? int(0, 1) : int(0, 1)));
      stat(p.id, j.id, 'rebotes', int(j.posicion.includes('ívot') ? 4 : 1, j.posicion.includes('ívot') ? 11 : 5));
      stat(p.id, j.id, 'asistencias', int(0, j.posicion === 'Base' ? 7 : 2));
      stat(p.id, j.id, 'robos', int(0, 3)); stat(p.id, j.id, 'tapones', j.posicion.includes('ívot') ? int(0, 3) : 0);
      stat(p.id, j.id, 'perdidas', int(0, 3)); stat(p.id, j.id, 'faltas', int(0, 4));
    });
  });

  // --- Fútbol sala masculino -----------------------------------------------
  const fsa = { id: 'demo-futsal', profesor_id: perfil.id, nombre: 'Univalle Fútbol Sala Masculino', deporte: 'futbol_sala', categoria: 'masculino', temporada: '2026', creado_en: creado };
  equipos.push(fsa);
  const pfs = plantel(fsa, [
    ['Mateo Lasso', 1, 'Portero'], ['Samuel Valencia', 3, 'Cierre'], ['Nicolás Banguero', 5, 'Ala'], ['Julián Caicedo', 7, 'Ala'],
    ['Alejandro Riascos', 9, 'Pívot'], ['Tomás Ocampo', 10, 'Ala'], ['David Quintero', 11, 'Cierre'], ['Óscar Palacios', 14, 'Pívot'], ['Emanuel Cuesta', 12, 'Portero'],
  ]);
  const pesoFs = { Pívot: 5, Ala: 3, Cierre: 1, Portero: 0 };
  const marcadoresS = [[5, 3], [2, 4], [4, 4], [6, 2], [3, 2], [1, 3], [3, 5], [2, 1]];
  fechas(8).forEach((fecha, i) => {
    const [gf, gc] = marcadoresS[i];
    const p = { id: id('p'), equipo_id: fsa.id, fecha, rival: rivales[(i + 2) % rivales.length], condicion: i % 2 ? 'local' : 'visitante', competicion: 'Torneo Universitario de Fútbol Sala', marcador_favor: gf, marcador_contra: gc, parciales: null, notas: null, creado_en: creado };
    partidos.push(p);
    const enCancha = pfs.slice(0, 8);
    const g = {}, a = {};
    for (let k = 0; k < gf; k++) {
      const gol = pesado(enCancha, (j) => pesoFs[j.posicion]); g[gol.id] = (g[gol.id] || 0) + 1;
      if (r() < 0.6) { const asis = pesado(enCancha.filter((j) => j !== gol), (j) => (j.posicion === 'Portero' ? 0.1 : j.posicion === 'Ala' ? 3 : 1.5)); a[asis.id] = (a[asis.id] || 0) + 1; }
    }
    for (const j of enCancha) {
      const goles = g[j.id] || 0;
      const rem = goles + (j.posicion === 'Portero' ? 0 : int(1, pesoFs[j.posicion] > 2 ? 5 : 2));
      stat(p.id, j.id, 'goles', goles); stat(p.id, j.id, 'asistencias', a[j.id] || 0);
      stat(p.id, j.id, 'remates', rem); stat(p.id, j.id, 'remates_arco', Math.min(rem, goles + int(0, Math.max(0, rem - goles))));
      stat(p.id, j.id, 'faltas', j.posicion === 'Portero' ? 0 : int(0, 2));
      stat(p.id, j.id, 'amarillas', r() < 0.08 ? 1 : 0);
      if (j.posicion === 'Portero') stat(p.id, j.id, 'atajadas', int(3, 9));
    }
  });

  // --- Balonmano femenino --------------------------------------------------
  const bm = { id: 'demo-balonmano', profesor_id: perfil.id, nombre: 'Univalle Balonmano Femenino', deporte: 'balonmano', categoria: 'femenino', temporada: '2026', creado_en: creado };
  equipos.push(bm);
  const pbm = plantel(bm, [
    ['Verónica Murillo', 1, 'Portero'], ['Lorena Cuero', 3, 'Extremo'], ['Yesenia Mosquera', 5, 'Lateral'], ['Adriana Lemos', 7, 'Central'],
    ['Paola Hinestroza', 9, 'Pivote'], ['Johana Arboleda', 11, 'Lateral'], ['Katherine Sinisterra', 13, 'Extremo'], ['Mónica Valencia', 15, 'Lateral'],
    ['Leidy Rentería', 17, 'Pivote'], ['Claudia Potes', 12, 'Portero'],
  ]);
  const pesoBm = { Lateral: 4, Central: 3, Extremo: 2.5, Pivote: 2.5, Portero: 0 };
  const marcadoresM = [[24, 21], [19, 25], [27, 26], [22, 22], [30, 23], [20, 24], [25, 21], [23, 24], [28, 22]];
  fechas(9).forEach((fecha, i) => {
    const [gf, gc] = marcadoresM[i];
    const p = { id: id('p'), equipo_id: bm.id, fecha, rival: rivales[(i + 4) % rivales.length], condicion: i % 2 ? 'visitante' : 'local', competicion: 'Liga Universitaria ASCUN Valle', marcador_favor: gf, marcador_contra: gc, parciales: null, notas: null, creado_en: creado };
    partidos.push(p);
    const enCancha = pbm.slice(0, 9);
    const g = {}, a = {};
    for (let k = 0; k < gf; k++) {
      const gol = pesado(enCancha, (j) => pesoBm[j.posicion]); g[gol.id] = (g[gol.id] || 0) + 1;
      if (r() < 0.45) { const asis = pesado(enCancha.filter((j) => j !== gol), (j) => (j.posicion === 'Central' ? 4 : j.posicion === 'Portero' ? 0.1 : 1.5)); a[asis.id] = (a[asis.id] || 0) + 1; }
    }
    for (const j of enCancha) {
      const goles = g[j.id] || 0;
      stat(p.id, j.id, 'goles', goles); stat(p.id, j.id, 'lanzamientos', j.posicion === 'Portero' ? 0 : goles + int(1, 4));
      stat(p.id, j.id, 'asistencias', a[j.id] || 0);
      stat(p.id, j.id, 'robos', j.posicion === 'Portero' ? 0 : int(0, 2)); stat(p.id, j.id, 'perdidas', j.posicion === 'Portero' ? 0 : int(0, 3));
      stat(p.id, j.id, 'exclusiones', r() < 0.15 ? 1 : 0);
      if (j.posicion === 'Portero') stat(p.id, j.id, 'paradas', int(6, 15));
    }
  });

  const invitaciones = [
    { email: perfil.email, nombre: perfil.nombre, llave: 'DEMO-0001', es_admin: true, creada_en: creado, activada_en: creado },
    { email: 'entrenador.balonmano@correounivalle.edu.co', nombre: 'Entrenador de balonmano', llave: '7F3A-C21E', es_admin: false, creada_en: '2026-10-20T15:00:00.000Z', activada_en: null },
  ];
  return { perfil, equipos, jugadores, partidos, estadisticas, invitaciones };
}
