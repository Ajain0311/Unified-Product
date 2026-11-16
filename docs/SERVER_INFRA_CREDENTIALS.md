# Infrastructure & Server Credentials Reference Guide

> **Confidential Reference Guide**
> This document logs the VM connectivity, database parameters, and third-party payment/auth credentials. Kept strictly local / ignored.

---

## 1. Production Azure Virtual Machine (Backend & Database)

- **VM Host / Public IP**: `172.198.50.59`
- **User**: `azureuser`
- **SSH Key Location**:
  - Windows: `C:\Users\admin\.ssh\Free750_key.pem`
  - Linux/Mac: `~/.ssh/Free750_key.pem`
- **Exact SSH Command**:
  ```bash
  ssh -i "C:\Users\admin\.ssh\Free750_key.pem" -o StrictHostKeyChecking=no azureuser@172.198.50.59
  ```
- **Service Root Directory**: `/opt/SuperApp_V2`
- **Deployed Binary Directory**: `/opt/SuperApp_V2/dist`
- **Systemd Service**: `superapp.service`
  - Restart command: `sudo systemctl restart superapp.service`
  - Logs command: `sudo journalctl -u superapp.service -n 50 --no-pager`

---

## 2. PostgreSQL Database (azuredb)

- **Host**: `127.0.0.1` (inside VM)
- **Port**: `5432`
- **Database Name**: `azuredb`
- **DB User**: `azuredbuser` / `postgres`
- **CLI Access inside VM**:
  ```bash
  sudo -u postgres psql -d azuredb
  ```
- **Pricing Policy (Active)**:
  - All food items base price: `1.00 INR`
  - Variants additional price: `0.00 INR`
  - Addons price: `0.00 INR`
  - Restaurant minimum order amount: `1.00 INR` (Delivery fee: `0.00 INR`)
  - Marketplace listings: `1.00 INR`
  - Ride fare minimum: `1.00 INR`

---

## 3. Payment Gateway (Razorpay Live)

- **Provider**: `Razorpay`
- **Key ID**: `rzp_live_TzFALvnQjiUkFn`
- **Key Secret**: `BzF34iFh9O3pBOQVyuaF5X8u`
- **Configured Locations**:
  - VM `.env`: `/opt/SuperApp_V2/.env`
  - VM AppSettings: `/opt/SuperApp_V2/dist/appsettings.json`
- **API Endpoint Verification**:
  - URL: `https://makemyfree.duckdns.org/api/payments/kit`
  - Verified Response:
    ```json
    {
      "success": true,
      "data": {
        "configuredProvider": "Razorpay",
        "activeProvider": "Razorpay",
        "checkoutMode": "razorpay",
        "keyId": "rzp_live_TzFALvnQjiUkFn",
        "hasCredentials": true
      }
    }
    ```

---

## 4. Google Play Console Service Account

- **Purpose**: Automated Google Play Console App Publishing via EAS Submit (`androidpublisher` scope).
- **Service Account Email**: `zupify-play-deployer@zupify-514510.iam.gserviceaccount.com`
- **GCP Project ID**: `zupify-514510`
- **Source File**: `C:\Users\admin\Downloads\zupify-514510-a19d980c7ce3.json`
- **Project Root Location**: `pc-api-key.json` (gitignored, contains deployment key)
- **Important Note**: This credential is for Google Play Store upload only, NOT for Firebase Cloud Messaging.
- **EAS Submit Command**:
  ```bash
  npx eas submit -p android --profile production
  ```

---

## 5. Firebase Cloud Messaging (FCM HTTP v1) Service Account (Pending)

- **Purpose**: Direct native Android push notification delivery via Firebase HTTP v1 API (`https://fcm.googleapis.com/v1/projects/{project-id}/messages:send`).
- **Firebase Project ID (from `google-services.json`)**: `project-d5fca028-5873-44ba-924`
- **Target VM Path**: `/opt/superapp/firebase-service-account.json` (permissions `0600`)
- **Environment Variable**: `FIREBASE_SERVICE_ACCOUNT_JSON=/opt/superapp/firebase-service-account.json`
- **Status**: **PENDING**. Download the Firebase Admin SDK private key JSON from Firebase Console -> Project Settings -> Service Accounts for project `project-d5fca028-5873-44ba-924` and install securely on the VM.
- **Fallback In Place**: Expo Push service fallback operates independently and is fully active.

---

## 6. Live App Updates (EAS OTA Updates - Primary & Unlimited)

- **Why EAS Update**: EAS Update allows publishing code and UI changes directly to testers' devices without consuming EAS build quotas.
- **Commands**:
  ```bash
  # Preview branch (internal testing)
  npm run publish:preview
  # Production branch
  npm run publish:prod
  ```
- **How it behaves**: Once installed on a device, the app automatically fetches the latest JS bundle upon restart from Expo Cloud CDN. PC / localhost is NOT needed.

---

## 6. Real-Time Error Log Monitoring Tool (Azure VM)

A persistent monitoring daemon tracks backend errors on the VM:
- **Monitor Service**: `superapp-error-monitor.service`
- **Daemon Script**: `/opt/SuperApp_V2/scripts/monitor-errors.sh`
- **Output Error Log**: `/var/log/superapp/errors.log`
- **Stream/View from Local Terminal**:
  ```bash
  npm run vm:logs:errors
  ```
- **View all general backend logs**:
  ```bash
  npm run vm:logs
  ```

