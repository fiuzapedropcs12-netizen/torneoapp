# Changelog

## Entrega 3 — Backend real, autenticación y expansión vertical

### Agregado
- Backend: API REST en Node + Express + TypeScript.
- Persistencia real en PostgreSQL vía Prisma ORM (reemplaza `AsyncStorage`).
- Autenticación con JWT + bcrypt. Roles `ORGANIZADOR` y `JUGADOR`.
- Entidad **Club** (expansión vertical): agrupa varios torneos bajo una misma
  organización. Un usuario organizador puede tener varios clubes.
- Pantallas nuevas: login, registro, listado de clubes, detalle de club.
- Endpoint de edición de torneo y de equipo (antes solo se podían crear).

### Cambiado
- La app móvil dejó de usar `AppContext` + `AsyncStorage` como fuente de
  verdad; ahora todos los datos viven en el backend y se consumen vía
  `lib/api.ts` a través de los hooks en `hooks/useTorneoApi.ts`.
- Navegación: `Clubes` (home) → `Torneos` (dentro de un club) →
  `Tabla/Fixture/Equipos` → `Plantel` (las últimas dos pantallas se
  mantienen igual que en E2).

### Resuelto (deuda técnica de E2)
- **DT-04**: un resultado cargado ahora se puede editar (antes era fijo).
- **DT-05**: se rechaza crear/renombrar un equipo con nombre duplicado
  dentro del mismo torneo.
- El límite de jugadores por equipo según el deporte ahora se valida también
  en el backend (antes solo en el cliente).

### Pendiente / diferido
- WebSocket real para el indicador "EN VIVO" (sigue simulado con `AppState`).
- Upload de escudo de equipo (DT-06 de E2).
- Estadísticas individuales de jugadores (RF-11).
- Refresh tokens (el JWT actual expira a los 7 días y hay que loguearse de nuevo).

## Entrega 2 — Escalado funcional

### Agregado
- Gestión de múltiples torneos (antes E1 tenía un único torneo hardcodeado).
- Gestión de equipos y planteles de jugadores por torneo.
- Validaciones de plantel por deporte (mínimo de titulares, máximo de
  suplentes) — Fútbol 5, Fútbol 9, Pádel, Básquet.
- Indicador "EN VIVO / Reconectando" simulado con `AppState` de React Native
  (sin backend real todavía).

### Cambiado
- `TorneoContext` reemplazado por `AppContext`, con `torneos: Torneo[]` y
  CRUD completo vía `useReducer`.
- Navegación: tabs nativas de Expo Router reemplazadas por un switcher
  interno (`TabsInternos`) dentro del detalle de cada torneo.
- Clave de `AsyncStorage` cambiada de `torneoapp_partidos` a
  `torneoapp_v2_torneos` para no chocar con datos de E1.

### Diferido
- Autenticación y roles (quedó explícitamente para E3).
- Backend real (seguía siendo 100% AsyncStorage).

## Entrega 1 — MVP básico

### Agregado
- Tabla de posiciones con PJ, PG, PE, PP, diferencia de gol y puntos.
- Fixture generado automáticamente (algoritmo round-robin) para un torneo
  fijo de 6 equipos hardcodeados.
- Modal de carga de resultado con validación de campos vacíos.
- Persistencia local en `AsyncStorage`.
- Stack: Expo SDK 54 (downgrade desde SDK 56 por compatibilidad con Expo Go
  en iOS) + expo-router + TypeScript + Context API/useReducer +
  react-native-paper.
