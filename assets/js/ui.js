// Utilidades de interfaz: escape de texto, íconos, avisos y confirmaciones.

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Íconos de trazo (16px, 1.5) dibujados para esta app
const P = {
  resumen: '<path d="M3 13.5V8M8 13.5V3M13 13.5v-4"/>',
  partidos: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
  jugadores: '<circle cx="6" cy="5.5" r="2.25"/><path d="M2 13c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5"/><path d="M10.5 3.6a2.2 2.2 0 0 1 0 4M12 9.8c1 .5 1.7 1.6 2 3.2"/>',
  equipo: '<path d="M8 2 13 4v4c0 3-2.2 5-5 6-2.8-1-5-3-5-6V4z"/>',
  profesores: '<circle cx="5.5" cy="8" r="2.5"/><path d="M8 8h6M12 8v2.5M14 8v1.5"/>',
  salir: '<path d="M6 3H3.5v10H6M10.5 5l3 3-3 3M13.5 8H6.5"/>',
  mas: '<path d="M8 3v10M3 8h10"/>',
  menu: '<path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"/>',
  cerrar: '<path d="M4 4l8 8M12 4l-8 8"/>',
  editar: '<path d="M10.5 2.5l3 3L6 13H3v-3z"/>',
  borrar: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>',
  volver: '<path d="M10 3 5 8l5 5"/>',
  check: '<path d="M3.5 8.5l3 3 6-7"/>',
  copiar: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2"/>',
};
export const icon = (name) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

// Marca: un marcador de transmisión reducido (bloque rojo + bloque tinta)
export const marca = (cls = 'brand-mark') => `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="7" width="14" height="18" rx="3" fill="#c8102e"/><rect x="13" y="7" width="18" height="18" rx="3" fill="#16181d"/><rect x="13" y="7" width="4" height="18" fill="#16181d"/><path d="M5.5 12v5.2a2.5 2.5 0 0 0 5 0V12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M20 20l3.5-8L27 20" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const iniciales = (nombre) => (nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fechaCorta = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]}`; };
export const fechaLarga = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MESES[m - 1]} ${y}`; };
export const hoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

// Aviso flotante
let toastTimer;
export function aviso(msg, tipo = '') {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.className = 'toast ' + tipo; el.textContent = msg; el.removeAttribute('data-hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.setAttribute('data-hidden', ''), 3200);
}

// Confirmación que nombra el objeto y la consecuencia
export function confirmar({ titulo, texto, accion = 'Eliminar' }) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog'); d.className = 'confirm';
    d.innerHTML = `<h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="form-actions"><button class="btn" value="no">Cancelar</button><button class="btn danger" value="si">${esc(accion)}</button></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', (e) => { const v = e.target.closest('button')?.value; if (v) { d.close(v); } });
    d.addEventListener('close', () => { resolve(d.returnValue === 'si'); d.remove(); });
    d.showModal();
  });
}

// Botón ocupado mientras corre una acción
export async function ocupado(btn, fn) {
  const txt = btn.innerHTML; btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
  try { return await fn(); } finally { btn.removeAttribute('aria-busy'); btn.disabled = false; btn.innerHTML = txt; }
}

// Marcador tipo transmisión
export function bug(p, corto = 'UV') {
  const altoF = p.marcador_favor >= p.marcador_contra, altoC = p.marcador_contra >= p.marcador_favor;
  return `<span class="bug" aria-label="Univalle ${p.marcador_favor}, ${esc(p.rival)} ${p.marcador_contra}"><span class="bug-us">${esc(corto)}</span><span class="bug-score"><span class="${altoF ? '' : 'low'}">${p.marcador_favor}</span><i>–</i><span class="${altoC ? '' : 'low'}">${p.marcador_contra}</span></span><span class="bug-them">${esc(p.rival)}</span></span>`;
}
