# Padel Estadistic

Aplicación web en React para registrar y analizar estadísticas de pádel, reemplazando una planilla Excel.

## Qué incluye este MVP

- Autenticación con Firebase Auth (email/password)
- Rutas públicas y privadas con React Router
- CRUD de jugadores (alta, edición, desactivación)
- CRUD de partidos (alta, edición, eliminación)
- Carga rápida de eventos por partido con “deshacer último evento”
- Dashboard con KPIs y gráficos (Recharts)
- Rankings automáticos
- Estadísticas por jugador con filtros por fecha
- Perfil individual de jugador
- Capa de servicios Firestore por módulo
- Cálculo de métricas con funciones puras reutilizables

## Stack

- React + Vite
- TypeScript
- Firebase (Auth + Cloud Firestore)
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- Recharts

## Instalación

1. Instalar Node.js 20+ (recomendado 20 o 22).
2. Instalar dependencias:

```bash
npm install
```

## Variables de entorno

Crear `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Completar:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase setup

1. Crear proyecto en Firebase.
2. Habilitar **Authentication > Email/Password**.
3. Crear usuarios desde Firebase Console (no hay registro público).
4. Crear base **Cloud Firestore**.
5. (Opcional) aplicar reglas base de [`firestore.rules`](./firestore.rules).

## Correr en desarrollo

```bash
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Seed de datos

Cargar datos iniciales (6 jugadores, 3 partidos y eventos):

```bash
npm run seed
```

El seed se ejecuta solo si `players` está vacío.

## Rutas

### Pública

- `/login`

### Privadas

- `/dashboard`
- `/players`
- `/players/new`
- `/players/:id`
- `/players/:id/edit`
- `/matches`
- `/matches/new`
- `/matches/:id`
- `/matches/:id/edit`
- `/matches/:id/events`
- `/stats`
- `/rankings`

## Estructura

```text
src/
  app/
  router/
  providers/
  config/
  firebase.ts
  features/
    auth/
    players/
    matches/
    stats/
  components/
    ui/
    layout/
  shared/
    lib/
    utils/
    constants/
    formatters/
    types/
scripts/
  seed.ts
```

## Decisiones de arquitectura

- Servicios Firestore separados por feature (`services/*Service.ts`).
- Hooks de datos separados (`hooks/use*.ts`) con invalidación de caché en mutaciones.
- Validaciones de formularios con RHF + Zod (`schemas/`).
- Cálculos de estadísticas desacoplados de UI (`features/stats/services/statsService.ts`).
- Modelos tipados por módulo (`types/`).

## Futuras mejoras sugeridas

- Toast notifications globales
- Skeleton loaders
- Exportación CSV
- Paginación en tablas
- Filtros avanzados multi-criterio
- Modo oscuro
- Tests unitarios para `statsService`
- Reglas Firestore por roles (`coach`, `analyst`)
# padel-stadistic
# padel-stadistic
