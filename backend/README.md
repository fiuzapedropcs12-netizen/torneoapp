# TorneoApp API — Entrega 3

Backend REST para TorneoApp. Reemplaza el `AsyncStorage` local de E1/E2 por
persistencia real en PostgreSQL, agrega autenticación con roles
(`ORGANIZADOR` / `JUGADOR`) y la entidad **Club**, que agrupa varios
Torneos (expansión vertical del dominio pedida en E3).

## Stack

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT (jsonwebtoken) + bcryptjs para auth
- Zod para validación de entrada

## Modelo de datos

```
User (organizador o jugador)
  └─ Club (1 organizador es owner de N clubes)      ← expansión vertical
        └─ Torneo (N torneos por club)
              ├─ Equipo (N equipos por torneo)
              │     └─ Jugador (N jugadores por equipo)
              └─ Partido (fixture generado, local/visitante son Equipo)
```

## Cómo correr en desarrollo

1. Instalar dependencias:
   ```
   npm install
   ```
2. Levantar Postgres local (o usar uno gestionado — ver `.env.example`):
   ```
   docker run --name torneoapp-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=torneoapp -p 5432:5432 -d postgres:16
   ```
3. Copiar `.env.example` a `.env` y ajustar `DATABASE_URL` / `JWT_SECRET`.
4. Generar el cliente de Prisma y correr las migraciones:
   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. (Opcional) Cargar datos de ejemplo:
   ```
   npm run seed
   ```
   Crea dos usuarios: `organizador@torneoapp.com` / `torneo123` (rol organizador)
   y `jugador@torneoapp.com` / `torneo123` (rol jugador), con un club y torneo
   de ejemplo ya cargados.
6. Levantar el servidor:
   ```
   npm run dev
   ```
   Corre en `http://localhost:3000`. `GET /health` para verificar que está vivo.

## Deploy (para la entrega final)

Cualquier PaaS con soporte Node + Postgres sirve. Opciones gratuitas simples:
- **Base de datos**: Neon o Supabase (Postgres gestionado, free tier).
- **API**: Render o Railway (deploy desde el repo de GitHub, variable de entorno `DATABASE_URL` apuntando al Postgres gestionado).

Pasos generales:
1. Crear la base en Neon/Supabase y copiar el connection string a `DATABASE_URL`.
2. `npx prisma migrate deploy` contra esa base (una vez, desde tu máquina o como build step).
3. Deployar el servicio Node (`npm run build && npm start`) en Render/Railway con las variables de entorno `DATABASE_URL`, `JWT_SECRET` y `PORT`.
4. Actualizar la URL base de la API en la app móvil (`.env` de Expo, ver README del cliente).

## Endpoints

| Método | Ruta                                | Auth              | Descripción |
|--------|--------------------------------------|-------------------|-------------|
| POST   | `/auth/register`                     | —                 | Crea usuario (organizador o jugador) |
| POST   | `/auth/login`                        | —                 | Devuelve JWT |
| GET    | `/clubes`                            | JWT               | Lista todos los clubes |
| POST   | `/clubes`                            | JWT + organizador | Crea un club (el usuario queda como owner) |
| GET    | `/clubes/:clubId`                    | JWT               | Detalle de club con sus torneos |
| PUT    | `/clubes/:clubId`                    | JWT + owner       | Edita un club |
| DELETE | `/clubes/:clubId`                    | JWT + owner       | Elimina un club (cascada) |
| POST   | `/torneos`                           | JWT + owner       | Crea torneo dentro de un club |
| GET    | `/torneos/:torneoId`                 | JWT               | Detalle con equipos, partidos y tabla calculada |
| DELETE | `/torneos/:torneoId`                 | JWT + owner       | Elimina torneo |
| POST   | `/torneos/:torneoId/fixture`         | JWT + owner       | Genera el fixture round-robin |
| POST   | `/equipos`                           | JWT + owner       | Crea equipo (rechaza nombre duplicado) |
| GET    | `/equipos/:equipoId`                 | JWT               | Detalle con jugadores y límites del deporte |
| DELETE | `/equipos/:equipoId`                 | JWT + owner       | Elimina equipo |
| POST   | `/equipos/:equipoId/jugadores`       | JWT + owner       | Agrega jugador (rechaza si supera el máximo) |
| DELETE | `/equipos/jugadores/:jugadorId`      | JWT + owner       | Elimina jugador |
| PUT    | `/partidos/:partidoId/resultado`     | JWT + owner       | Carga o edita el resultado de un partido |

"JWT + owner" significa: requiere rol `ORGANIZADOR` y ser el dueño del club
al que pertenece el recurso. Las lecturas (`GET`) están abiertas a cualquier
usuario autenticado, organizador o jugador — el rol jugador es de solo lectura.

## Reglas de negocio implementadas

- Un equipo no puede superar el máximo de jugadores de su deporte (RN-04, heredado de E2).
- No se pueden crear dos equipos con el mismo nombre en un torneo (resuelve DT-05 de E2).
- El resultado de un partido se puede cargar **y editar** después (resuelve DT-04 de E2).
- El fixture no se puede regenerar una vez creado (evita duplicar partidos).

## Deuda técnica pendiente / fuera de alcance de E3

- Sin refresh tokens: el JWT expira a los 7 días y hay que loguearse de nuevo.
- Sin WebSocket para "EN VIVO" en tiempo real entre usuarios (sigue siendo un TODO documentado desde E2).
- Sin upload de imágenes (escudo de equipo, DT-06 de E2 sigue pendiente).
