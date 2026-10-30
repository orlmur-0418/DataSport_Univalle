// Ingreso, activación con llave de acceso y cambio de contraseña
import { esc, marca, aviso } from './ui.js';
import { entrarDemo, mensajeError } from './data.js';

const lado = `
  <aside class="auth-side" aria-hidden="true">
    <h2>Registra cada partido en minutos y mira cómo rinde tu equipo durante la temporada.</h2>
    <div class="preview">
      <div class="row"><span class="res V">V</span><span class="bug"><span class="bug-us">UV</span><span class="bug-score"><span>3</span><i>–</i><span class="low">1</span></span><span class="bug-them">Santiago de Cali</span></span><span class="when">12 sep</span></div>
      <div class="row"><span class="res E">E</span><span class="bug"><span class="bug-us">UV</span><span class="bug-score"><span>2</span><i>–</i><span>2</span></span><span class="bug-them">ICESI</span></span><span class="when">5 sep</span></div>
      <div class="row"><span class="res D">D</span><span class="bug"><span class="bug-us">UV</span><span class="bug-score"><span class="low">1</span><i>–</i><span>2</span></span><span class="bug-them">Javeriana Cali</span></span><span class="when">29 ago</span></div>
    </div>
    <div class="sports"><span>Baloncesto</span><span>Voleibol</span><span>Fútbol 11</span><span>Fútbol sala</span><span>Balonmano</span></div>
  </aside>`;

export function vistaLogin(app, ctx, alEntrar) {
  document.title = 'Ingresar · DataSport Univalle';
  let pestana = 'ingresar';
  const pintar = () => {
    app.innerHTML = `
    <div class="auth">
      <section class="auth-form">
        <div class="inner">
          <div class="brand">${marca()}<span class="brand-name">DataSport<span>Univalle</span></span></div>
          <h1>${pestana === 'activar' ? 'Activa tu cuenta' : pestana === 'recuperar' ? 'Recupera tu contraseña' : 'Ingresa a tu equipo'}</h1>
          <p class="lead">${pestana === 'activar' ? 'Usa el correo con el que te registró la coordinación y tu llave de acceso.' : pestana === 'recuperar' ? 'Te enviaremos un enlace para crear una contraseña nueva.' : 'Plataforma privada para profesores de equipos Univalle.'}</p>
          ${pestana !== 'recuperar' ? `<div class="segmented" role="group" aria-label="Tipo de acceso">
            <button type="button" data-tab="ingresar" aria-pressed="${pestana === 'ingresar'}">Ya tengo cuenta</button>
            <button type="button" data-tab="activar" aria-pressed="${pestana === 'activar'}">Tengo una llave de acceso</button>
          </div>` : '<div style="height:24px"></div>'}
          <form novalidate>
            <div class="field"><label for="f-email">Correo</label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required placeholder="nombre@correounivalle.edu.co"></div>
            ${pestana === 'activar' ? `<div class="field"><label for="f-llave">Llave de acceso</label><input class="input" id="f-llave" name="llave" required autocomplete="off" placeholder="XXXX-XXXX" style="text-transform:uppercase;letter-spacing:.06em"></div>` : ''}
            ${pestana !== 'recuperar' ? `<div class="field"><label for="f-pass">${pestana === 'activar' ? 'Crea una contraseña' : 'Contraseña'}</label><input class="input" id="f-pass" name="password" type="password" minlength="8" required autocomplete="${pestana === 'activar' ? 'new-password' : 'current-password'}">${pestana === 'activar' ? '<span class="hint">Mínimo 8 caracteres.</span>' : ''}</div>` : ''}
            <p class="form-msg" role="alert"></p>
            <button class="btn primary block" type="submit">${pestana === 'activar' ? 'Activar cuenta' : pestana === 'recuperar' ? 'Enviar enlace' : 'Ingresar'}</button>
          </form>
          <div class="auth-foot">
            ${pestana === 'ingresar' ? `<p><button class="link-btn" data-tab="recuperar">¿Olvidaste tu contraseña?</button></p>` : ''}
            ${pestana === 'recuperar' ? `<p><button class="link-btn" data-tab="ingresar">Volver a ingresar</button></p>` : ''}
            <p style="margin-top:12px">¿Aún no tienes llave? Pídela a la coordinación deportiva de Univalle. Solo los profesores registrados pueden entrar.</p>
            <p style="margin-top:12px"><button class="link-btn" data-demo>Explorar con datos de ejemplo</button></p>
          </div>
        </div>
      </section>
      ${lado}
    </div>`;
    app.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { pestana = b.dataset.tab; pintar(); }));
    app.querySelector('[data-demo]').onclick = () => { entrarDemo(); alEntrar(); };
    const form = app.querySelector('form'), msg = form.querySelector('.form-msg'), btn = form.querySelector('button[type=submit]');
    form.onsubmit = async (e) => {
      e.preventDefault();
      msg.className = 'form-msg'; msg.textContent = '';
      const f = Object.fromEntries(new FormData(form));
      if (!/^\S+@\S+\.\S+$/.test(f.email || '')) { msg.textContent = 'Escribe un correo válido.'; form.email.focus(); return; }
      if (pestana === 'activar' && !(f.llave || '').trim()) { msg.textContent = 'Escribe tu llave de acceso.'; form.llave.focus(); return; }
      if (pestana !== 'recuperar' && (f.password || '').length < 8) { msg.textContent = 'La contraseña debe tener al menos 8 caracteres.'; form.password.focus(); return; }
      btn.disabled = true; btn.setAttribute('aria-busy', 'true');
      try {
        if (pestana === 'ingresar') { await ctx.api.ingresar(f.email, f.password); alEntrar(); }
        else if (pestana === 'activar') {
          const r = await ctx.api.activar(f.email, f.llave, f.password);
          if (r?.session) alEntrar();
          else { msg.className = 'form-msg ok'; msg.textContent = 'Cuenta creada. Te enviamos un correo para confirmarla; después ingresa con tu contraseña.'; }
        } else {
          await ctx.api.recuperar(f.email);
          msg.className = 'form-msg ok'; msg.textContent = 'Si el correo está registrado, recibirás un enlace en unos minutos.';
        }
      } catch (err) { msg.textContent = mensajeError(err); }
      finally { btn.disabled = false; btn.removeAttribute('aria-busy'); }
    };
  };
  pintar();
}

export function vistaNuevaClave(app, ctx) {
  document.title = 'Nueva contraseña · DataSport Univalle';
  app.innerHTML = `
  <div class="auth"><section class="auth-form"><div class="inner">
    <div class="brand">${marca()}<span class="brand-name">DataSport<span>Univalle</span></span></div>
    <h1>Crea una contraseña nueva</h1>
    <p class="lead">Úsala desde ahora para ingresar.</p>
    <form novalidate style="margin-top:24px">
      <div class="field"><label for="f-pass">Contraseña nueva</label><input class="input" id="f-pass" name="password" type="password" minlength="8" autocomplete="new-password" required><span class="hint">Mínimo 8 caracteres.</span></div>
      <p class="form-msg" role="alert"></p>
      <button class="btn primary block" type="submit">Guardar contraseña</button>
    </form>
  </div></section>${lado}</div>`;
  const form = app.querySelector('form'), msg = form.querySelector('.form-msg');
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (form.password.value.length < 8) { msg.textContent = 'La contraseña debe tener al menos 8 caracteres.'; return; }
    try { await ctx.api.nuevaClave(form.password.value); aviso('Contraseña actualizada'); location.hash = '#/resumen'; location.reload(); }
    catch (err) { msg.textContent = mensajeError(err); }
  };
}
