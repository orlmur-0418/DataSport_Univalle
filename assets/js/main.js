// Arranque, sesión, menú y rutas (#/resumen, #/partidos, …)
import { crearAdaptador, modo, mensajeError, reiniciarDemo, entrarDemo } from './data.js';
import { esc, icon, marca, iniciales, aviso } from './ui.js';
import * as V from './views.js';
import { vistaLogin, vistaNuevaClave } from './login.js';

const app = document.getElementById('app');
const EQUIPO_KEY = 'datasport-equipo';

const ctx = {
  api: null,
  perfil: null,
  equipos: [],
  equipo: null,
  datos: null,            // { jugadores, partidos, filas } del equipo actual
  async cargarEquipo(force = false) {
    if (!ctx.equipo) { ctx.datos = null; return null; }
    if (ctx.datos && ctx.datos.equipoId === ctx.equipo.id && !force) return ctx.datos;
    const [jugadores, partidos] = await Promise.all([ctx.api.jugadores(ctx.equipo.id), ctx.api.partidos(ctx.equipo.id)]);
    const filas = await ctx.api.estadisticas(partidos.map((p) => p.id));
    ctx.datos = { equipoId: ctx.equipo.id, jugadores, partidos, filas };
    return ctx.datos;
  },
  invalidar() { ctx.datos = null; },
  async recargarEquipos(preferido) {
    ctx.equipos = await ctx.api.equipos();
    const guardado = preferido || localStorage.getItem(EQUIPO_KEY);
    ctx.equipo = ctx.equipos.find((e) => e.id === guardado) || ctx.equipos.find((e) => e.profesor_id === ctx.perfil?.id) || ctx.equipos[0] || null;
    if (ctx.equipo) localStorage.setItem(EQUIPO_KEY, ctx.equipo.id);
    ctx.invalidar();
  },
  ir(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  render: () => render(),
};

// Equipos visibles en el selector: los propios (el admin ve todos en Profesores)
const misEquipos = () => ctx.equipos.filter((e) => e.profesor_id === ctx.perfil?.id);

function shell(ruta) {
  const eq = ctx.equipo;
  const nav = [
    ['resumen', 'Resumen', '#/resumen'],
    ['partidos', 'Partidos', '#/partidos', ctx.datos?.partidos.length],
    ['jugadores', 'Jugadores', '#/jugadores', ctx.datos?.jugadores.filter((j) => j.activo).length],
    ['equipo', 'Equipo', '#/equipo'],
  ];
  const actual = ruta.split('/')[1] || 'resumen';
  const opciones = misEquipos().map((e) => `<option value="${e.id}" ${e.id === eq?.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('');
  app.innerHTML = `
  <div class="app">
    <aside class="sidebar" id="sidebar" aria-label="Menú principal">
      <button class="icon-btn close-menu" data-cerrar-menu aria-label="Cerrar menú">${icon('cerrar')}</button>
      <a class="brand" href="#/resumen">${marca()}<span class="brand-name">DataSport<span>Univalle</span></span></a>
      ${misEquipos().length ? `<div class="team-switch"><label for="sel-equipo">Equipo</label><select id="sel-equipo" class="input">${opciones}<option value="__nuevo">+ Crear otro equipo</option></select></div>` : ''}
      <nav>
        ${eq ? nav.map(([k, l, h, c]) => `<a class="nav-item" href="${h}" ${actual === k ? 'aria-current="page"' : ''}>${icon(k)}<span>${l}</span>${c != null ? `<span class="count">${c}</span>` : ''}</a>`).join('') : ''}
        ${ctx.perfil?.es_admin ? `<div class="group-label">Coordinación</div><a class="nav-item" href="#/profesores" ${actual === 'profesores' ? 'aria-current="page"' : ''}>${icon('profesores')}<span>Profesores</span></a>` : ''}
      </nav>
      <div class="bottom">
        <div class="user-row">
          <span class="avatar" aria-hidden="true">${esc(iniciales(ctx.perfil?.nombre))}</span>
          <span class="who"><b>${esc(ctx.perfil?.nombre || '')}</b><span>${esc(ctx.perfil?.email || '')}</span></span>
          <button class="icon-btn" data-salir aria-label="Cerrar sesión" title="Cerrar sesión">${icon('salir')}</button>
        </div>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn" data-abrir-menu aria-label="Abrir menú" aria-controls="sidebar">${icon('menu')}</button>
        <span class="where">${esc(eq?.nombre || 'DataSport Univalle')}</span>
        ${eq ? `<a class="btn accent" href="#/partidos/nuevo">${icon('mas')}<span>Partido</span></a>` : ''}
      </header>
      <main class="canvas" id="vista" tabindex="-1">
        ${modo() === 'demo' ? `<div class="notice">Estás en modo demostración: los datos son de ejemplo y se guardan solo en este navegador. <button class="card-link" data-reiniciar-demo>Restaurar datos de ejemplo</button></div>` : ''}
        <div id="contenido"></div>
      </main>
    </div>
  </div>`;

  const sidebar = app.querySelector('#sidebar');
  app.querySelector('[data-abrir-menu]').onclick = () => sidebar.classList.add('open');
  app.querySelector('[data-cerrar-menu]').onclick = () => sidebar.classList.remove('open');
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a')) sidebar.classList.remove('open'); });
  app.querySelector('[data-salir]').onclick = async () => { await ctx.api.salir(); localStorage.removeItem(EQUIPO_KEY); location.hash = ''; boot(); };
  const sel = app.querySelector('#sel-equipo');
  if (sel) sel.onchange = async () => {
    if (sel.value === '__nuevo') { ctx.ir('#/equipo/nuevo'); return; }
    localStorage.setItem(EQUIPO_KEY, sel.value);
    ctx.equipo = ctx.equipos.find((e) => e.id === sel.value); ctx.invalidar();
    render();
  };
  const rd = app.querySelector('[data-reiniciar-demo]');
  if (rd) rd.onclick = () => { reiniciarDemo(); localStorage.removeItem(EQUIPO_KEY); boot(); };
  return app.querySelector('#contenido');
}

let renderId = 0;
async function render() {
  const id = ++renderId;
  const ruta = (location.hash || '#/resumen').replace(/^#/, '') || '/resumen';
  if (ruta === '/clave') { vistaNuevaClave(app, ctx); return; }
  if (!ctx.equipo && !['/equipo/nuevo', '/profesores'].includes(ruta)) { location.replace('#/equipo/nuevo'); return; }

  // el contador del menú necesita los datos del equipo; se piden una vez y quedan en caché
  if (ctx.equipo && !ctx.datos) { try { await ctx.cargarEquipo(); } catch { /* la vista mostrará el error */ } }
  if (id !== renderId) return;
  const el = shell(ruta);
  const partes = ruta.split('/').filter(Boolean);
  const titulo = { resumen: 'Resumen', partidos: 'Partidos', jugadores: 'Jugadores', equipo: 'Equipo', profesores: 'Profesores' }[partes[0]] || 'Resumen';
  document.title = `${titulo} · DataSport Univalle`;
  try {
    if (partes[0] === 'partidos' && partes[1]) await V.vistaPlanilla(el, ctx, partes[1] === 'nuevo' ? null : partes[1]);
    else if (partes[0] === 'partidos') await V.vistaPartidos(el, ctx);
    else if (partes[0] === 'jugadores' && partes[1]) await V.vistaJugador(el, ctx, partes[1]);
    else if (partes[0] === 'jugadores') await V.vistaJugadores(el, ctx);
    else if (partes[0] === 'equipo' && partes[1] === 'nuevo') await V.vistaEquipo(el, ctx, true);
    else if (partes[0] === 'equipo') await V.vistaEquipo(el, ctx, false);
    else if (partes[0] === 'profesores' && ctx.perfil?.es_admin) await V.vistaProfesores(el, ctx);
    else await V.vistaResumen(el, ctx);
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="error-box" role="alert"><span>No se pudo cargar esta vista. ${esc(mensajeError(err))}</span><button class="link-btn" data-reintentar>Reintentar</button></div>`;
    el.querySelector('[data-reintentar]').onclick = () => { ctx.invalidar(); render(); };
  }
}

async function entrar() {
  ctx.perfil = await ctx.api.perfil();
  if (!ctx.perfil) {
    app.innerHTML = `<div class="boot"><div class="error-box" role="alert"><span>Tu cuenta no tiene perfil de profesor. Pide a la coordinación que revise tu invitación.</span><button class="link-btn" data-salir>Cerrar sesión</button></div></div>`;
    app.querySelector('[data-salir]').onclick = async () => { await ctx.api.salir(); boot(); };
    return;
  }
  await ctx.recargarEquipos();
  render();
}

let escuchando = false;
async function boot() {
  app.innerHTML = `<div class="boot">Cargando…</div>`;
  try {
    ctx.api = crearAdaptador();
  } catch (err) {
    app.innerHTML = `<div class="boot"><div class="error-box" role="alert">${esc(mensajeError(err))}</div></div>`;
    return;
  }
  ctx.perfil = null; ctx.equipos = []; ctx.equipo = null; ctx.datos = null;
  if (!escuchando && ctx.api.modo === 'supabase') {
    escuchando = true;
    ctx.api.onAuth((evento) => {
      if (evento === 'PASSWORD_RECOVERY') location.hash = '#/clave';
    });
  }
  let sesion = null;
  try { sesion = await ctx.api.sesion(); } catch (err) { console.error(err); }
  if (location.hash === '#/clave' && sesion) { vistaNuevaClave(app, ctx); return; }
  if (!sesion) { vistaLogin(app, ctx, () => boot()); return; }
  try { await entrar(); } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="boot"><div class="error-box" role="alert"><span>${esc(mensajeError(err))}</span><button class="link-btn" data-r>Reintentar</button></div></div>`;
    app.querySelector('[data-r]').onclick = boot;
  }
}

// ?demo abre directamente el modo demostración (útil para mostrar la plataforma)
if (new URLSearchParams(location.search).has('demo')) entrarDemo();

window.addEventListener('hashchange', () => { if (ctx.perfil) render(); });
window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); aviso(mensajeError(e.reason), 'error'); });
boot();

