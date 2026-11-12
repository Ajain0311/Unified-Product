# Zupify Mobile Build & Play Store Deployment Guide

This document is the standard reference for building, releasing, and configuring the Zupify Android mobile application from any machine.

---

## 1. Google Play Console Service Account Setup

To allow automated submissions (`eas submit`) to the Google Play Store:

1. The service account JSON key is kept locally in the project root as `pc-api-key.json` (strictly ignored by `.gitignore` to prevent credential leaks).
2. Configured in `eas.json` under `submit.production.android`:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./pc-api-key.json",
         "track": "closed-testing"
       }
     }
   }
   ```
3. To submit any compiled `.aab` directly to Google Play:
   ```bash
   npx eas submit -p android --profile production
   ```

---

## 2. Building Android App Bundles (.AAB)

### Option A: Local Unlimited Build (Zero EAS Cloud Quota Used)
Run locally using the machine's Android SDK and Java:
```bash
npx eas build -p android --profile production --local
```

### Option B: Cloud EAS Build (Managed Worker)
```bash
npx eas build -p android --profile production --non-interactive
```

### Option C: Native Prebuild + Gradle
```bash
npx expo prebuild --platform android --clean
cd android
./gradlew bundleRelease
```
Output artifact: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. R8 Code Obfuscation & DEX Optimization

Google Play requires DEX code optimization and >25% obfuscation.
Configured via `expo-build-properties` inside `app.json`:
```json
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
]
```

---

## 4. Payment Gateway & Server Environment Architecture

1. **Active Payment Flow**:
   - The backend exposes `/api/payments/kit` which informs the client whether active mode is `Razorpay` or `Mock`.
   - In production with real payments, the server requires `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (or `PAYMENT_KEY` / `PAYMENT_SECRET`).
   - If server keys are missing, the backend safely defaults to `MockPaymentService` (allowing COD and simulated test checkouts).
   - In mobile apps, Cash on Delivery (`COD`) is available out-of-the-box. For online payment via mobile, the checkout order is initiated through `/api/payments/create-order` or `/api/food/orders/{id}/pay`.
