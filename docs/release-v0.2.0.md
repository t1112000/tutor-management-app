# Release v0.2.0 — MyClass

**Tag:** `v0.2.0`  
**Title:** `v0.2.0 — All-time report & charts`

Paste this into GitHub → Releases → Draft a new release (or use `gh release create`).

---

## MyClass v0.2.0

Income reporting beyond a single month: **all-time totals**, a **full bill list**, and **TanStack Charts** visualizations on the report page.

### Highlights

- **All-time report** — paid / unpaid / total across every non-deleted invoice, plus bill count
- **Full invoice list** — every bill with student, attributed month, status, amount → bill detail
- **Charts** — paid vs unpaid, monthly revenue trend, top students (`@tanstack/charts@0.11.1`, pinned)
- **Monthly mode preserved** — same month picker and per-student breakdown as before

### API

- `GET /api/report?month=YYYY-MM` — unchanged monthly contract
- `GET /api/report?scope=all` — all-time payload (`bills`, `byMonth`, `students`, totals)

### Stack notes

- Next.js 15 · TypeScript · PostgreSQL · TanStack Query · **TanStack Charts** (pre-alpha; version pinned)
- License: [MIT](../LICENSE)

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
- No database migration required for this release

### Links

- Changelog: [CHANGELOG.md](../CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
- Security: [SECURITY.md](../SECURITY.md)
