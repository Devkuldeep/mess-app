# Mess Manager

Tiffin & mess management PWA — daily cooking count, delivery checklist (works offline),
customers, payments with WhatsApp reminders, and a no-login customer link for skipping meals.
Hindi-first, mobile-first, multi-tenant.

## Quick start

```bash
docker compose up -d db          # Postgres 17 on localhost:5433
cp .env.example .env
npm install
npm run db:deploy && npm run db:seed
npm run dev                      # http://localhost:3000
```

Demo login: **9876543210 / password123** (owner) · **9876500000 / password123** (delivery staff).

Offline/PWA features need a production build: `npm run build && npm start`.

Production image: `docker build -t mess-app .` (see the header of `Dockerfile` for migrations).

Developer guide: [CLAUDE.md](CLAUDE.md). Product notes: [docs/](docs/).
