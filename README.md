# TorneoApp

Aplicación móvil para gestionar torneos deportivos amateur — tabla de posiciones,
fixture automático (round-robin), carga de resultados y planteles de equipos.

Trabajo integrador — Desarrollo de Aplicaciones Móviles · UTN FRLP · 2026
Integrantes: Pedro Fiuza · Maximo Carpignano · Jesus Vergara

## Estado del proyecto (Entrega 3)

- Backend real (Node + Express + Prisma + PostgreSQL), reemplaza el almacenamiento
  local de E1/E2.
- Autenticación con roles: **organizador** (gestiona) y **jugador** (solo lectura).
- Expansión vertical del dominio: un **Club** agrupa varios **Torneos** (antes,
  en E2, el torneo era la entidad de nivel más alto).
- Reglas de negocio: fixture round-robin, cálculo de tabla, límite de jugadores
  por deporte, sin nombres de equipo duplicados, resultados editables.

## Estructura del repo

```
torneoapp/
├── app/            # Pantallas (Expo Router)
├── components/     # Componentes de UI reutilizables
├── context/        # AuthContext (sesión)
├── hooks/          # Hooks que hablan con la API (useTorneoApi, etc.)
├── lib/            # Cliente HTTP (lib/api.ts)
├── types/          # Tipos de dominio compartidos por las pantallas
├── constants/      # Configuración por deporte, paleta de colores
├── theme/          # Colores
├── docs/           # Documentación de alcance y técnica
├── ia/             # Conversaciones con IA (Claude) por entrega
└── backend/        # API REST — ver backend/README.md
```

## Cómo correr el proyecto

### 1. Backend

```
cd backend
npm install
```

Copiá `backend/.env.example` a `backend/.env` y completá `DATABASE_URL` con
un Postgres (recomendado: [Neon](https://neon.com), tiene un free tier que
alcanza de sobra para este proyecto) y un `JWT_SECRET` cualquiera.

```
npx prisma generate
npx prisma migrate dev --name init
npm run seed     # opcional: carga un club/torneo/usuarios de ejemplo
npm run dev
```

Instrucciones completas, endpoints y deploy en [`backend/README.md`](backend/README.md).

### 2. App móvil

Con el backend corriendo, en la raíz del repo:

```
npm install
```

Copiá `.env.example` a `.env` y poné la IP de tu PC en la red local (no
`localhost` — el celular con Expo Go no puede resolverlo):

```
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

```
npx expo start
```

Escaneá el QR con la app Expo Go (celular en la misma red wifi que la PC).

### Usuarios de prueba (si corriste `npm run seed`)

| Rol | Email | Contraseña |
|---|---|---|
| Organizador | organizador@torneoapp.com | torneo123 |
| Jugador | jugador@torneoapp.com | torneo123 |

## Stack

**App móvil**: Expo SDK 54 · expo-router · TypeScript · React Native Paper
**Backend**: Node.js · Express · Prisma ORM · PostgreSQL · JWT + bcrypt

## Historial de entregas

Ver [`CHANGELOG.md`](CHANGELOG.md).

## Uso de IA

Este proyecto usó Claude como asistente de desarrollo durante las 3 entregas.
Las conversaciones completas están en `ia/entrega-1/`, `ia/entrega-2/` e
`ia/entrega-3/`.
