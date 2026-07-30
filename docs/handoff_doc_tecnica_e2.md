# HANDOFF — doc_tecnica_e2.pdf · TorneoApp

Sos un asistente que va a generar el documento `doc_tecnica_e2.pdf` para el trabajo integrador de la
materia **Desarrollo de Aplicaciones Móviles · UTN FRLP · 2026**.

---

## Quiénes somos

**Integrantes:** Pedro Fiuza · Maximo Carpignano · Jesus Vergara

---

## Qué tenés que generar

Un documento técnico de E2 en el mismo estilo y nivel de detalle que el `doc_tecnica_e1.pdf`
(adjunto al final de este handoff como referencia), siguiendo exactamente lo que pide la guía
para la sección **5.3 Documentación Técnica E2**:

> - **Autenticación y autorización**: sistema de login elegido, roles, cómo se protegen las pantallas
> - **Integración con backend o servicios externos**: endpoints, Firebase, manejo de errores de red y retry
> - **Decisiones de refactoring**: qué cambió de E1, deuda técnica y plan para E3

**IMPORTANTE:** En E2 no hay backend real aún. El documento debe explicar honestamente las
decisiones tomadas y dejar documentada la deuda técnica con el plan concreto para E3.

---

## Referencia: lo que existía en E1 (doc_tecnica_e1)

- **Framework:** React Native + Expo SDK 52 · expo-router ~4.0.0 · react-native 0.76.x
- **Estado:** Context API + useReducer (`TorneoContext`) · torneo único hardcodeado en `constants/data.ts`
- **Persistencia:** AsyncStorage con clave `'torneoapp_partidos'`
- **Navegación:** Tabs nativas (Tabla / Fixture) + stack modal para cargar resultado

### Archivos E1
```
app/_layout.tsx             → Stack + TorneoProvider + PaperProvider
app/(tabs)/_layout.tsx      → Tabs nativas: Tabla + Fixture
app/(tabs)/index.tsx        → Tabla de posiciones
app/(tabs)/fixture.tsx      → Lista de partidos
app/fixture/[id].tsx        → Modal cargar resultado
context/TorneoContext.tsx   → Context + Reducer (torneo único)
utils/fixture.ts            → Algoritmo round-robin
utils/tabla.ts              → Cálculo de posiciones
constants/data.ts           → Equipos hardcodeados
```

---

## Lo que cambió en E2 (el código real)

### Stack actualizado (package.json real)

| Librería | Versión | Propósito |
|---|---|---|
| expo | ~54.0.0 | Framework base (actualizado desde SDK 52) |
| expo-router | ~5.1.0 | Navegación file-system (actualizado desde ~4.0.0) |
| react-native | 0.81.5 | Motor RN (actualizado desde 0.76.x) |
| react | 19.1.0 | Biblioteca base |
| @react-native-async-storage/async-storage | ^2.1.0 | Persistencia local |
| expo-font | ~14.0.0 | Carga de fuentes |
| expo-constants | ~18.0.0 | Variables de entorno |
| expo-linking | ~8.0.0 | Deep linking |
| expo-status-bar | ~3.0.9 | Barra de estado |
| @expo-google-fonts/inter | ^0.4.2 | Tipografía Inter |
| @expo/vector-icons | ^15.0.0 | Íconos |
| react-native-paper | ^5.15.2 | Componentes Material Design 3 |
| react-native-safe-area-context | ~5.1.0 | Safe area |
| react-native-screens | ~4.4.0 | Optimización de pantallas nativas |
| typescript | ~5.9.2 | Tipado estático |

> **Sin dependencias nuevas respecto a E1.** Toda la funcionalidad de E2 se implementó
> con las librerías ya existentes más las APIs nativas de React Native (`AppState`).

---

### Nueva estructura de archivos

```
app/_layout.tsx                              → Stack + AppProvider (reemplaza TorneoProvider)
app/index.tsx                                → Home: lista de torneos
app/torneo/crear.tsx                         → Crear / editar torneo (modal)
app/torneo/[torneoId]/index.tsx              → Detalle torneo con tabs internas
app/torneo/[torneoId]/equipo/[equipoId].tsx  → Plantel de equipo

context/AppContext.tsx       → Reemplaza TorneoContext; gestiona Torneo[]
hooks/useConexion.ts         → Estado de conexión via AppState de React Native
types/torneo.ts              → Tipos actualizados (Jugador, EquipoRef, Torneo, AppAction…)
constants/deportes.ts        → DEPORTES_CONFIG: titulares + maxSuplentes por deporte
utils/fixture.ts             → Mismo algoritmo; extrae EquipoRef de Equipo[]
utils/tabla.ts               → Ahora recibe EquipoRef[] en vez de Equipo[]
theme/colors.ts              → Paleta ampliada (primaryDark, enVivo*, warning*, danger)

components/EmptyState.tsx    → 3 variantes: torneos / equipos / fixture
components/FAB.tsx           → Botón flotante 52×52 color primaryDark
components/TabsInternos.tsx  → Switcher de tabs: Tabla / Fixture / Equipos
components/ConfirmDialog.tsx → Modal destructivo (Eliminar / Cancelar)
components/TorneoCard.tsx    → Tarjeta de torneo con emoji por deporte
components/EquipoRow.tsx     → Fila con menú ⋯ (ver jugadores / renombrar / eliminar)
components/JugadorRow.tsx    → Fila jugador con número y botón eliminar
components/ConexionBanner.tsx→ Banner EN VIVO / Reconectando / Sin conexión

[ELIMINADOS en E2]
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
app/(tabs)/fixture.tsx
app/fixture/[id].tsx
context/TorneoContext.tsx
constants/data.ts
```

---

### Decisiones técnicas clave de E2

#### 1. AppContext reemplaza TorneoContext

E1 manejaba un torneo único con datos hardcodeados en `constants/data.ts`.
E2 introduce `AppContext` con estado `torneos: Torneo[]`, CRUD completo vía `useReducer` con 14 tipos de acción.

La clave de AsyncStorage cambió de `'torneoapp_partidos'` a `'torneoapp_v2_torneos'` para evitar
colisiones con datos de E1 en dispositivos que ya tenían la app instalada.

Se agregaron dos hooks de consumo:
- `useApp()` — devuelve `{ state, dispatch }` (acceso global)
- `useTorneo(torneoId)` — devuelve `{ torneo, dispatch, conexion }` (acceso por torneo específico)

#### 2. Patrón EquipoRef

`Partido.local / visitante` y `FilaTabla.equipo` usan `EquipoRef = { id, nombre }` en lugar del
`Equipo` completo (que incluye la lista de jugadores).

Esto evita duplicar la lista de jugadores dentro de cada partido y cada fila de tabla.
`generarFixture(equipos: Equipo[])` extrae `{ id, nombre }` antes de construir los partidos.

#### 3. Navegación: tabs internas en lugar de Tabs nativas

E1 usaba `expo-router Tabs` (bottom bar nativo del SO).
E2 elimina las tabs nativas. La navegación dentro del detalle de torneo usa un **switcher
interno custom** (`TabsInternos`) que no genera rutas separadas en el Stack de Expo Router.

**Motivo:** Tabla / Fixture / Equipos son vistas del mismo torneo, no destinos de navegación
independientes. Usar tabs nativas obligaría a pasar el `torneoId` por parámetros en cada tab
o duplicar el contexto, complejizando innecesariamente la arquitectura.

#### 4. RF-08 EN VIVO — implementación sin backend

La guía pedía WebSocket + backend Go para tiempo real.
**Decisión tomada:** implementar el indicador visual (RF-08) usando `AppState` de React Native,
que dispara un ciclo "Reconectando… → EN VIVO" cuando la app vuelve al foreground.

- Sin paquetes externos adicionales
- El comportamiento visual cumple el criterio de aceptación de US-10 (indicador verde / amarillo)
- Documentado con `// TODO E3: reemplazar por WebSocket Go` en `hooks/useConexion.ts`
- En E3: `ws.onopen → 'en-vivo'`, `ws.onclose → 'reconectando'` + retry con backoff exponencial

#### 5. Autenticación — diferida a E3

E2 no implementa login ni roles. La guía (RF-09) y el backlog del alcance lo ubican en E3.
Toda la app opera en modo "organizador único local" sin credenciales.

Plan E3: Firebase Auth con roles `organizador` / `jugador`. Las rutas de escritura
(crear torneo, cargar resultado) quedarán protegidas por rol.

#### 6. Validaciones de plantel (nuevo en E2)

`constants/deportes.ts` define `titulares` y `maxSuplentes` por deporte:

| Deporte | Titulares | Máx. suplentes | Máx. jugadores/equipo |
|---|---|---|---|
| Fútbol 5 | 5 | 3 | 8 |
| Fútbol 9 | 9 | 3 | 12 |
| Pádel | 2 | 0 | 2 |
| Básquet | 5 | 3 | 8 |
| Otro | 5 | 3 | 8 |

- **RN-04:** FAB de agregar jugador se oculta cuando `jugadores.length >= maxJugadores`
- **RN-05:** banner amarillo cuando `jugadores.length < titulares` (plantel insuficiente para jugar)

---

### Diagrama de navegación E2

```
Stack raíz (expo-router v5)
│
├── /                            → Lista de torneos (AppProvider envuelve todo)
│     └── FAB ──────────────────→ /torneo/crear
│
├── /torneo/crear                → Modal: crear torneo o editar (params opcionales)
│
├── /torneo/[torneoId]           → Detalle de torneo
│     ├── ConexionBanner         → EN VIVO · Reconectando · Sin conexión
│     ├── TabsInternos ──────────────────────────────────────────────────
│     │     ├── Tabla    → FlatList de TablaRow (cabecera + leyenda)
│     │     ├── Fixture  → FlatList agrupada por jornada + ModalResultado (bottom-sheet)
│     │     └── Equipos  → FlatList de EquipoRow + FAB agregar equipo
│     └── Header: botón Editar (→ /torneo/crear) · botón Eliminar
│
└── /torneo/[torneoId]/equipo/[equipoId]   → Plantel del equipo
      ├── Contador X / MAX jugadores
      ├── Banner amarillo si plantel insuficiente (RN-05)
      ├── FlatList de JugadorRow
      └── FAB agregar jugador (oculto si plantel completo — RN-04)
```

#### Tabla de pantallas (actualizada desde E1)

| Pantalla | Ruta (Expo Router) | Descripción | Navegación |
|---|---|---|---|
| Lista de torneos | `/` | Pantalla de inicio. Lista de TorneoCard con FAB para crear. | Stack raíz. Pantalla de entrada. |
| Crear / Editar torneo | `/torneo/crear` | Formulario: nombre, formato fijo Liga, selector de deporte. Modo edición si recibe `torneoId` por params. | Modal desde home o desde header del detalle. |
| Detalle de torneo | `/torneo/[torneoId]` | ConexionBanner + TabsInternos. Contiene Tabla, Fixture y Equipos como vistas internas (sin rutas separadas). | Stack push desde TorneoCard. |
| Plantel de equipo | `/torneo/[torneoId]/equipo/[equipoId]` | Lista de jugadores con validaciones de mínimo y máximo. FAB para agregar. | Stack push desde EquipoRow → "Ver jugadores". |

---

### Deuda técnica identificada

| ID | Descripción | Plan E3 |
|---|---|---|
| DT-01 | No hay backend: toda la data es local en AsyncStorage | Conectar backend Go (API REST + WebSocket) |
| DT-02 | RF-08 EN VIVO es simulado con AppState, sin sync real entre usuarios | Reemplazar `useConexion` por estado del WebSocket Go |
| DT-03 | No hay autenticación ni roles (RF-09) | Firebase Auth o JWT propio; roles organizador / jugador |
| DT-04 | Un resultado cargado no se puede editar | Agregar edición con ConfirmDialog (recalcula tabla) |
| DT-05 | No hay validación de nombre duplicado en equipos dentro del mismo torneo | Check en reducer `AGREGAR_EQUIPO` / `EDITAR_EQUIPO` |
| DT-06 | Escudo de equipo no implementado | Upload de imagen en E3 con validación de formato y tamaño |
| DT-07 | No hay estadísticas individuales de jugadores (goles por partido) | RF-11 en E3 junto con el backend |

---

## Formato y estilo esperado

- Mismo tono que `doc_tecnica_e1.pdf`: técnico, claro, en español rioplatense
- Extensión recomendada: 3-4 páginas
- Estructura sugerida:
  1. Cambios en el stack tecnológico (tabla de dependencias actualizada)
  2. Autenticación y autorización (diferida a E3 — explicar por qué y el plan)
  3. Integración con backend / persistencia (AsyncStorage, sin backend, estrategia de retry pendiente)
  4. Decisiones de refactoring (qué cambió de E1 y por qué: AppContext, EquipoRef, navegación)
  5. Deuda técnica y plan E3 (tabla)
  6. Diagrama de navegación actualizado
- Generar en Markdown prolijo para exportar a PDF
- Mantener encabezado idéntico al de E1: **TorneoApp · Documentación Técnica — Entrega 2 · DAM 2026 · UTN FRLP · Pedro Fiuza · Maximo Carpignano · Jesus Vergara**
