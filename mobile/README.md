# Xeon Net app (Android + iPhone)

React Native + Expo (SDK 58), TypeScript, Expo Router. Talks to the same Django backend as the website
(`https://xeonnet.site/api/...`) with a mobile login token, so no separate server is needed.

## What is inside

| Part | Screens |
|---|---|
| Public | Home, Services (+ detail), Portfolio (+ detail), Contact / quote form, Verify certificate, QR scanner |
| Staff panel | Dashboard, Clients (add / edit / call / WhatsApp / portal invite), Billing (invoices & proposals: create, edit, send, record payment, convert, share PDF), Projects & tasks (status, updates, new task), Certificates (issue with auto number, preview, share PDF, print, revoke), Inbox |
| Client panel | Overview (amount to pay, projects), Invoices & proposals (view, accept, share PDF), Project progress and updates |
| Everywhere | Dark / light theme, fingerprint / Face ID lock, push notifications, works offline with the last saved data |

Staff only see the sections their role allows (same rules as the website).

## Run it on your phone (development)

```bash
cd mobile
npm install
npx expo start          # needs a development build: npx expo run:android
```

## Get an APK

* **Automatic:** every push to `mobile/` on the `v2` branch runs GitHub → Actions → *Android APK*.
  Open the run and download **xeon-net-android-apk** (install it on Android, allow "install unknown apps").
* **EAS (for Play Store / App Store):**
  ```bash
  npm i -g eas-cli && eas login
  eas init                      # links the app to your Expo account (adds extra.eas.projectId)
  eas build -p android --profile preview      # APK
  eas build -p android --profile production   # AAB for Google Play
  eas build -p ios --profile production       # needs an Apple Developer account ($99/year)
  ```

## Push notifications

The backend sends them through Expo's push service when: a website message arrives, a task is given to
someone, a proposal is accepted (staff) and when an invoice / payment / reminder / project update goes to a client.
To switch them on in real builds:

1. `eas init` (adds the project id the app needs).
2. Android: create a Firebase project, add an Android app with package `site.xeonnet.app`, download
   `google-services.json` into `mobile/`, add `"googleServicesFile": "./google-services.json"` under `android` in
   `app.json`, then upload the FCM key in expo.dev → Credentials.
3. iPhone: EAS sets up the push key during `eas build -p ios`.

## PDFs

Invoices, proposals and certificates are made on the phone (expo-print) with the same design as the website.
If you change the website certificate design (`frontend/app/certificate.css` or the seal / logo), run
`python3 scripts/make-pdf-assets.py` to copy it into the app.
