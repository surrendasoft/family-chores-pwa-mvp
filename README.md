# Family Chores PWA MVP

React + Firebase PWA MVP for a family chores accountability app.

## Features

- Dashboard personal action screen
- Week roster with Everyone / Me toggle
- Activity audit trail
- Profile with Admin / Member view
- Admin-managed recurring chores
- Editable 1/2/3-week daily roster rotation
- Colour-coded member assignment dropdowns
- One-off tasks created from Dashboard by any member
- Assign one-off task to a member or make it available for anyone
- Done / Can't do + reason / Swap + reason / Take available task
- Firebase Firestore persistence
- PWA manifest + service worker
- Acceptance tests against behaviour

## Setup in Cursor

```bash
npm install
npm run dev
```

## Firebase setup

Firebase project is configured in `src/lib/firebase.ts` for `global-2a5f8`.

Enable:

1. Authentication → Anonymous
2. Firestore Database

Deploy rules:

```bash
firebase login
firebase use global-2a5f8
firebase deploy --only firestore:rules
```

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Deploy hosting

### GitHub Pages (recommended)

Live URL: **https://surrendasoft.github.io/family-chores-pwa-mvp/**

Pushes to `master` deploy automatically via GitHub Actions.

Local build for Pages preview:

```bash
npm run deploy:pages
```

### Firebase Hosting (optional)

```bash
firebase login --reauth
npm run deploy
```

Real scheduled push reminders are not included in MVP 1. Add Firebase Cloud Messaging + Cloud Functions later.
