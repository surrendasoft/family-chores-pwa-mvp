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

Enable in the [Firebase Console](https://console.firebase.google.com/project/global-2a5f8):

1. **Authentication** → **Google** sign-in provider
2. **Firestore Database**
3. Add authorized domain: `family-chores-pwa-mvp.web.app`
4. Disable **Anonymous** auth (no longer used)

Deploy rules:

```bash
firebase login --reauth
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

This app deploys to a **dedicated Firebase Hosting site** inside project `global-2a5f8`:

- **https://family-chores-pwa-mvp.web.app**
- **https://family-chores-pwa-mvp.firebaseapp.com**

That is separate from the default `global-2a5f8.web.app` URL.

### One-time setup

```bash
firebase login --reauth
firebase hosting:sites:create family-chores-pwa-mvp --project global-2a5f8
```

If the site already exists, skip the create step.

### Deploy

```bash
npm run deploy
```

To also deploy Firestore rules:

```bash
npm run deploy:all
```

Real scheduled push reminders are not included in MVP 1. Add Firebase Cloud Messaging + Cloud Functions later.
