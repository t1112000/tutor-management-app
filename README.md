# MyClass - Tutor Management App

A Next.js web app for managing private tutoring sessions, students, billing, and scheduling.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- Node.js v20 (for local dev)
- yarn

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd tutor-management-app
   ```

2. Copy the example env file and fill in values:
   ```bash
   cp .env.example .env
   ```

3. Generate VAPID keys for web push notifications:
   ```bash
   npx web-push generate-vapid-keys
   ```
   Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_EMAIL` in `.env`.

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select an existing one)
   - Enable the **Google+ API** / **OAuth consent screen**
   - Create OAuth 2.0 credentials (Web application)
   - Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

5. Set up Resend for email:
   - Create an account at [resend.com](https://resend.com)
   - Generate an API key and set `RESEND_API_KEY` in `.env`

## Running with Docker Compose

```bash
docker compose up
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Local Development

```bash
yarn install
yarn db:migrate
yarn dev
```

## Notes

### Single-Replica Constraint

The daily reminder cron job (`node-cron`) and push notification delivery run inside the Node.js process. This means the app must run as a **single replica** — running multiple instances will cause duplicate reminders. If you need horizontal scaling, move the cron logic to a dedicated worker or an external scheduler.

### iOS PWA Push Notifications

Web push notifications on iOS require iOS 16.4+ and the app must be added to the Home Screen as a PWA. Notifications are not supported in Safari browser on iOS — only in standalone (Home Screen) mode.
