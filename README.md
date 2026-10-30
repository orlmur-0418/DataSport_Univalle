# DataSport Univalle

Plataforma web privada para que cada profesor de un equipo Univalle registre su equipo, sus jugadores y cada partido, y vea un tablero de la temporada con indicadores propios de su deporte.

- **Deportes (MVP):** baloncesto, voleibol, fútbol 11, fútbol sala y balonmano, en categoría femenina o masculina.
- **Acceso:** solo profesores registrados por la coordinación. Cada uno activa su cuenta con una **llave de acceso**.
- **Web:** HTML, CSS y JavaScript sin paso de compilación, publicada con GitHub Pages.
- **Backend:** Supabase (Postgres, Auth y seguridad por filas).
- **Demostración:** `…/DataSport_Univalle/?demo` abre la plataforma con datos de ejemplo guardados solo en el navegador.

## Puesta en marcha (una sola vez)

### 1. Crear las tablas en Supabase

1. Abre el proyecto en [supabase.com](https://supabase.com/dashboard/project/wlmdkhpttjxolhhvkpyu) → **SQL Editor** → **New query**.
2. Pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**. Se puede volver a ejecutar sin perder datos.

### 2. Registrarte como coordinación

En el mismo SQL Editor, cambia el correo y el nombre y ejecuta:

```sql
insert into public.invitaciones (email, nombre, es_admin)
values ('tu-correo@correounivalle.edu.co', 'Tu nombre', true)
returning llave;
```

Guarda la llave que aparece (formato `XXXX-XXXX`).

### 3. Ajustar la autenticación

En **Authentication → Sign In / Providers → Email**:

- Deja activo **Allow new users to sign up** (el registro está protegido: sin invitación y llave correctas, la base de datos lo rechaza).
- Opcional: desactiva **Confirm email** para que el profesor entre apenas activa su cuenta. Si lo dejas activo, recibirá un correo de confirmación.

En **Authentication → URL Configuration**:

- **Site URL:** `https://orlmur-0418.github.io/DataSport_Univalle/`
- **Redirect URLs:** agrega la misma dirección (sirve para confirmar el correo y recuperar la contraseña).

### 4. Entrar

Abre la web, elige **Tengo una llave de acceso**, escribe tu correo, la llave y una contraseña. Desde **Profesores** registras a los demás profesores: la app genera su llave y tú se la entregas.

## Cómo se usa

1. **Equipo:** nombre, deporte, categoría y temporada. Un profesor puede tener varios equipos.
2. **Jugadores:** nombre, dorsal y posición (las posiciones cambian según el deporte). Dar de baja conserva el historial.
3. **Registrar partido:** fecha, rival, condición, marcador (en voleibol, los puntos de cada set) y una planilla por jugador. Lo vacío cuenta como cero; Enter baja a la siguiente fila; la línea de cuadre avisa si los goles o puntos de los jugadores no coinciden con el marcador.
4. **Resumen:** tira de marcadores de la temporada, indicadores del deporte, gráfico a favor/en contra, líderes y tabla por jugador ordenable.

### Indicadores por deporte

| Deporte | Indicadores principales |
| --- | --- |
| Fútbol 11 y sala | Puntos y % de puntos, goles a favor y en contra (total y por partido), diferencia, vallas invictas, efectividad de remate, remates al arco, faltas por partido, tarjetas; máximo goleador, asistidor, G+A y atajadas |
| Baloncesto | % de victorias, puntos a favor y en contra por partido, diferencial, % tiros de campo, triples y tiros libres, rebotes, asistencias, pérdidas, asistencias por pérdida; máximo anotador, reboteador, asistidor y valoración |
| Voleibol | % de victorias, sets ganados y perdidos, relación de sets, puntos por set, acierto de ataque, balance de saque, bloqueos por set, recepción sin error, defensas; máximo anotador, sacador, bloqueador y defensor |
| Balonmano | Puntos (2/1/0), goles a favor y en contra por partido, eficacia de lanzamiento, % de paradas, exclusiones, robos y pérdidas; máximo goleador, asistidor, paradas y robos |

El catálogo de estadísticas y los cálculos están en [`assets/js/sports.js`](assets/js/sports.js).

## Seguridad

- La **publishable key** de [`assets/js/config.js`](assets/js/config.js) es pública por diseño. Lo que protege los datos son las políticas RLS de `supabase/schema.sql`: cada profesor solo ve y edita sus equipos; la coordinación ve todo y registra profesores; sin sesión no se lee nada.
- **Nunca** pongas la secret key (`sb_secret_…`) en este repositorio ni en la web.

## Estructura

```
index.html                 entrada de la app
assets/css/app.css         estilos (tokens, componentes)
assets/js/main.js          arranque, sesión, menú y rutas
assets/js/login.js         ingreso, activación con llave, nueva contraseña
assets/js/views.js         pantallas: resumen, partidos, planilla, jugadores, equipo, profesores
assets/js/sports.js        deportes, posiciones, métricas e indicadores
assets/js/data.js          acceso a Supabase y modo demostración
assets/js/demo-data.js     datos de ejemplo (sintéticos)
assets/js/charts.js        gráficos SVG (de Taste)
assets/vendor/             cliente de Supabase 2.117.3
supabase/schema.sql        tablas, funciones, disparadores y políticas RLS
PRODUCT.md, DESIGN.md      contexto de producto y sistema visual (Impeccable)
```

## Diseño

La interfaz sigue a [Impeccable](https://github.com/pbakaus/impeccable) (instalado en `.claude/skills/impeccable`) y [Taste](https://www.tasteskill.dev/) (`npx skills add Leonxlnx/taste-skill`). El MCP de Supabase para Claude Code está en `.mcp.json`.
