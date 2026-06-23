# Lease Lord — Mobile App (Expo / React Native)

A single app that serves **two roles**, decided by the logged-in user's JWT:

- **TENANT** → dashboard, lease, rent/invoices, maintenance, complaints, reviews, profile, notifications
- **USER** (property seeker) → browse listings, listing detail, enquiries, account

It talks to the **`/api/mobile/v1/*`** REST API in the `TMS` Next.js project (Bearer-JWT auth).

## Stack
- Expo SDK 54 · React Native 0.81 · Expo Router (file-based) · TypeScript
  (pinned to SDK 54 to match the version Expo Go currently supports)
- Token stored in `expo-secure-store`; API client in `src/lib/api.ts`

## Project layout
```
src/
  app/
    _layout.tsx            # auth gate → routes by role
    (auth)/                # login, register (OTP), forgot/reset
    (tenant)/              # tenant Stack + (tabs) + detail screens
    (user)/                # seeker Stack + (tabs) + listing detail
  components/ui.tsx        # shared UI kit
  lib/
    api.ts                 # typed API client + token storage
    auth.tsx               # auth context
    config.ts              # API base URL resolution
    theme.ts               # brand palette
    useAsync.ts            # fetch/refresh hook
```

## Run it (development)

1. **Start the backend** (in the `TMS` repo): `npm run dev` — it listens on `http://<your-LAN-IP>:3000`.
2. Set the API URL: copy `.env.example` → `.env` and set `EXPO_PUBLIC_API_URL` to your PC's LAN IP (already set to `http://192.168.1.15:3000`). Phone + PC must share Wi-Fi.
3. Install the **Expo Go** app on your Android phone (Play Store).
4. In this folder:
   ```
   npm install        # first time only
   npx expo start
   ```
5. Scan the QR code with Expo Go. (USB also works: `npx expo start` then press `a`, with a USB-debugging device connected and the Android platform tools installed.)

**Demo logins** (from the backend seed, password `Password123!`):
- Tenant: `tenant@tms.local`
- Seeker: `seeker@tms.local`

## Build an installable APK (EAS — recommended)

Local APK builds need the full Android SDK. The easy path is Expo's cloud builder:

```
npm install -g eas-cli
eas login                       # free Expo account
eas build:configure
eas build -p android --profile preview
```

`--profile preview` produces a standalone **APK** download link (the default `production` profile makes an `.aab` for the Play Store). Before building for real users, set `EXPO_PUBLIC_API_URL` to your deployed HTTPS API (and deploy the `/api/mobile/v1/*` endpoints there).

## Notes
- Push notifications (FCM) are **not** wired yet — see §F of `MOBILE-API.md`.
- In-app payments need Razorpay keys configured on the backend.
