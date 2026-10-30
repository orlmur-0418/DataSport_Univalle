// Pantallas de la app: resumen, partidos, planilla, jugadores, equipo y profesores.
import { esc, icon, aviso, confirmar, ocupado, fechaCorta, fechaLarga, hoyISO, bug } from './ui.js';
import { deporte, DEPORTES, CATEGORIAS, CONDICIONES, resumen, hallazgo, resultado, formatear, fmtInt, fmtDec1, fmtDec2, fmtPct1, agregar, puntosJugador } from './sports.js';
import { mensajeError } from './data.js';

const subtitulo = (eq) => `${deporte(eq.deporte).nombre} · ${CATEGORIAS[eq.categoria]} · Temporada ${esc(eq.temporada)}`;
const fmtCol = (c, v) => (v == null ? '—' : c.pct ? fmtPct1(v) : c.d === 1 ? fmtDec1(v) : c.d === 2 ? fmtDec2(v) : fmtInt(v));
const cifra = (v, txt) => (v === 0 ? `<span class="zero">${txt}</span>` : txt);

// ---------------------------------------------------------------------------
// Resumen (tablero)
// ---------------------------------------------------------------------------
export async function vistaResumen(el, ctx) {
  const eq = ctx.equipo, dep = deporte(eq.deporte);
  const { jugadores, partidos, filas } = await ctx.cargarEquipo();
  const r = resumen(eq, partidos, jugadores, filas);
  const activos = jugadores.filter((j) => j.activo).length;

  el.innerHTML = `
    <div class="title-row">
      <div>
        <h1>${esc(eq.nombre)}</h1>
        <p class="sub muted">${subtitulo(eq)}${r.pj ? ` · ${r.registro}` : ''}</p>
        <p class="finding">${esc(hallazgo(eq, r))}</p>
      </div>
      <div class="title-actions">
        <a class="btn accent dup" href="#/partidos/nuevo">${icon('mas')}Registrar partido</a>
      </div>
    </div>
    ${r.pj ? '' : primerUso(activos)}
    <section aria-labelledby="h-temporada">
      <header class="section-head" style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:12px">
        <h2 id="h-temporada" style="font-size:var(--fs-section);font-weight:600">Temporada</h2>
        <div class="strip-legend"><span><span class="res V">V</span>Victoria</span>${dep.empates ? '<span><span class="res E">E</span>Empate</span>' : ''}<span><span class="res D">D</span>Derrota</span></div>
      </header>
      ${r.pj ? `<div class="strip" id="strip">${r.partidos.map((p) => tiraItem(p)).join('')}</div>` : `<div class="empty"><p>Los partidos que registres aparecerán aquí como marcadores, del más antiguo al más reciente.</p></div>`}
    </section>
    <div class="kpis six" style="margin-top:var(--gap)">
      ${r.kpis.map((k) => `<div class="kpi"><div class="kpi-label">${esc(k.l)}</div><div class="kpi-value">${r.pj ? formatear(k) : '<span class="zero">—</span>'}</div>${k.sub && r.pj ? `<div class="delta">${esc(k.sub)}</div>` : ''}</div>`).join('')}
    </div>
    <div class="dash-grid">
      <section class="panel span-8" aria-labelledby="h-serie">
        <header><div><h2 id="h-serie">${esc(r.serie.favor)} y ${esc(r.serie.contra.toLowerCase())}</h2><p class="meta">Por partido, en orden de fecha</p></div><div id="leyenda"></div></header>
        <div class="chart" id="chart-serie"></div>
        <div class="extras">${r.extras.map((x) => `<div><div class="l">${esc(x.l)}</div><div class="v">${r.pj ? formatear(x) : '<span class="zero">—</span>'}</div></div>`).join('')}</div>
      </section>
      <section class="panel span-4" aria-labelledby="h-lideres">
        <header><h2 id="h-lideres">Líderes</h2><a class="card-link" href="#/jugadores">Plantel</a></header>
        <div class="leaders">
          <div class="leader"><span class="what">Forma reciente${r.pj ? ` · últimos ${Math.min(5, r.pj)} partidos` : ''}</span>${r.pj ? `<span class="form-recent">${r.partidos.slice(-5).map((p) => `<span class="res ${resultado(p)}" title="${fechaCorta(p.fecha)} · ${esc(p.rival)} ${p.marcador_favor}–${p.marcador_contra}">${resultado(p)}</span>`).join('')}</span><span class="val">${r.partidos.slice(-5).filter((p) => resultado(p) === 'V').length}<small>de ${Math.min(5, r.pj)} ganados</small></span>` : '<span class="name muted">Sin partidos</span><span class="val zero">—</span>'}</div>
          ${r.lideres.map((l) => `<div class="leader"><span class="what">${esc(l.l)}</span>${l.r ? `<a class="name" href="#/jugadores/${l.r.x.jugador.id}">${l.r.x.jugador.dorsal != null ? `<span class="dorsal">${l.r.x.jugador.dorsal}</span>` : ''}<span>${esc(l.r.x.jugador.nombre)}</span></a><span class="val">${fmtInt(l.r.v)}<small>${esc(l.u)}</small></span>` : '<span class="name muted">Sin datos todavía</span><span class="val zero">—</span>'}</div>`).join('')}
        </div>
      </section>
      <section class="panel flush span-12" aria-labelledby="h-jugadores">
        <header><div><h2 id="h-jugadores">Rendimiento por jugador</h2><p class="meta">Totales de la temporada · PJ = partidos jugados</p></div></header>
        <div class="table-wrap table-panel" id="tabla-jug"></div>
      </section>
    </div>`;

  const strip = el.querySelector('#strip'); if (strip) strip.scrollLeft = strip.scrollWidth;

  const chartEl = el.querySelector('#chart-serie');
  if (r.pj) {
    const res = window.Charts.diverging(chartEl, {
      labels: r.partidos.map((p) => fechaCorta(p.fecha)),
      up: r.partidos.map((p) => p.marcador_favor), down: r.partidos.map((p) => p.marcador_contra),
      above: r.serie.favor, below: r.serie.contra, height: 220,
    });
    el.querySelector('#leyenda').replaceChildren(res.legend);
  } else {
    chartEl.innerHTML = `<div class="empty"><p>Sin partidos registrados. El gráfico se dibuja con el primer marcador.</p></div>`;
  }

  tablaJugadores(el.querySelector('#tabla-jug'), r, eq);
}

function primerUso(activos) {
  return `<div class="panel" style="margin-bottom:var(--gap)"><header><h2>Pon en marcha tu equipo</h2><span class="meta">${activos ? '1 de 2 pasos listos' : '0 de 2 pasos listos'}</span></header>
    <div class="rows">
      <div class="row"><span class="res ${activos ? 'V' : 'D'}">${activos ? icon('check') : '1'}</span><span style="flex:1">${activos ? `${activos} jugadores registrados` : 'Registra a tus jugadores con su dorsal y posición'}</span><a class="card-link" href="#/jugadores">${activos ? 'Ver plantel' : 'Agregar jugadores'}</a></div>
      <div class="row"><span class="res D">2</span><span style="flex:1">Registra tu primer partido: rival, fecha, marcador y estadísticas</span><a class="card-link" href="#/partidos/nuevo">Registrar partido</a></div>
    </div></div>`;
}

function tiraItem(p) {
  const res = resultado(p);
  const altoF = p.marcador_favor >= p.marcador_contra, altoC = p.marcador_contra >= p.marcador_favor;
  return `<a class="strip-item" href="#/partidos/${p.id}" title="Editar partido contra ${esc(p.rival)}">
    <span class="top"><span>${fechaCorta(p.fecha)}</span><span class="res ${res}">${res}</span></span>
    <span class="score"><span class="${altoF ? '' : 'low'}">${p.marcador_favor}</span><i>–</i><span class="${altoC ? '' : 'low'}">${p.marcador_contra}</span></span>
    <span class="rival"><span>${p.condicion === 'visitante' ? 'en' : p.condicion === 'local' ? 'vs' : 'ante'}</span> ${esc(p.rival)}</span>
  </a>`;
}

function tablaJugadores(cont, r, eq) {
  const filas = r.porJugador.filter((x) => x.jugador.activo || x.pj > 0);
  if (!filas.length) { cont.innerHTML = `<div class="empty" style="margin:16px 0"><p>Aún no hay jugadores. <a class="card-link" href="#/jugadores">Agregar jugadores</a></p></div>`; return; }
  const cols = [{ l: 'PJ', f: (x) => x.pj }, ...r.columnas];
  let orden = 1; // columna por la que se ordena (índice en cols)
  const pintar = () => {
    const sorted = [...filas].sort((a, b) => (cols[orden].f(b) ?? -1) - (cols[orden].f(a) ?? -1) || (a.jugador.dorsal ?? 99) - (b.jugador.dorsal ?? 99));
    cont.innerHTML = `<table>
      <thead><tr><th>Jugador</th><th>Posición</th>${cols.map((c, i) => `<th class="n"><button class="sort" data-i="${i}" ${i === orden ? 'aria-sort="descending"' : ''}>${esc(c.l)}</button></th>`).join('')}</tr></thead>
      <tbody>${sorted.map((x) => `<tr class="${x.jugador.activo ? '' : 'inactive'}"><td><span class="player"><span class="dorsal">${x.jugador.dorsal ?? ''}</span><a class="row-link" href="#/jugadores/${x.jugador.id}">${esc(x.jugador.nombre)}</a></span></td><td class="muted">${esc(x.jugador.posicion || '—')}</td>${cols.map((c) => { const v = c.f(x); return `<td class="n">${cifra(v, fmtCol(c, x.pj || c.l === 'PJ' ? v : null))}</td>`; }).join('')}</tr>`).join('')}</tbody>
    </table>`;
    cont.querySelectorAll('button.sort').forEach((b) => (b.onclick = () => { orden = +b.dataset.i; pintar(); }));
  };
  pintar();
}

// ---------------------------------------------------------------------------
// Partidos
// ---------------------------------------------------------------------------
export async function vistaPartidos(el, ctx) {
  const eq = ctx.equipo;
  const { partidos } = await ctx.cargarEquipo();
  const lista = [...partidos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const res = { V: 0, E: 0, D: 0 }; partidos.forEach((p) => res[resultado(p)]++);
  el.innerHTML = `
    <div class="title-row">
      <div><h1>Partidos</h1><p class="sub muted">${partidos.length ? `${partidos.length} partidos · ${res.V} victorias${deporte(eq.deporte).empates ? ` · ${res.E} empates` : ''} · ${res.D} derrotas` : subtitulo(eq)}</p></div>
      <div class="title-actions"><a class="btn accent dup" href="#/partidos/nuevo">${icon('mas')}Registrar partido</a></div>
    </div>
    <section class="panel flush">
      ${lista.length ? lista.map((p) => `
        <div class="match-row">
          <span class="date">${fechaLarga(p.fecha)}</span>
          ${bug(p)}
          <span class="meta">${esc(CONDICIONES[p.condicion])}${p.competicion ? ` · ${esc(p.competicion)}` : ''}${p.parciales?.length ? ` · ${p.parciales.map((s) => `${s[0]}-${s[1]}`).join(', ')}` : ''}</span>
          <span class="actions"><a class="icon-btn" href="#/partidos/${p.id}" aria-label="Editar partido contra ${esc(p.rival)}" title="Editar">${icon('editar')}</a><button class="icon-btn" data-borrar="${p.id}" aria-label="Eliminar partido contra ${esc(p.rival)}" title="Eliminar">${icon('borrar')}</button></span>
        </div>`).join('') : `<div class="empty" style="margin:20px"><p>No hay partidos registrados en este equipo.</p><a class="btn accent" href="#/partidos/nuevo">${icon('mas')}Registrar el primero</a></div>`}
    </section>`;
  el.querySelectorAll('[data-borrar]').forEach((b) => (b.onclick = async () => {
    const p = partidos.find((x) => x.id === b.dataset.borrar);
    const ok = await confirmar({ titulo: `¿Eliminar el partido contra ${p.rival}?`, texto: `Se borran el marcador del ${fechaLarga(p.fecha)} y todas las estadísticas de los jugadores en ese partido. No se puede deshacer.`, accion: 'Eliminar partido' });
    if (!ok) return;
    try { await ctx.api.eliminarPartido(p.id); ctx.invalidar(); aviso('Partido eliminado'); ctx.render(); } catch (err) { aviso(mensajeError(err), 'error'); }
  }));
}

// ---------------------------------------------------------------------------
// Planilla: registrar o editar un partido
// ---------------------------------------------------------------------------
export async function vistaPlanilla(el, ctx, partidoId) {
  const eq = ctx.equipo, dep = deporte(eq.deporte), esVoley = eq.deporte === 'voleibol';
  const { jugadores, partidos, filas } = await ctx.cargarEquipo();
  const p = partidoId ? partidos.find((x) => x.id === partidoId) : null;
  if (partidoId && !p) { el.innerHTML = `<div class="error-box">Ese partido no existe o es de otro equipo. <a class="card-link" href="#/partidos">Ver partidos</a></div>`; return; }
  const stats = {}; // jugador -> metrica -> valor
  if (p) for (const f of filas.filter((f) => f.partido_id === p.id)) { (stats[f.jugador_id] ||= {})[f.metrica] = Number(f.valor); }
  const plantel = jugadores.filter((j) => j.activo || stats[j.id]);
  const jugo = new Set(p ? Object.keys(stats) : []);
  const rivalesPrevios = [...new Set(partidos.map((x) => x.rival))].sort();
  const competiciones = [...new Set(partidos.map((x) => x.competicion).filter(Boolean))];
  const ultimaComp = [...partidos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.competicion || '';
  const parciales = p?.parciales?.length ? p.parciales.map((s) => [...s]) : [[null, null], [null, null], [null, null]];

  el.innerHTML = `
    <div class="title-row">
      <div><a class="back" href="#/partidos">${icon('volver')}Partidos</a><h1>${p ? `Partido contra ${esc(p.rival)}` : 'Registrar partido'}</h1><p class="sub muted">${esc(eq.nombre)} · ${dep.nombre} · ${CATEGORIAS[eq.categoria]}</p></div>
    </div>
    <form id="f-partido" novalidate>
      <section class="panel">
        <header><h2>Datos del partido</h2></header>
        <div class="form-grid">
          <div class="field c3 keep"><label for="f-fecha">Fecha</label><input class="input" type="date" id="f-fecha" name="fecha" required value="${p?.fecha || hoyISO()}"></div>
          <div class="field c3 keep"><label for="f-cond">Condición</label><select class="input" id="f-cond" name="condicion">${Object.entries(CONDICIONES).map(([k, v]) => `<option value="${k}" ${(p?.condicion || 'local') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field c6"><label for="f-rival">Rival</label><input class="input" id="f-rival" name="rival" required list="l-rivales" autocomplete="off" value="${esc(p?.rival || '')}" placeholder="Nombre del equipo rival"><datalist id="l-rivales">${rivalesPrevios.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="field c6"><label for="f-comp">Competición <span class="muted">(opcional)</span></label><input class="input" id="f-comp" name="competicion" list="l-comp" autocomplete="off" value="${esc(p ? p.competicion || '' : ultimaComp)}" placeholder="Liga, copa, amistoso…"><datalist id="l-comp">${competiciones.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></div>
          <div class="field c6"><label for="f-notas">Notas <span class="muted">(opcional)</span></label><input class="input" id="f-notas" name="notas" value="${esc(p?.notas || '')}" placeholder="Algo para recordar de este partido"></div>
        </div>
      </section>

      <section class="panel" style="margin-top:var(--gap)">
        <header><div><h2>Marcador</h2><p class="meta">${esVoley ? 'Escribe los puntos de cada set; los sets ganados se cuentan solos.' : `${dep.anota === 'puntos' ? 'Puntos' : 'Goles'} al final del partido.`}</p></div></header>
        ${esVoley ? `<div class="sets" id="sets"></div><button type="button" class="link-btn" id="add-set" style="margin-top:12px">Agregar set</button>
          <div class="score-entry" style="margin-top:20px"><div class="side"><span class="label muted">Sets Univalle</span><output class="score-input" id="o-favor" style="display:grid;place-items:center">0</output></div><span class="vs">–</span><div class="side them"><span class="label muted">Sets rival</span><output class="score-input" id="o-contra" style="display:grid;place-items:center">0</output></div></div>`
        : `<div class="score-entry"><div class="side"><label for="f-favor">${esc(eq.nombre)}</label><input class="score-input" id="f-favor" name="favor" type="number" inputmode="numeric" min="0" max="300" required value="${p?.marcador_favor ?? ''}" placeholder="0"></div><span class="vs">–</span><div class="side them"><label for="f-contra" id="lbl-rival">${esc(p?.rival || 'Rival')}</label><input class="score-input" id="f-contra" name="contra" type="number" inputmode="numeric" min="0" max="300" required value="${p?.marcador_contra ?? ''}" placeholder="0"></div></div>`}
      </section>

      <section style="margin-top:var(--gap)">
        <header style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <div><h2 style="font-size:var(--fs-section);font-weight:600">Estadísticas por jugador</h2><p class="meta muted small">Marca quién jugó y escribe solo lo que pasó; lo vacío cuenta como 0.</p></div>
          ${plantel.length ? `<div class="title-actions"><button type="button" class="btn" id="todos">Marcar a todos</button></div>` : ''}
        </header>
        ${plantel.length ? `<div class="planilla-wrap"><table class="planilla" id="planilla">
          <thead><tr><th class="who">Jugó</th>${dep.metricas.map((m) => `<th><abbr title="${esc(m.l)}">${esc(m.c)}</abbr></th>`).join('')}</tr></thead>
          <tbody>${plantel.map((j) => `<tr data-j="${j.id}" class="${jugo.has(j.id) ? '' : 'off'}"><td class="who"><label><input type="checkbox" ${jugo.has(j.id) ? 'checked' : ''} aria-label="${esc(j.nombre)} jugó"><span class="dorsal">${j.dorsal ?? ''}</span><span>${esc(j.nombre)}<span class="pos">${esc(j.posicion || '')}</span></span></label></td>${dep.metricas.map((m) => { const v = stats[j.id]?.[m.k]; return `<td><input class="cell ${v ? 'has' : ''}" type="number" inputmode="numeric" min="0" max="999" step="1" data-m="${m.k}" value="${v || ''}" aria-label="${esc(m.l)} de ${esc(j.nombre)}"></td>`; }).join('')}</tr>`).join('')}</tbody>
          <tfoot><tr><td class="who">Total del equipo</td>${dep.metricas.map((m) => `<td data-tot="${m.k}">0</td>`).join('')}</tr></tfoot>
        </table></div>
        <p class="check-line" id="cuadre" aria-live="polite"></p>` : `<div class="empty"><p>Este equipo aún no tiene jugadores. Puedes guardar solo el marcador, o <a class="card-link" href="#/jugadores">agregar jugadores</a> primero.</p></div>`}
      </section>

      <div class="sticky-save">
        <p class="form-msg" role="alert"></p>
        <div class="form-actions"><a class="btn" href="#/partidos">Cancelar</a><button class="btn accent" type="submit">${p ? 'Guardar cambios' : 'Guardar partido'}</button></div>
      </div>
    </form>`;

  const form = el.querySelector('#f-partido'), msg = form.querySelector('.form-msg');

  // ----- sets de voleibol
  const pintarSets = () => {
    const cont = el.querySelector('#sets'); if (!cont) return;
    cont.innerHTML = parciales.map((s, i) => `<div class="set-row"><span class="n">Set ${i + 1}</span><input class="input" type="number" inputmode="numeric" min="0" max="60" data-set="${i}" data-lado="0" value="${s[0] ?? ''}" aria-label="Puntos Univalle set ${i + 1}" placeholder="0"><span class="muted">–</span><input class="input" type="number" inputmode="numeric" min="0" max="60" data-set="${i}" data-lado="1" value="${s[1] ?? ''}" aria-label="Puntos rival set ${i + 1}" placeholder="0">${i >= 3 ? `<button type="button" class="icon-btn" data-quitar="${i}" aria-label="Quitar set ${i + 1}">${icon('cerrar')}</button>` : '<span></span>'}</div>`).join('');
    cont.querySelectorAll('input').forEach((inp) => (inp.oninput = () => { parciales[+inp.dataset.set][+inp.dataset.lado] = inp.value === '' ? null : +inp.value; contarSets(); }));
    cont.querySelectorAll('[data-quitar]').forEach((b) => (b.onclick = () => { parciales.splice(+b.dataset.quitar, 1); pintarSets(); contarSets(); }));
    el.querySelector('#add-set').hidden = parciales.length >= 5;
  };
  const setsJugados = () => parciales.filter((s) => s[0] != null && s[1] != null && (s[0] > 0 || s[1] > 0));
  const contarSets = () => {
    if (!esVoley) return;
    const j = setsJugados();
    el.querySelector('#o-favor').textContent = j.filter((s) => s[0] > s[1]).length;
    el.querySelector('#o-contra').textContent = j.filter((s) => s[1] > s[0]).length;
    cuadre();
  };

  // ----- planilla
  const tabla = el.querySelector('#planilla');
  const totales = () => {
    const t = {};
    tabla?.querySelectorAll('tbody tr').forEach((tr) => { if (tr.classList.contains('off')) return; tr.querySelectorAll('.cell').forEach((c) => { t[c.dataset.m] = (t[c.dataset.m] || 0) + (+c.value || 0); }); });
    return t;
  };
  const cuadre = () => {
    if (!tabla) return;
    const t = totales();
    tabla.querySelectorAll('[data-tot]').forEach((td) => (td.textContent = fmtInt(t[td.dataset.tot] || 0)));
    const linea = el.querySelector('#cuadre');
    const favor = esVoley ? null : form.favor.value === '' ? null : +form.favor.value;
    let txt = '', warn = false;
    if (eq.deporte === 'baloncesto' && favor != null) {
      const pts = 2 * (t.t2 || 0) + 3 * (t.t3 || 0) + (t.tl || 0);
      warn = pts !== favor; txt = warn ? `Los tiros anotados suman ${pts} puntos y el marcador dice ${favor}.` : `Los tiros anotados suman ${pts} puntos, igual que el marcador.`;
      for (const [a, b] of [['t2', 't2_int'], ['t3', 't3_int'], ['tl', 'tl_int']]) if ((t[b] || 0) && (t[a] || 0) > (t[b] || 0)) { warn = true; txt += ' Hay más tiros anotados que intentados.'; break; }
    } else if (['futbol11', 'futbol_sala', 'balonmano'].includes(eq.deporte) && favor != null) {
      const g = t.goles || 0;
      warn = g > favor; txt = g === favor ? `Los goles de los jugadores suman ${g}, igual que el marcador.` : g < favor ? `Los goles de los jugadores suman ${g} de ${favor}; ${favor - g === 1 ? 'el que falta puede ser autogol del rival' : 'los que faltan pueden ser autogoles del rival'}.` : `Los goles de los jugadores suman ${g}, más que los ${favor} del marcador.`;
    } else if (esVoley) {
      const pts = (t.ataque_pts || 0) + (t.bloqueos || 0) + (t.aces || 0), total = setsJugados().reduce((s, x) => s + x[0], 0);
      txt = total ? `Puntos de jugadores: ${pts} de ${total} puntos del equipo (el resto son errores del rival).` : '';
      warn = total > 0 && pts > total;
    }
    linea.textContent = txt; linea.classList.toggle('warn', warn);
  };
  if (tabla) {
    tabla.addEventListener('input', (e) => {
      const c = e.target.closest('.cell'); if (!c) return;
      c.classList.toggle('has', +c.value > 0);
      const tr = c.closest('tr'); if (+c.value > 0 && tr.classList.contains('off')) { tr.classList.remove('off'); tr.querySelector('input[type=checkbox]').checked = true; }
      cuadre();
    });
    tabla.addEventListener('change', (e) => { if (e.target.type === 'checkbox') { e.target.closest('tr').classList.toggle('off', !e.target.checked); cuadre(); } });
    // Enter baja a la misma columna del siguiente jugador
    tabla.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !e.target.classList.contains('cell')) return;
      e.preventDefault();
      const tr = e.target.closest('tr'), idx = [...tr.querySelectorAll('.cell')].indexOf(e.target);
      const next = (e.shiftKey ? tr.previousElementSibling : tr.nextElementSibling)?.querySelectorAll('.cell')[idx];
      if (next) { next.focus(); next.select(); }
    });
    tabla.addEventListener('focusin', (e) => { if (e.target.classList.contains('cell')) e.target.select(); });
    el.querySelector('#todos').onclick = () => { tabla.querySelectorAll('tbody tr').forEach((tr) => { tr.classList.remove('off'); tr.querySelector('input[type=checkbox]').checked = true; }); cuadre(); };
  }
  if (esVoley) { pintarSets(); contarSets(); el.querySelector('#add-set').onclick = () => { parciales.push([null, null]); pintarSets(); }; }
  if (!esVoley) { form.favor.oninput = cuadre; form.rival.oninput = () => { el.querySelector('#lbl-rival').textContent = form.rival.value || 'Rival'; }; }
  cuadre();

  form.onsubmit = async (e) => {
    e.preventDefault(); msg.textContent = '';
    const f = Object.fromEntries(new FormData(form));
    const fallo = (texto, campo) => { msg.textContent = texto; campo?.setAttribute('aria-invalid', 'true'); campo?.focus(); };
    form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    if (!f.fecha) return fallo('Escribe la fecha del partido.', form.fecha);
    if (!(f.rival || '').trim()) return fallo('Escribe el nombre del rival.', form.rival);
    let favor, contra, sets = null;
    if (esVoley) {
      sets = setsJugados();
      if (!sets.length) return fallo('Escribe los puntos de al menos un set.', el.querySelector('#sets input'));
      if (sets.some((s) => s[0] === s[1])) return fallo('Un set no puede terminar empatado.', null);
      favor = sets.filter((s) => s[0] > s[1]).length; contra = sets.length - favor;
    } else {
      if (f.favor === '' || f.contra === '') return fallo('Escribe el marcador de los dos equipos.', f.favor === '' ? form.favor : form.contra);
      favor = Math.max(0, Math.round(+f.favor)); contra = Math.max(0, Math.round(+f.contra));
    }
    const lineas = [];
    tabla?.querySelectorAll('tbody tr').forEach((tr) => {
      if (tr.classList.contains('off')) return;
      const jid = tr.dataset.j; let alguna = false;
      tr.querySelectorAll('.cell').forEach((c) => { const v = Math.max(0, Math.round(+c.value || 0)); if (v > 0) { lineas.push({ jugador_id: jid, metrica: c.dataset.m, valor: v }); alguna = true; } });
      if (!alguna) lineas.push({ jugador_id: jid, metrica: 'jugo', valor: 1 }); // registra que jugó aunque no sumó
    });
    const btn = form.querySelector('button[type=submit]');
    await ocupado(btn, async () => {
      try {
        await ctx.api.guardarPartido({ id: p?.id, equipo_id: eq.id, fecha: f.fecha, rival: f.rival.trim(), condicion: f.condicion, competicion: (f.competicion || '').trim(), marcador_favor: favor, marcador_contra: contra, parciales: sets, notas: (f.notas || '').trim() }, lineas);
        ctx.invalidar();
        aviso(p ? 'Cambios guardados' : `Partido guardado: ${favor}–${contra} ante ${f.rival.trim()}`);
        ctx.ir('#/resumen');
      } catch (err) { msg.textContent = mensajeError(err); }
    });
  };
}

// ---------------------------------------------------------------------------
// Jugadores
// ---------------------------------------------------------------------------
export async function vistaJugadores(el, ctx) {
  const eq = ctx.equipo, dep = deporte(eq.deporte);
  const { jugadores, partidos, filas } = await ctx.cargarEquipo();
  const { porJugador } = agregar(partidos, jugadores, filas);
  const pj = new Map(porJugador.map((x) => [x.jugador.id, x]));
  const activos = jugadores.filter((j) => j.activo), inactivos = jugadores.filter((j) => !j.activo);
  const opcionesPos = (sel) => `<option value="">Sin posición</option>${dep.posiciones.map((x) => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('')}`;
  const fila = (j) => { const x = pj.get(j.id); return `<tr data-id="${j.id}" class="${j.activo ? '' : 'inactive'}">
      <td class="n" style="width:56px"><span class="dorsal">${j.dorsal ?? '—'}</span></td>
      <td><a class="row-link" href="#/jugadores/${j.id}">${esc(j.nombre)}</a></td>
      <td class="muted">${esc(j.posicion || '—')}</td>
      <td class="n">${cifra(x?.pj || 0, fmtInt(x?.pj || 0))}</td>
      <td class="n">${cifra(puntosJugador(eq.deporte, x?.tot || {}), fmtInt(puntosJugador(eq.deporte, x?.tot || {})))}</td>
      <td class="n" style="white-space:nowrap"><button class="icon-btn" data-editar aria-label="Editar a ${esc(j.nombre)}" title="Editar">${icon('editar')}</button><button class="link-btn" data-activo style="margin-left:8px">${j.activo ? 'Dar de baja' : 'Reactivar'}</button></td>
    </tr>`; };
  el.innerHTML = `
    <div class="title-row"><div><h1>Jugadores</h1><p class="sub muted">${activos.length} activos${inactivos.length ? ` · ${inactivos.length} de baja` : ''} · ${esc(eq.nombre)}</p></div></div>
    <section class="panel">
      <header><div><h2>Agregar jugador</h2><p class="meta">Se guarda al presionar Enter; el formulario queda listo para el siguiente.</p></div></header>
      <form id="f-jug" class="form-grid" novalidate>
        <div class="field c6"><label for="j-nombre">Nombre completo</label><input class="input" id="j-nombre" name="nombre" required autocomplete="off" placeholder="Nombre y apellido"></div>
        <div class="field c3 keep"><label for="j-dorsal">Dorsal</label><input class="input" id="j-dorsal" name="dorsal" type="number" inputmode="numeric" min="0" max="99" placeholder="0–99"></div>
        <div class="field c3 keep"><label for="j-pos">Posición</label><select class="input" id="j-pos" name="posicion">${opcionesPos('')}</select></div>
        <div class="form-actions" style="grid-column:1/-1;justify-content:space-between"><p class="form-msg" role="alert"></p><button class="btn accent" type="submit">${icon('mas')}Agregar jugador</button></div>
      </form>
    </section>
    <section class="panel flush" style="margin-top:var(--gap)">
      <header><h2>Plantel</h2><span class="meta">${dep.anota === 'sets' ? 'Pts = ataque + bloqueo + aces' : dep.anota === 'puntos' ? 'Pts = puntos anotados' : 'Gol = goles marcados'}</span></header>
      <div class="table-wrap table-panel">
        ${jugadores.length ? `<table><thead><tr><th class="n">#</th><th>Jugador</th><th>Posición</th><th class="n">PJ</th><th class="n">${dep.anota === 'goles' ? 'Gol' : 'Pts'}</th><th class="n"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>${[...activos, ...inactivos].map(fila).join('')}</tbody></table>` : `<div class="empty" style="margin:16px 0"><p>Agrega a tus jugadores arriba. Con nombre, dorsal y posición basta.</p></div>`}
      </div>
    </section>`;

  const form = el.querySelector('#f-jug'), msg = form.querySelector('.form-msg');
  form.onsubmit = async (e) => {
    e.preventDefault(); msg.textContent = '';
    const nombre = form.nombre.value.trim(), dorsal = form.dorsal.value === '' ? null : +form.dorsal.value;
    if (!nombre) { msg.textContent = 'Escribe el nombre del jugador.'; form.nombre.focus(); return; }
    if (dorsal != null && (dorsal < 0 || dorsal > 99)) { msg.textContent = 'El dorsal va de 0 a 99.'; form.dorsal.focus(); return; }
    if (dorsal != null && activos.some((j) => j.dorsal === dorsal)) { msg.textContent = `El dorsal ${dorsal} ya lo usa ${activos.find((j) => j.dorsal === dorsal).nombre}.`; form.dorsal.focus(); return; }
    await ocupado(form.querySelector('button[type=submit]'), async () => {
      try {
        await ctx.api.crearJugador({ equipo_id: eq.id, nombre, dorsal, posicion: form.posicion.value || null });
        ctx.invalidar(); aviso(`${nombre} agregado al plantel`);
        await ctx.render();
        document.getElementById('j-nombre')?.focus();
      } catch (err) { msg.textContent = mensajeError(err); }
    });
  };

  el.querySelectorAll('tr[data-id]').forEach((tr) => {
    const j = jugadores.find((x) => x.id === tr.dataset.id);
    tr.querySelector('[data-activo]').onclick = async () => {
      try { await ctx.api.actualizarJugador(j.id, { activo: !j.activo }); ctx.invalidar(); aviso(j.activo ? `${j.nombre} quedó de baja; sus datos se conservan` : `${j.nombre} reactivado`); ctx.render(); } catch (err) { aviso(mensajeError(err), 'error'); }
    };
    tr.querySelector('[data-editar]').onclick = () => {
      tr.innerHTML = `<td colspan="6"><form class="form-grid" novalidate style="padding:8px 0">
        <div class="field c6"><label>Nombre</label><input class="input" name="nombre" value="${esc(j.nombre)}" required></div>
        <div class="field c3 keep"><label>Dorsal</label><input class="input" name="dorsal" type="number" inputmode="numeric" min="0" max="99" value="${j.dorsal ?? ''}"></div>
        <div class="field c3 keep"><label>Posición</label><select class="input" name="posicion">${opcionesPos(j.posicion)}</select></div>
        <div class="form-actions" style="grid-column:1/-1;justify-content:space-between"><button type="button" class="link-btn danger" data-del>Eliminar jugador</button><span style="display:flex;gap:8px"><button type="button" class="btn" data-cancel>Cancelar</button><button class="btn primary">Guardar</button></span></div>
      </form></td>`;
      const f = tr.querySelector('form'); f.nombre.focus();
      f.querySelector('[data-cancel]').onclick = () => ctx.render();
      f.querySelector('[data-del]').onclick = async () => {
        const n = pj.get(j.id)?.pj || 0;
        const ok = await confirmar({ titulo: `¿Eliminar a ${j.nombre}?`, texto: n ? `Se borran también sus estadísticas de ${n} partidos. Si solo dejó el equipo, usa "Dar de baja" para conservar su historial.` : 'No tiene partidos registrados. No se puede deshacer.', accion: 'Eliminar jugador' });
        if (!ok) return;
        try { await ctx.api.eliminarJugador(j.id); ctx.invalidar(); aviso('Jugador eliminado'); ctx.render(); } catch (err) { aviso(mensajeError(err), 'error'); }
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        if (!f.nombre.value.trim()) { f.nombre.focus(); return; }
        try { await ctx.api.actualizarJugador(j.id, { nombre: f.nombre.value.trim(), dorsal: f.dorsal.value === '' ? null : +f.dorsal.value, posicion: f.posicion.value || null }); ctx.invalidar(); aviso('Jugador actualizado'); ctx.render(); } catch (err) { aviso(mensajeError(err), 'error'); }
      };
    };
  });
}

// Ficha de un jugador: su temporada partido a partido
export async function vistaJugador(el, ctx, jugadorId) {
  const eq = ctx.equipo, dep = deporte(eq.deporte);
  const { jugadores, partidos, filas } = await ctx.cargarEquipo();
  const j = jugadores.find((x) => x.id === jugadorId);
  if (!j) { el.innerHTML = `<div class="error-box">Ese jugador no está en este equipo. <a class="card-link" href="#/jugadores">Ver plantel</a></div>`; return; }
  const mias = filas.filter((f) => f.jugador_id === j.id);
  const porP = new Map(); for (const f of mias) { (porP.get(f.partido_id) || porP.set(f.partido_id, {}).get(f.partido_id))[f.metrica] = Number(f.valor); }
  const jugados = [...partidos].sort((a, b) => a.fecha.localeCompare(b.fecha)).filter((p) => porP.has(p.id));
  const tot = {}; for (const f of mias) tot[f.metrica] = (tot[f.metrica] || 0) + Number(f.valor);
  const pts = puntosJugador(eq.deporte, tot);
  const etiqueta = dep.anota === 'goles' ? 'Goles' : 'Puntos';
  const usadas = dep.metricas.filter((m) => tot[m.k]);
  el.innerHTML = `
    <div class="title-row"><div><a class="back" href="#/jugadores">${icon('volver')}Plantel</a><h1><span class="dorsal" style="font-size:28px;margin-right:10px">${j.dorsal ?? ''}</span>${esc(j.nombre)}</h1><p class="sub muted">${esc(j.posicion || 'Sin posición')} · ${esc(eq.nombre)}${j.activo ? '' : ' · De baja'}</p></div></div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">Partidos jugados</div><div class="kpi-value">${fmtInt(jugados.length)}<small>de ${partidos.length}</small></div></div>
      <div class="kpi"><div class="kpi-label">${etiqueta}</div><div class="kpi-value">${fmtInt(pts)}</div></div>
      <div class="kpi"><div class="kpi-label">${etiqueta} por partido</div><div class="kpi-value">${jugados.length ? fmtDec1(pts / jugados.length) : '—'}</div></div>
      ${dep.anota === 'goles' ? `<div class="kpi"><div class="kpi-label">Asistencias</div><div class="kpi-value">${fmtInt(tot.asistencias || 0)}</div></div>` : dep.anota === 'puntos' ? `<div class="kpi"><div class="kpi-label">Rebotes por partido</div><div class="kpi-value">${jugados.length ? fmtDec1((tot.rebotes || 0) / jugados.length) : '—'}</div></div>` : `<div class="kpi"><div class="kpi-label">Aces</div><div class="kpi-value">${fmtInt(tot.aces || 0)}</div></div>`}
    </div>
    <section class="panel" style="margin-top:var(--gap)"><header><div><h2>${etiqueta} por partido</h2><p class="meta">Solo partidos en los que jugó</p></div></header><div class="chart" id="ch-j"></div></section>
    <section class="panel flush" style="margin-top:var(--gap)"><header><h2>Partido a partido</h2></header>
      <div class="table-wrap table-panel">${jugados.length ? `<table><thead><tr><th>Fecha</th><th>Partido</th>${usadas.map((m) => `<th class="n"><abbr title="${esc(m.l)}" style="text-decoration:none">${esc(m.c)}</abbr></th>`).join('')}</tr></thead><tbody>${jugados.map((p) => `<tr><td class="muted" style="white-space:nowrap">${fechaCorta(p.fecha)}</td><td>${bug(p)}</td>${usadas.map((m) => `<td class="n">${cifra(porP.get(p.id)[m.k] || 0, fmtInt(porP.get(p.id)[m.k] || 0))}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><td></td><td style="padding-top:12px;font-weight:500">Total</td>${usadas.map((m) => `<td class="n" style="padding-top:12px;font-weight:600">${fmtInt(tot[m.k])}</td>`).join('')}</tr></tfoot></table>` : '<div class="empty" style="margin:16px 0"><p>Todavía no tiene partidos registrados.</p></div>'}</div>
    </section>`;
  const ch = el.querySelector('#ch-j');
  if (jugados.length) window.Charts.bars(ch, { labels: jugados.map((p) => fechaCorta(p.fecha)), values: jugados.map((p) => puntosJugador(eq.deporte, porP.get(p.id))), height: 180 });
  else ch.innerHTML = '<div class="empty"><p>Sin partidos todavía.</p></div>';
}

// ---------------------------------------------------------------------------
// Equipo: crear y ajustar
// ---------------------------------------------------------------------------
export async function vistaEquipo(el, ctx, nuevo) {
  const eq = nuevo ? null : ctx.equipo;
  const tienePartidos = eq ? (await ctx.cargarEquipo()).partidos.length > 0 : false;
  const primero = nuevo && !ctx.equipos.some((e) => e.profesor_id === ctx.perfil.id);
  el.innerHTML = `
    <div class="title-row"><div><h1>${nuevo ? (primero ? 'Registra tu equipo' : 'Nuevo equipo') : 'Equipo'}</h1><p class="sub muted">${nuevo ? 'Elige el deporte y la categoría. Las estadísticas y los indicadores se ajustan a cada deporte.' : subtitulo(eq)}</p></div></div>
    <form id="f-eq" novalidate>
      <section class="panel">
        <header><h2>Datos del equipo</h2></header>
        <div class="form-grid">
          <div class="field c8"><label for="e-nombre">Nombre del equipo</label><input class="input" id="e-nombre" name="nombre" required value="${esc(eq?.nombre || '')}" placeholder="Univalle Fútbol Sala Femenino"></div>
          <div class="field c4"><label for="e-temp">Temporada</label><input class="input" id="e-temp" name="temporada" required value="${esc(eq?.temporada || String(new Date().getFullYear()))}"></div>
          <div class="field"><span class="label" id="lbl-dep">Deporte</span>
            <div class="choice" role="radiogroup" aria-labelledby="lbl-dep">${Object.entries(DEPORTES).map(([k, d]) => `<input type="radio" name="deporte" id="d-${k}" value="${k}" ${(eq?.deporte || '') === k ? 'checked' : ''} ${tienePartidos && eq.deporte !== k ? 'disabled' : ''}><label for="d-${k}">${d.nombre}</label>`).join('')}</div>
            ${tienePartidos ? '<span class="hint">El deporte no se puede cambiar porque ya hay partidos registrados.</span>' : ''}
          </div>
          <div class="field"><span class="label" id="lbl-cat">Categoría</span>
            <div class="choice" role="radiogroup" aria-labelledby="lbl-cat">${Object.entries(CATEGORIAS).map(([k, v]) => `<input type="radio" name="categoria" id="c-${k}" value="${k}" ${(eq?.categoria || '') === k ? 'checked' : ''}><label for="c-${k}">${v}</label>`).join('')}</div>
          </div>
        </div>
        <div class="form-actions" style="margin-top:24px;justify-content:space-between"><p class="form-msg" role="alert"></p><span style="display:flex;gap:8px">${nuevo && !primero ? '<a class="btn" href="#/resumen">Cancelar</a>' : ''}<button class="btn accent" type="submit">${nuevo ? 'Crear equipo' : 'Guardar cambios'}</button></span></div>
      </section>
    </form>
    ${eq ? `<section class="panel" style="margin-top:40px"><header><div><h2>Eliminar equipo</h2><p class="meta">Borra el equipo con sus jugadores, partidos y estadísticas. No se puede deshacer.</p></div><button class="btn danger" id="del-eq">${icon('borrar')}Eliminar equipo</button></header></section>` : ''}`;

  const form = el.querySelector('#f-eq'), msg = form.querySelector('.form-msg');
  form.onsubmit = async (e) => {
    e.preventDefault(); msg.textContent = '';
    const f = Object.fromEntries(new FormData(form));
    if (!(f.nombre || '').trim()) { msg.textContent = 'Escribe el nombre del equipo.'; form.nombre.focus(); return; }
    if (!f.deporte && !eq) { msg.textContent = 'Elige el deporte.'; return; }
    if (!f.categoria) { msg.textContent = 'Elige la categoría.'; return; }
    const datos = { nombre: f.nombre.trim(), temporada: (f.temporada || '').trim() || String(new Date().getFullYear()), categoria: f.categoria, deporte: f.deporte || eq.deporte };
    await ocupado(form.querySelector('button[type=submit]'), async () => {
      try {
        if (eq) { await ctx.api.actualizarEquipo(eq.id, datos); await ctx.recargarEquipos(eq.id); aviso('Equipo actualizado'); ctx.render(); }
        else { const n = await ctx.api.crearEquipo(datos); await ctx.recargarEquipos(n.id); aviso('Equipo creado. Ahora agrega a tus jugadores.'); ctx.ir('#/jugadores'); }
      } catch (err) { msg.textContent = mensajeError(err); }
    });
  };
  const del = el.querySelector('#del-eq');
  if (del) del.onclick = async () => {
    const ok = await confirmar({ titulo: `¿Eliminar ${eq.nombre}?`, texto: 'Se borran sus jugadores, partidos y estadísticas. No se puede deshacer.', accion: 'Eliminar equipo' });
    if (!ok) return;
    try { await ctx.api.eliminarEquipo(eq.id); localStorage.removeItem('datasport-equipo'); await ctx.recargarEquipos(); aviso('Equipo eliminado'); ctx.ir(ctx.equipo ? '#/resumen' : '#/equipo/nuevo'); } catch (err) { aviso(mensajeError(err), 'error'); }
  };
}

// ---------------------------------------------------------------------------
// Profesores (solo coordinación)
// ---------------------------------------------------------------------------
export async function vistaProfesores(el, ctx) {
  const [invs, equipos, perfiles] = await Promise.all([ctx.api.invitaciones(), ctx.api.equiposTodos(), ctx.api.perfiles()]);
  const idPorEmail = new Map(perfiles.map((x) => [x.email, x.id]));
  const pendientes = invs.filter((i) => !i.activada_en).length;
  el.innerHTML = `
    <div class="title-row"><div><h1>Profesores</h1><p class="sub muted">${invs.length} registrados · ${pendientes} sin activar · ${equipos.length} equipos</p></div></div>
    <section class="panel">
      <header><div><h2>Registrar profesor</h2><p class="meta">Se genera una llave de acceso. Entrégasela al profesor junto con el enlace de esta página.</p></div></header>
      <form id="f-inv" class="form-grid" novalidate>
        <div class="field c6"><label for="i-nombre">Nombre</label><input class="input" id="i-nombre" name="nombre" required autocomplete="off"></div>
        <div class="field c6"><label for="i-email">Correo</label><input class="input" id="i-email" name="email" type="email" required autocomplete="off" placeholder="nombre@correounivalle.edu.co"></div>
        <div class="form-actions" style="grid-column:1/-1;justify-content:space-between"><label class="muted" style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="admin" style="accent-color:var(--accent)"> También es coordinador (puede registrar profesores)</label><span style="display:flex;gap:12px;align-items:center"><p class="form-msg" role="alert"></p><button class="btn accent" type="submit">${icon('mas')}Registrar y generar llave</button></span></div>
      </form>
    </section>
    <section class="panel flush" style="margin-top:var(--gap)">
      <header><h2>Profesores registrados</h2></header>
      <div class="table-wrap table-panel">${invs.length ? `<table><thead><tr><th>Profesor</th><th>Estado</th><th>Llave de acceso</th><th class="n">Equipos</th><th class="n"><span class="visually-hidden">Acciones</span></th></tr></thead><tbody>
        ${invs.map((i) => { const n = equipos.filter((e) => e.profesor_id === idPorEmail.get(i.email)).length; return `<tr><td>${esc(i.nombre)}<span class="sub">${esc(i.email)}${i.es_admin ? ' · Coordinación' : ''}</span></td>
          <td>${i.activada_en ? `<span class="pill pos">Activa</span>` : `<span class="pill warn">Pendiente</span>`}</td>
          <td>${i.activada_en ? '<span class="muted">Usada</span>' : `<span class="key"><code>${esc(i.llave)}</code><button data-copiar="${esc(i.llave)}">Copiar</button></span>`}</td>
          <td class="n">${n ? fmtInt(n) : '<span class="zero">—</span>'}</td>
          <td class="n">${i.email === ctx.perfil.email ? '' : `<button class="link-btn danger" data-quitar="${esc(i.email)}">${i.activada_en ? 'Retirar' : 'Anular'}</button>`}</td></tr>`; }).join('')}
      </tbody></table>` : '<div class="empty" style="margin:16px 0"><p>No hay profesores registrados.</p></div>'}</div>
    </section>`;
  const form = el.querySelector('#f-inv'), msg = form.querySelector('.form-msg');
  form.onsubmit = async (e) => {
    e.preventDefault(); msg.textContent = '';
    const nombre = form.nombre.value.trim(), email = form.email.value.trim();
    if (!nombre) { msg.textContent = 'Escribe el nombre.'; form.nombre.focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = 'Escribe un correo válido.'; form.email.focus(); return; }
    await ocupado(form.querySelector('button[type=submit]'), async () => {
      try { const inv = await ctx.api.crearInvitacion(email, nombre, form.admin.checked); aviso(`Llave para ${inv.nombre}: ${inv.llave}`); ctx.render(); } catch (err) { msg.textContent = mensajeError(err); }
    });
  };
  el.querySelectorAll('[data-copiar]').forEach((b) => (b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copiar); b.textContent = 'Copiada'; setTimeout(() => (b.textContent = 'Copiar'), 1600); } catch { aviso('No se pudo copiar; selecciona la llave y cópiala a mano.', 'error'); } }));
  el.querySelectorAll('[data-quitar]').forEach((b) => (b.onclick = async () => {
    const inv = invs.find((i) => i.email === b.dataset.quitar);
    const ok = await confirmar({ titulo: `¿${inv.activada_en ? 'Retirar' : 'Anular'} la invitación de ${inv.nombre}?`, texto: inv.activada_en ? 'Su cuenta ya está activa: retirar la invitación no borra su cuenta ni sus equipos. Para bloquear el acceso, elimina el usuario en Supabase → Authentication.' : 'La llave dejará de funcionar.', accion: inv.activada_en ? 'Retirar' : 'Anular llave' });
    if (!ok) return;
    try { await ctx.api.eliminarInvitacion(inv.email); aviso('Invitación retirada'); ctx.render(); } catch (err) { aviso(mensajeError(err), 'error'); }
  }));
}
