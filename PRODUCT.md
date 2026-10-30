# Product

<!-- impeccable:product-schema 1 -->

> Inferred from Dash's written brief of 2026-10-30 (no interview round was held; the person was away and asked for a working build). Every line below comes from that brief unless marked *(inferido)*.

## Platform

web

## Stack

delegated: static HTML/CSS/JS (ES modules, no build step) so GitHub Pages serves the repo as-is; Supabase (Postgres + Auth + RLS) as backend through `@supabase/supabase-js` from a pinned CDN build. *(inferido: the brief fixes GitHub Pages and Supabase, not the frontend framework.)*

## Users

Profesores (entrenadores) de equipos deportivos asociados a la Universidad del Valle (Univalle), Cali. Cada profesor es dueño de uno o más equipos. Abren la herramienta después de cada partido para registrar datos, y de vez en cuando para revisar el rendimiento del equipo y de sus jugadores durante la temporada. *(inferido: uso en el celular al borde de la cancha o en el computador de la oficina; ambos deben funcionar.)*

Un administrador (coordinación deportiva) registra previamente a los profesores autorizados. *(inferido: el rol de administrador existe porque el brief exige registro previo.)*

## Product Purpose

Un Data Entry privado y rápido: el profesor registra su deporte, su equipo (tipo, categoría femenino/masculino), sus jugadores con su posición, y los datos de cada partido (rival, fecha, marcador, anotaciones, faltas, etc.). Con eso la plataforma presenta un tablero actualizado con métricas descriptivas y KPI propios de cada deporte, del equipo y de cada jugador, a lo largo de la temporada.

Éxito: registrar un partido completo toma pocos minutos y el tablero responde de inmediato "¿cómo va la temporada y quién está rindiendo?".

## Positioning

No es una planilla genérica: cada deporte trae su propio formulario y sus propios indicadores (goles a favor y en contra, máximo anotador y asistidor en fútbol; puntos, saques y eficacia en voleibol; tiros y porcentajes en baloncesto; lanzamientos y paradas en balonmano), cerrado a profesores autorizados de Univalle.

## Operating Context

- Deportes del MVP: baloncesto, voleibol, fútbol 11, fútbol sala, balonmano.
- Categorías: femenino, masculino.
- Acceso privado: solo profesores previamente registrados, que reciben una llave de acceso para activar su cuenta.
- Repositorio público `DataSport_Univalle` desplegado con GitHub Pages; los datos quedan privados por Auth + RLS de Supabase.

## Capabilities and Constraints

- Login y activación de cuenta con llave de acceso.
- CRUD de equipos, jugadores (dorsal, posición por deporte) y partidos con estadísticas por jugador.
- Tableros por deporte con KPI calculados desde los registros.
- El tiempo del profesor es el recurso escaso: la captura debe ser mínima en clics.
- Interfaz en español.

## Brand Commitments

- Nombre: DataSport Univalle.
- Institución: Universidad del Valle (Univalle). No se usa el escudo oficial sin autorización. *(inferido)*

## Evidence on Hand

No hay datos reales todavía. Cualquier dato de demostración es sintético y se marca como "Datos de ejemplo".

## Product Principles

1. Registrar un partido es más rápido que anotarlo en papel.
2. Cada número del tablero sale de los registros; nada se escribe a mano dos veces.
3. Cada deporte habla su propio idioma: sus posiciones, sus estadísticas, sus indicadores.
4. Los datos de un equipo solo los ve su profesor (y la coordinación).

## Accessibility & Inclusion

Contraste AA, objetivos táctiles de 44px en el celular, navegación por teclado. *(inferido)*
