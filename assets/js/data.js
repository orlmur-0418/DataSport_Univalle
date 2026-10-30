// Capa de datos. Dos modos con la misma interfaz:
//  - "supabase": la plataforma real (login, RLS, base de datos en Supabase)
//  - "demo": datos de ejemplo guardados en este navegador, para explorar sin cuenta
import { SUPABASE_URL, SUPABASE_KEY } from './config.js?v=2';
import { crearDemo } from './demo-data.js';

const MODO_KEY = 'datasport-modo';
const DEMO_KEY = 'datasport-demo-v1';

export const modo = () => (localStorage.getItem(MODO_KEY) === 'demo' ? 'demo' : 'supabase');
export const entrarDemo = () => { localStorage.setItem(MODO_KEY, 'demo'); };
export const salirDemo = () => { localStorage.removeItem(MODO_KEY); };
export const reiniciarDemo = () => { localStorage.removeItem(DEMO_KEY); };

// Traduce los errores de Supabase/Postgres a frases que el profesor entienda.
export function mensajeError(err) {
  const m = String(err?.message || err || '');
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.';
  if (/Registro no autorizado|Database error saving new user/i.test(m)) return 'Ese correo no está autorizado o la llave de acceso no coincide. Pide tu llave a la coordinación deportiva.';
  if (/already registered|already been registered/i.test(m)) return 'Ese correo ya activó su cuenta. Ingresa con tu contraseña.';
  if (/Password should be at least/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentar.';
  if (/row-level security|permission denied/i.test(m)) return 'No tienes permiso para hacer esto.';
  if (/duplicate key.*invitaciones/i.test(m)) return 'Ese correo ya tiene una invitación.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
  return m || 'Algo salió mal. Intenta de nuevo.';
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
function adaptadorSupabase() {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const ok = ({ data, error }) => { if (error) throw error; return data; };
  const redirect = () => location.origin + location.pathname;

  return {
    modo: 'supabase',
    async sesion() { return ok(await sb.auth.getSession()).session; },
    onAuth(cb) { sb.auth.onAuthStateChange((evento, sesion) => cb(evento, sesion)); },
    async ingresar(email, password) { return ok(await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })); },
    async activar(email, llave, password) {
      return ok(await sb.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { llave: llave.trim().toUpperCase() }, emailRedirectTo: redirect() } }));
    },
    async recuperar(email) { return ok(await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: redirect() })); },
    async nuevaClave(password) { return ok(await sb.auth.updateUser({ password })); },
    async salir() { await sb.auth.signOut(); },

    async perfil() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;
      return ok(await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle());
    },
    async equipos() { return ok(await sb.from('equipos').select('*').order('creado_en')); },
    async crearEquipo(d) { return ok(await sb.from('equipos').insert(d).select().single()); },
    async actualizarEquipo(id, d) { return ok(await sb.from('equipos').update(d).eq('id', id).select().single()); },
    async eliminarEquipo(id) { ok(await sb.from('equipos').delete().eq('id', id)); },

    async jugadores(equipoId) { return ok(await sb.from('jugadores').select('*').eq('equipo_id', equipoId).order('dorsal', { nullsFirst: false }).order('nombre')); },
    async crearJugador(d) { return ok(await sb.from('jugadores').insert(d).select().single()); },
    async actualizarJugador(id, d) { return ok(await sb.from('jugadores').update(d).eq('id', id).select().single()); },
    async eliminarJugador(id) { ok(await sb.from('jugadores').delete().eq('id', id)); },

    async partidos(equipoId) { return ok(await sb.from('partidos').select('*').eq('equipo_id', equipoId).order('fecha').order('creado_en')); },
    async estadisticas(partidoIds) {
      if (!partidoIds.length) return [];
      const filas = [];
      for (let i = 0; i < partidoIds.length; i += 80) {
        filas.push(...ok(await sb.from('estadisticas').select('partido_id, jugador_id, metrica, valor').in('partido_id', partidoIds.slice(i, i + 80))));
      }
      return filas;
    },
    async guardarPartido(p, filas) {
      return ok(await sb.rpc('guardar_partido', {
        p_id: p.id || null, p_equipo: p.equipo_id, p_fecha: p.fecha, p_rival: p.rival, p_condicion: p.condicion,
        p_competicion: p.competicion || '', p_favor: p.marcador_favor, p_contra: p.marcador_contra,
        p_parciales: p.parciales || null, p_notas: p.notas || '', p_estadisticas: filas,
      }));
    },
    async eliminarPartido(id) { ok(await sb.from('partidos').delete().eq('id', id)); },

    async invitaciones() { return ok(await sb.from('invitaciones').select('*').order('creada_en', { ascending: false })); },
    async crearInvitacion(email, nombre, esAdmin = false) {
      const { data: { user } } = await sb.auth.getUser();
      return ok(await sb.from('invitaciones').insert({ email: email.trim().toLowerCase(), nombre: nombre.trim(), es_admin: esAdmin, creada_por: user?.id }).select().single());
    },
    async eliminarInvitacion(email) { ok(await sb.from('invitaciones').delete().eq('email', email)); },
    async equiposTodos() { return ok(await sb.from('equipos').select('id, profesor_id, nombre, deporte, categoria')); },
    async perfiles() { return ok(await sb.from('perfiles').select('id, email, nombre, es_admin')); },
  };
}

// ---------------------------------------------------------------------------
// Demo (localStorage)
// ---------------------------------------------------------------------------
function adaptadorDemo() {
  let db;
  try { db = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch { db = null; }
  if (!db) { db = crearDemo(); }
  const guardar = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch { /* sin almacenamiento: queda en memoria */ } };
  guardar();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const ahora = () => new Date().toISOString();
  const espera = () => new Promise((r) => setTimeout(r, 120));
  const copia = (x) => JSON.parse(JSON.stringify(x));
  let sesion = { user: { id: db.perfil.id, email: db.perfil.email } };

  return {
    modo: 'demo',
    async sesion() { return sesion; },
    onAuth() {},
    async ingresar() { return sesion; },
    async activar() { return sesion; },
    async recuperar() {},
    async nuevaClave() {},
    async salir() { sesion = null; salirDemo(); },

    async perfil() { return copia(db.perfil); },
    async equipos() { await espera(); return copia(db.equipos); },
    async crearEquipo(d) { const e = { id: uid(), profesor_id: db.perfil.id, creado_en: ahora(), temporada: String(new Date().getFullYear()), ...d }; db.equipos.push(e); guardar(); return copia(e); },
    async actualizarEquipo(id, d) { const e = db.equipos.find((x) => x.id === id); Object.assign(e, d); guardar(); return copia(e); },
    async eliminarEquipo(id) {
      const pids = new Set(db.partidos.filter((p) => p.equipo_id === id).map((p) => p.id));
      db.estadisticas = db.estadisticas.filter((s) => !pids.has(s.partido_id));
      db.partidos = db.partidos.filter((p) => p.equipo_id !== id);
      db.jugadores = db.jugadores.filter((j) => j.equipo_id !== id);
      db.equipos = db.equipos.filter((e) => e.id !== id); guardar();
    },

    async jugadores(equipoId) { await espera(); return copia(db.jugadores.filter((j) => j.equipo_id === equipoId).sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999) || a.nombre.localeCompare(b.nombre))); },
    async crearJugador(d) { const j = { id: uid(), activo: true, creado_en: ahora(), ...d }; db.jugadores.push(j); guardar(); return copia(j); },
    async actualizarJugador(id, d) { const j = db.jugadores.find((x) => x.id === id); Object.assign(j, d); guardar(); return copia(j); },
    async eliminarJugador(id) { db.jugadores = db.jugadores.filter((j) => j.id !== id); db.estadisticas = db.estadisticas.filter((s) => s.jugador_id !== id); guardar(); },

    async partidos(equipoId) { await espera(); return copia(db.partidos.filter((p) => p.equipo_id === equipoId).sort((a, b) => a.fecha.localeCompare(b.fecha))); },
    async estadisticas(ids) { const set = new Set(ids); return copia(db.estadisticas.filter((s) => set.has(s.partido_id))); },
    async guardarPartido(p, filas) {
      const id = p.id || uid();
      const previo = db.partidos.find((x) => x.id === id);
      const fila = { creado_en: previo?.creado_en || ahora(), ...p, id };
      db.partidos = db.partidos.filter((x) => x.id !== id).concat(fila);
      db.estadisticas = db.estadisticas.filter((s) => s.partido_id !== id).concat(filas.filter((f) => f.valor > 0).map((f) => ({ ...f, partido_id: id })));
      guardar(); return id;
    },
    async eliminarPartido(id) { db.partidos = db.partidos.filter((p) => p.id !== id); db.estadisticas = db.estadisticas.filter((s) => s.partido_id !== id); guardar(); },

    async invitaciones() { return copia(db.invitaciones); },
    async crearInvitacion(email, nombre, esAdmin = false) {
      email = email.trim().toLowerCase();
      if (db.invitaciones.some((i) => i.email === email)) throw new Error('duplicate key invitaciones');
      const h = () => Math.random().toString(16).slice(2, 6).toUpperCase();
      const inv = { email, nombre: nombre.trim(), llave: `${h()}-${h()}`, es_admin: esAdmin, creada_en: ahora(), activada_en: null };
      db.invitaciones.unshift(inv); guardar(); return copia(inv);
    },
    async eliminarInvitacion(email) { db.invitaciones = db.invitaciones.filter((i) => i.email !== email); guardar(); },
    async equiposTodos() { return copia(db.equipos); },
    async perfiles() { return [copia(db.perfil)]; },
  };
}

export function crearAdaptador() {
  if (modo() === 'demo') return adaptadorDemo();
  if (!window.supabase) throw new Error('No se pudo cargar el cliente de Supabase.');
  return adaptadorSupabase();
}
