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

- **Project Root Location**: `pc-api-key.json`
- **Original Source File**: `C:\Users\admin\Downloads\zupify-514510-a19d980c7ce3.json`
- **EAS Submit Command**:
  ```bash
  npx eas submit -p android --profile production
  ```
