# Release v0.1.0 — MyClass

**Tag:** `v0.1.0`  
**Title:** `v0.1.0 — Initial open-source release`

Paste this into GitHub → Releases → Draft a new release.

---

## MyClass v0.1.0

First public open-source release of **MyClass** — a self-hosted private tutoring manager for solo tutors (Vietnam timezone, VND-friendly).

### Highlights

- **Students & schedules** — recurring weekly slots, soft-delete
- **Bills & sessions** — generate sessions, pay/unpay, edit notes
- **Calendar** — session view + fixed weekly schedule
- **Report** — monthly invoice attribution without double-counting
- **PWA + web push** — Home Screen install, VAPID reminders
- **Docker Compose** — app, Postgres, nightly backups
- **CI** — typecheck, lint, test, build on every PR

### Stack

Next.js 15 · TypeScript · PostgreSQL · NextAuth (credentials) · TanStack Query · Tailwind

### Getting started

```bash
git clone https://github.com/t1112000/tutor-management-app.git
cd tutor-management-app
cp .env.example .env
docker compose up --build
yarn set-password you@example.com 'password' 'Your Name'
```

See [README.md](../README.md) for env vars and local development.

### Notes

- Single-tutor ownership model (not multi-tenant SaaS)
- Daily reminder cron assumes a **single app replica**
- License: [MIT](../LICENSE)

### Links

- Changelog: [CHANGELOG.md](../CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Security: [SECURITY.md](../SECURITY.md)
