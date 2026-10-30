---
name: DataSport Univalle
description: Data entry y tablero de temporada para profesores de equipos Univalle
colors:
  univalle-red: "#c8102e"
  red-soft: "#fdf1f2"
  red-track: "#f8d7dc"
  red-ink: "#7a0a1c"
  bug-ink: "#16181d"
  ground: "#fbf8f8"
  surface: "#ffffff"
  raised: "#f5f1f1"
  border: "#ebe5e5"
  rule: "#f3eeee"
  control: "#d3cbcb"
  text: "#16181d"
  muted: "#5d6068"
  chart-muted: "#c9c3c4"
  negative: "#b42318"
  positive: "#247b50"
typography:
  title:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  section:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  kpi:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  small:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "12px"
  score:
    fontFamily: "Barlow Condensed, DM Sans, sans-serif"
    fontSize: "28px"
    fontWeight: 600
rounded:
  chip: "4px"
  control: "6px"
  card: "8px"
spacing:
  gap: "24px"
  card-pad: "20px"
  canvas: "32px"
---

# Design System: DataSport Univalle

## Overview

Herramienta de trabajo (modo Operate): el profesor registra un partido en minutos y lee cómo va la temporada. El mundo visual viene de los gráficos de transmisión deportiva y se limita a cuatro aportes: tipo, paleta, densidad y un gesto propio, **el marcador de transmisión** (bloque rojo "UV", bloque tinta con cifras condensadas, rival en blanco). La temporada se lee como una tira de esos marcadores. Todo lo demás son controles estándar de la web.

Estilo de pantalla de app: "accent ladder" de Taste, con el rojo Univalle en lugar del tono repartido.

## Colors

### Primary
- **Rojo Univalle** `#c8102e`: solo en marcas pequeñas (acción principal, serie de datos principal, ícono del menú activo, ficha "V", dorsales, lado "UV" del marcador).
- Tintes `#fdf1f2` / `#f8d7dc` con tinta `#7a0a1c`: fila activa del menú, selección, foco de celdas.

### Neutral
- Fondo `#fbf8f8` (un paso hacia el tinte del rojo), superficies `#ffffff`, bordes `#ebe5e5`, reglas `#f3eeee`.
- Texto `#16181d`, secundario `#5d6068` (≥4.5:1).
- Tinta del marcador `#16181d`.

### Named Rules
- **El rojo es nuestro, no una alarma.** Victoria = ficha roja; derrota = ficha con borde gris. El color negativo `#b42318` se reserva para errores y acciones destructivas.
- **Color en los datos, no en el cromo.** Presupuesto de color 3–10 %, casi todo en tintes.

## Typography

DM Sans para toda la interfaz (400/500/600/700, autoalojada). Barlow Condensed 600 con un solo trabajo: cifras de marcador y dorsales. Cifras tabulares en tablas, KPI y todo lo que se actualiza.

### Hierarchy
Título 28/700 · sección 18/600 · KPI 24/500 · cuerpo 14/20 · meta 12. Sin mayúsculas sostenidas, sin etiquetas sobre los títulos.

## Layout

Plano abierto: menú lateral de 240 px sobre el fondo, sin barra superior en escritorio; lienzo fluido hasta 1320 px con un solo valor de separación (24 px). En el celular el menú se pliega a una barra de 52 px con el nombre del equipo y "+ Partido". Tablero: título con hallazgo → tira de temporada → franja de 6 KPI → gráfico (8 columnas) + líderes (4) → tabla por jugador (12).

## Elevation & Depth

Plano. Separación por borde de 1 px o un paso de tono. Sombras solo en lo que flota: aviso (toast) y diálogo de confirmación.

## Shapes

Radio cerrado: 4 px fichas y marcador, 6 px controles, 8 px tarjetas.

## Components

- **Marcador (`.bug`)**: `UV` en rojo · cifras en tinta (la cifra perdedora atenuada) · rival en blanco con borde.
- **Tira de temporada (`.strip`)**: un contenedor dividido; cada celda = fecha, ficha V/E/D, marcador condensado de 28 px, rival.
- **KPI**: un contenedor dividido por líneas de 1 px; etiqueta gris encima, valor 24/500, sublínea con su base ("de 27 posibles").
- **Planilla**: tabla con primera columna fija (casilla "Jugó", dorsal, nombre, posición) y celdas numéricas de 52 px; Enter baja a la siguiente fila; fila de totales y línea de cuadre contra el marcador.
- **Botones**: acción principal en rojo, secundaria blanca con borde, peligro en texto negativo. Una sola acción llena por pantalla.
- **Estados vacíos**: conservan el marco y dicen el siguiente paso en una frase.
