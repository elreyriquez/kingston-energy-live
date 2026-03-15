# Kingston Energy — Waste-to-Energy Tracking System

## Overview

Full-stack React + Express app for managing Kingston, Jamaica's waste collection and energy generation operations. Role-based access with real-time truck tracking, AI alerts, and smart bin monitoring.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind + shadcn/ui
- **Map**: Leaflet + React-Leaflet (Kingston, Jamaica)
- **Charts**: Recharts
- **State**: Zustand
- **Auth**: bcrypt + session tokens in DB

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin (full access) |
| manager | manager123 | Manager |
| driver | driver123 | Driver portal |
| user | user123 | Resident portal |

## Structure

```text
artifacts/
  api-server/          # Express 5 API (auth, trucks, zones, reports, schedule, smartbin, stats)
  kingston-energy/     # React+Vite frontend (all pages)
lib/
  api-spec/            # OpenAPI spec + codegen config
  api-client-react/    # Generated React Query hooks
  api-zod/             # Generated Zod schemas
  db/                  # Drizzle schema (users, sessions, zones, trucks, reports, schedule, smartbins, daily_stats)
scripts/
  src/seed.ts          # Database seed script
```

## Features

- **Login** — role-based access (admin/manager/driver/resident)
- **Live Map** — Leaflet map of Kingston with real-time truck tracking, collection zones, disposal sites
- **Truck Simulation** — trucks collect waste, route to disposal sites, return to zones
- **AI Alerts** — maintenance, efficiency, route, safety, capacity, weather alerts
- **AI Chat** — floating chat assistant about trucks and energy
- **Waste Analyzer** — calculate energy output from waste composition
- **Reports** — residents submit garbage reports; staff review/resolve
- **Schedule** — weekly collection schedule by zone
- **Smart Bins** — sensor data for 8 monitored bins
- **Stats** — KPIs: waste collected, energy generated, homes powered, CO2 offset
- **Driver Portal** — simplified view for drivers
- **Resident Portal** — report submission, collection schedule, energy stats

## Running

- `pnpm --filter @workspace/scripts run seed` — seed the database
- `pnpm --filter @workspace/db run push` — push schema changes
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client/zod schemas
