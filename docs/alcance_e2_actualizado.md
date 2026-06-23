# Alcance — Entrega 2 (actualizado)

**Proyecto:** TorneoApp  
**Entrega:** 2 — Expansión horizontal  
**Fecha de actualización:** 2026-06-23  
**Equipo:** Pedro Fiuza + integrantes

---

## 1. Objetivo de la entrega

Extender el MVP de E1 (fixture round-robin para un torneo único) hacia una app multi-torneo con gestión completa de equipos, plantel de jugadores e indicador de estado en tiempo real.

---

## 2. Funcionalidades incluidas

### RF-01 — Lista de torneos
El usuario puede ver todos los torneos creados en una pantalla principal con tarjetas que muestran nombre, deporte y progreso de partidos.

### RF-02 — Crear torneo
El usuario puede crear un torneo con:
- **Nombre** (texto libre, máx. 60 caracteres)
- **Formato:** fijo en *Liga* para E2. En E3 se podrá seleccionar entre distintos formatos (eliminación directa, grupos + playoffs, etc.)
- **Deporte:** Fútbol 5, Fútbol 9, Pádel, Básquet, Otro

### RF-03 — Editar y eliminar torneo
- Editar: mismo formulario de creación con datos precargados.
- Eliminar: confirmación con diálogo destructivo; elimina en cascada equipos, partidos y resultados.

### RF-04 — Gestionar plantel de equipo
El usuario puede agregar y eliminar jugadores de un equipo.  
- Límite máximo y mínimo determinado por el deporte (ver RN-04 y RN-05).
- **Sin carga de goles por jugador en E2** — las estadísticas individuales (quién metió cada gol) se incorporan en E3.

### RF-05 — Generar fixture
Igual a E1: algoritmo round-robin para los equipos del torneo.  
Solo disponible cuando el torneo tiene al menos 2 equipos y el fixture no fue generado aún.

### RF-06 — Cargar resultados de partidos
El usuario puede ingresar el resultado (goles local — goles visitante) de cada partido. La tabla de posiciones se recalcula automáticamente.

### RF-07 — Tabla de posiciones
Tabla ordenada por puntos → diferencia de gol → goles a favor.  
Incluye todos los equipos desde el inicio, incluso los que no jugaron (aparecen en cero).

### RF-08 — Indicador EN VIVO (estado de conexión)
Banner en la pantalla de detalle de torneo que muestra:
- **EN VIVO** (verde con punto pulsante): conexión activa
- **Reconectando…** (amarillo): la app volvió al foreground y está reconectando
- **Sin conexión** (rojo): sin acceso a datos en tiempo real

*Implementación E2:* usa `AppState` de React Native para simular la reconexión al volver al foreground (sin backend real).  
*TODO E3:* reemplazar por estado del WebSocket conectado al backend Go.

---

## 3. Reglas de negocio

| ID    | Descripción |
|-------|-------------|
| RN-01 | El nombre del torneo no puede estar vacío. |
| RN-02 | Un torneo requiere al menos 2 equipos para generar el fixture. |
| RN-03 | No se pueden agregar ni eliminar equipos una vez generado el fixture. |
| RN-04 | El plantel de un equipo no puede superar el máximo de jugadores definido por deporte (titulares + suplentes). |
| RN-05 | Se muestra aviso cuando el plantel tiene menos jugadores que el mínimo requerido (titulares). |
| RN-06 | Eliminar un torneo elimina en cascada todos sus equipos, partidos y resultados. |
| RN-07 | El formato del torneo es fijo en *Liga* para E2. |
| RN-08 | El máximo de suplentes es 3 para todos los deportes. |

---

## 4. Configuración de deportes

| Deporte    | Titulares | Máx. suplentes | Máx. jugadores/equipo |
|------------|-----------|---------------|----------------------|
| Fútbol 5   | 5         | 3             | 8                    |
| Fútbol 9   | 9         | 3             | 12                   |
| Pádel      | 2         | 0             | 2                    |
| Básquet    | 5         | 3             | 8                    |
| Otro       | 5         | 3             | 8                    |

---

## 5. Pantallas implementadas

| Pantalla | Ruta Expo Router | Descripción |
|----------|-----------------|-------------|
| Home | `/` | Lista de torneos con TorneoCard. FAB para crear. |
| Crear/Editar torneo | `/torneo/crear` | Formulario con nombre, formato fijo y selector de deporte. |
| Detalle de torneo | `/torneo/[torneoId]` | ConexionBanner + TabsInternos (Tabla / Fixture / Equipos). |
| Plantel de equipo | `/torneo/[torneoId]/equipo/[equipoId]` | Lista de jugadores, contador, banners de aviso/completo. |

---

## 6. Correcciones al diseño Figma (aplicadas)

### Corrección 1 — Escudo de equipo
Para E2 el tab de Equipos es una **list view con nombre** únicamente (sin grid y sin escudo).  
En E3 se agregará un campo opcional de imagen de escudo (upload con validación de formato y tamaño mínimo/máximo).

### Corrección 2 — Formato y deportes
- **Formato:** selector presente en el formulario pero con valor fijo *Liga*; nota visual "Otros formatos disponibles en E3".
- **Deportes:** se agrega *Fútbol 9* a la lista. El máximo de suplentes queda en 3 para todos los deportes.

### Corrección 3 — Jugadores sin estadísticas individuales
En E2 se implementa **agregar y eliminar jugadores** del plantel.  
Los goles por jugador (quién metió cada gol) se implementan en **E3**, junto con las estadísticas individuales.  
Se agregan dos escenarios de validación:
- **Plantel insuficiente:** aviso cuando hay menos titulares del mínimo (RN-05).
- **Plantel completo:** FAB oculto y banner cuando se alcanza el máximo (RN-04).

---

## 7. Decisiones técnicas relevantes

- **`EquipoRef`:** los partidos y la tabla almacenan solo `{ id, nombre }` del equipo, no la lista completa de jugadores, para evitar duplicación de datos.
- **`AppContext`:** reemplaza el `TorneoContext` de E1; gestiona `Torneo[]` en lugar de un torneo único. Clave de AsyncStorage: `torneoapp_v2_torneos` (distinta a E1 para evitar conflictos).
- **`useConexion`:** hook basado en `AppState` de React Native (sin paquetes externos) que simula la reconexión al volver al foreground.
- **Navegación:** Stack de Expo Router en la raíz + switcher interno (`TabsInternos`) en la pantalla de detalle. No se usan tabs nativas de Expo Router para el detalle del torneo.

---

## 8. Fuera de alcance para E2 (pendiente E3)

- Selección libre de formato de torneo
- Escudo de equipo (imagen uploadable)
- Estadísticas individuales de jugadores (goles por partido)
- Backend Go + WebSocket para tiempo real
- Autenticación y múltiples usuarios
- Grupos + playoffs / eliminación directa
