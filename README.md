<<<<<<< HEAD
# Chalo Bhai — Integrated Ride-Hailing System

Chalo Bhai is one integrated ride-hailing codebase containing:

- **Flutter mobile app** with **User + Driver** modules in one application, using **GetX** for state, routing and dependency injection.
- **Node.js + Express + Socket.IO backend** with REST APIs, JWT authentication, MongoDB/Mongoose and role authorization.
- **MongoDB data layer** with GeoJSON locations and `2dsphere` indexes for nearby-driver matching.
- **React + Vite admin panel** for users, drivers, vehicles, rides, live drivers, reports, ratings, notifications and settings.
- Optional **Firebase Cloud Messaging** for push notifications, while in-app real-time notifications work over Socket.IO.

> The source is designed as a real connected starter system, not three disconnected UI demos. The same ride IDs, account identities, REST endpoints and Socket.IO rooms are shared end-to-end.

## 1. Repository layout

```text
ride_hailing_system/
├── backend/                Node/Express/MongoDB/Socket.IO API
│   ├── src/config/
│   ├── src/controllers/
│   ├── src/middleware/
│   ├── src/models/
│   ├── src/routes/
│   ├── src/services/
│   ├── src/sockets/
│   └── src/scripts/
├── mobile/                 Flutter User + Driver app
│   ├── lib/core/
│   ├── lib/modules/auth/
│   ├── lib/modules/user/
│   ├── lib/modules/driver/
│   └── lib/modules/common/
├── admin/                  React admin panel
├── docs/API.md             REST + Socket contract
├── docs/ARCHITECTURE.md    architecture and ride state machine
└── docker-compose.yml      local MongoDB + backend
```

## 2. Required software

Install:

- Node.js 22+ and npm
- MongoDB 7/8 locally, MongoDB Atlas, or Docker Desktop
- Flutter stable + Dart compatible with the dependencies in `mobile/pubspec.yaml`
- Android Studio and Android SDK for Android
- Xcode + CocoaPods for iOS/macOS development
- A Google Cloud project with Maps SDKs enabled
- Optional Firebase project for FCM push notifications

## 3. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:indexes
npm run seed:admin
npm run dev
```

Default backend URL: `http://localhost:4000`  
Health check: `GET http://localhost:4000/health`

### Backend environment variables

```dotenv
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/ride_hailing
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=http://localhost:5173
GOOGLE_ROUTES_API_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=
FARE_BASE=50
FARE_PER_KM=12
FARE_PER_MINUTE=2
FARE_MINIMUM=80
DRIVER_SEARCH_RADIUS_METERS=7000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
```

For Docker Compose use `MONGODB_URI=mongodb://mongo:27017/ride_hailing` in `backend/.env`, then:

```bash
docker compose up --build
```

## 4. MongoDB setup

The main collections are:

- `users`
- `drivers`
- `vehicles`
- `rides`
- `locations`
- `payments`
- `ratings`
- `notifications`
- `admins`
- `systemsettings`

GeoJSON points are stored as `[longitude, latitude]`, which is the order required by MongoDB. Driver `currentLocation`, user `lastKnownLocation`, ride pickup and location history all use GeoJSON. `npm run db:indexes` explicitly synchronizes the important indexes, including `2dsphere` indexes.

## 5. Flutter installation

The repository contains all application Dart source plus the critical native permission/config snippets. If this folder was copied without full generated Flutter platform boilerplate, run this once from `mobile/`:

```bash
flutter create . --platforms=android,ios
flutter pub get
```

After `flutter create`, re-check that the Google Maps metadata and location permissions shown in the included `android/app/src/main/AndroidManifest.xml` and `ios/Runner/Info.plist.additions.txt` remain applied.

Run Android emulator against a backend on the same Mac/PC:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:4000/api \
  --dart-define=SOCKET_URL=http://10.0.2.2:4000
```

Run iOS Simulator:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://127.0.0.1:4000/api \
  --dart-define=SOCKET_URL=http://127.0.0.1:4000
```

For a physical phone, replace the host with your development machine's LAN IP and make sure the phone and machine are on the same network.

## 6. Google Maps setup

Create separate restricted API keys for Android, iOS, web/admin and server use.

Enable at least:

- Maps SDK for Android
- Maps SDK for iOS
- Maps JavaScript API (admin live map)
- Routes API (backend fare/distance routing; optional but recommended)
- Geocoding API if you later replace device geocoding with server geocoding

### Android

Replace `YOUR_ANDROID_GOOGLE_MAPS_KEY` in:

`mobile/android/app/src/main/AndroidManifest.xml`

Restrict the key by Android application ID + SHA certificate fingerprint.

### iOS

Follow `mobile/ios/Runner/Info.plist.additions.txt`, configure the key in AppDelegate according to the current `google_maps_flutter` installation instructions, and restrict the key to the iOS bundle ID.

### Admin web map

Set:

```dotenv
VITE_GOOGLE_MAPS_API_KEY=your_web_maps_key
```

### Backend routes/fare

Set:

```dotenv
GOOGLE_ROUTES_API_KEY=your_server_routes_key
```

If no Routes key is configured, the backend uses a documented Haversine-based route approximation so local development still works. Production should use the Routes API or another trusted routing provider.

## 7. Firebase / notifications setup

In-app notifications work without Firebase: notifications are stored in MongoDB and emitted to authenticated Socket.IO rooms.

For FCM push notifications:

1. Create a Firebase project.
2. From `mobile/`, install FlutterFire CLI if needed and run `flutterfire configure`.
3. Keep `google-services.json`, `GoogleService-Info.plist`, generated Firebase options and service-account credentials out of Git.
4. The mobile app initializes Firebase when available, requests notification permission, obtains an FCM token, and registers it with `POST /api/notifications/device-token`.
5. Put the Firebase Admin service account JSON into the backend environment as a single JSON string:

```dotenv
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

The backend always saves the notification and emits it over Socket.IO; when Firebase is configured it also sends FCM to registered device tokens.

## 8. Socket.IO setup and real-time rooms

Socket URL is the backend root, **not** `/api`.

Authentication is passed during the Socket.IO handshake:

```js
io(SOCKET_URL, { auth: { token: jwt } })
```

Server rooms:

- `user:<userId>`
- `driver:<driverId>`
- `ride:<rideId>`
- `admins`

Important events:

- `ride:request` — backend → nearby drivers
- `ride:searching` — backend → requesting user
- `ride:accepted` — backend → user
- `ride:state` — backend → user/driver/ride room
- `driver:location` — driver → backend
- `ride:driver_location` — backend → user/ride room
- `admin:driver_location` — backend → admin live map
- `notification:new` — backend → account room
- `ride:join` — client rejoins a ride room after connect/reconnect

Both mobile modules also call `GET /api/rides/active` after reconnect, so the REST database state is authoritative if Socket.IO messages were missed.

## 9. Ride request flow

### User

1. Register/login as User.
2. Mobile asks for current GPS location.
3. User types a destination address or drops a destination pin.
4. `POST /api/rides/estimate` returns distance, duration and fare estimate.
5. `POST /api/rides` creates a `searching` ride.
6. Backend performs a MongoDB `$near` query against approved, online, non-busy drivers with recent GPS updates and a matching active vehicle type.
7. `ride:request` is emitted only to candidate driver rooms.

### Driver

1. Register/login as Driver.
2. Admin approves the driver.
3. Driver toggles online, sending current GPS coordinates.
4. Driver receives `ride:request`.
5. Accept calls `POST /api/rides/:id/accept`.
6. Acceptance uses an atomic MongoDB filter (`status=searching`, `driver=null`), preventing two drivers from claiming the same ride.
7. Driver can open external Google Maps navigation to pickup.
8. Driver transitions the server state through on-the-way, arrived, started and completed.

### State machine

```text
searching
  └─ accepted
      └─ driver_arriving
          └─ arrived
              └─ in_progress
                  └─ completed

searching/accepted/driver_arriving/arrived -> cancelled (when allowed)
```

The backend validates transitions; clients cannot arbitrarily jump states.

## 10. Real-time location flow

When a driver is online, the Flutter driver controller starts a high-accuracy Geolocator stream. Android uses a foreground location notification configuration; iOS uses background location settings when permissions and native capabilities permit it.

Each update sends:

```json
{
  "lat": 23.25,
  "lng": 77.41,
  "heading": 120,
  "speed": 8.4,
  "accuracy": 6.0,
  "rideId": "..."
}
```

The backend:

1. Updates `Driver.currentLocation`.
2. Appends a `Location` sample.
3. Broadcasts live coordinates to the ride/user.
4. Broadcasts driver coordinates to admin live map.
5. On ride completion, calculates measured distance from the stored GPS trace. If too few samples exist, it falls back to the route estimate.

A disconnected driver gets a reconnect grace period. If no driver socket reconnects, the backend marks that driver offline so stale drivers are not matched.

> Mobile OSes impose additional battery/background restrictions. For a production fleet app, test OEM-specific Android battery optimization behavior and iOS background-location review requirements on real devices.

## 11. Fare and payment behavior

Fare formula:

```text
max(minimumFare, baseFare + distanceKm * perKm + durationMinutes * perMinute)
```

All values come from backend environment configuration. The user sees an estimate before booking. On completion, the backend recalculates with measured GPS distance and actual elapsed ride duration.

`cash`, `online` and `wallet` methods exist in the schema. **Cash is fully handled in this repository** and is marked paid on completion. The configured admin `commissionPercent` is split into `platformFee` and `driverEarning` for each completed payment record. Online/wallet payments remain `pending` until a real payment provider confirms them; no fake payment-success implementation is included.

## 12. React Admin installation

```bash
cd admin
cp .env.example .env
npm install
npm run dev
```

Admin URL defaults to `http://localhost:5173`.

Create the first admin from backend:

```bash
cd backend
npm run seed:admin
```

Admin features included:

- Admin login
- KPI dashboard
- Users management and enable/disable
- Driver management and approval/rejection/suspension
- Vehicle management and activation
- Ride list and ride detail
- Admin ride cancellation
- Live driver map over Socket.IO
- Dedicated payments/fare ledger plus earnings visibility in ride/report data
- Ratings/reviews
- Direct user/driver notifications
- 30-day reports/statistics chart
- MongoDB-backed settings

## 13. User login flow

`RolePage → User → Login/Register → JWT saved in GetStorage → Socket connects → UserHomePage`

The JWT is automatically attached to REST requests by `ApiService` and to Socket.IO handshake auth by `SocketService`.

## 14. Driver login flow

`RolePage → Driver → Login/Register → approval required → online toggle → GPS stream + Socket.IO → incoming rides`

A pending or rejected driver receives a backend authorization error when attempting to go online.

## 15. Admin flow

`Admin Login → JWT → Dashboard/Management/Live Map/Reports/Settings`

The admin token uses the same JWT secret but has `role=admin`; backend route middleware enforces role authorization. `maintenanceMode` is enforced by backend middleware for non-admin traffic, while admins can still log in and operate the system. `commissionPercent` is captured when a ride completes and is saved as platform fee + driver earning on the payment record.

## 16. Running all services locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd admin
npm run dev
```

Terminal 3:

```bash
cd mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_URL=http://10.0.2.2:4000
```

For realistic testing, use two app instances/devices: one logged in as User and one as Driver.

## 17. Production build / deployment

### Backend

- Use MongoDB Atlas or a managed MongoDB cluster.
- Set a long random `JWT_SECRET` in the deployment secret manager.
- Configure exact `CLIENT_ORIGINS`; do not use `*` in production.
- Use HTTPS/WSS behind a reverse proxy/load balancer.
- Run `npm run db:indexes` as a deployment/migration task.
- If horizontally scaling Socket.IO to multiple backend instances, add a Redis adapter and sticky/session-aware WebSocket routing.
- Keep Firebase service-account credentials only in secret storage.

Docker:

```bash
docker build -t rideflow-backend ./backend
```

### Admin

```bash
cd admin
npm run build
```

Deploy `admin/dist` to Netlify, Vercel, Cloudflare Pages, S3/CloudFront, Nginx, etc. Set the three `VITE_*` values at build time.

### Flutter Android

```bash
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.example.com/api \
  --dart-define=SOCKET_URL=https://api.example.com
```

### Flutter iOS

```bash
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.example.com/api \
  --dart-define=SOCKET_URL=https://api.example.com
```

Use release-specific restricted Google/Firebase credentials and signing configuration.

## 18. Security notes

- Passwords are stored only as bcrypt hashes.
- JWT protected routes derive account identity from the token, never from client-submitted user IDs.
- Driver-only state changes require driver authorization and ownership of the ride.
- Ride acceptance is atomic.
- Admin routes require `role=admin`.
- Helmet, rate limiting, JSON body limits and CORS restrictions are enabled.
- Secrets are represented only by `.env.example`; real `.env` files are ignored.
- For high-value production payment flows, add provider webhooks with idempotency and signature verification before marking online payments paid.

## 19. Common errors / troubleshooting

### Mobile cannot reach backend

- Android Emulator must use `10.0.2.2`, not `localhost`.
- iOS Simulator can normally use `127.0.0.1`.
- Physical devices must use your computer's LAN IP.
- Check firewall and that backend listens on port 4000.

### Google Map is blank

- Verify billing and correct Maps SDK are enabled.
- Verify Android package/SHA or iOS bundle restrictions.
- Check that the native key was actually added to the platform config.

### Driver receives no rides

Check all of:

- Driver verification is `approved`.
- Driver is online.
- Driver GPS updated in the last minute.
- Driver is not already busy.
- Active vehicle exists and its type matches the ride request.
- Driver is within `DRIVER_SEARCH_RADIUS_METERS`.
- Both clients are connected to the same backend/database.

### Socket connects then disconnects

- Confirm `SOCKET_URL` does not include `/api`.
- Confirm the mobile/admin JWT is valid.
- Check reverse proxy WebSocket upgrade support.
- In multi-instance deployment add a shared Socket.IO adapter.

### MongoDB `$near` / geo errors

Run:

```bash
npm run db:indexes
```

Also confirm coordinates are stored as `[longitude, latitude]`, not the reverse.

### Firebase push does nothing

- In-app Socket.IO notifications should still work.
- Run `flutterfire configure` and add native Firebase configuration.
- Confirm iOS APNs setup/entitlements.
- Confirm backend `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON.
- Confirm device token was stored on the account.

### Driver background location stops

- Verify `ACCESS_BACKGROUND_LOCATION` / foreground-service permissions and iOS background mode.
- Test on a physical device.
- Android OEM battery savers can terminate location services; production fleet apps need device-specific testing and user-visible permission guidance.

## 20. API documentation

See [`docs/API.md`](docs/API.md) for REST endpoints, request examples, authentication and Socket.IO events.

## 21. What is intentionally not faked

The repository does **not** simulate a successful Stripe/Razorpay payment without a provider account. Cash works end-to-end; online/wallet are represented and remain pending until a real provider integration confirms payment. Likewise Google Routes and Firebase are optional integrations that activate when their real credentials are configured; local development has safe fallbacks for routing and in-app notifications.
=======
# 🚕 Chalo Bhai — Full-Stack Ride Hailing Platform

> A full-stack ride-hailing and mobility platform built for learning,
> development, and demonstrating modern mobile + backend architecture.

[Tech Stack] [Flutter] [Node.js] [MongoDB] [React] [Docker]

---

## 📱 Project Overview

Chalo Bhai is a full-stack ride-hailing platform consisting of:

👤 User Mobile App
🚗 Driver Mobile App
🖥️ Admin Dashboard
⚙️ Node.js REST API
🗄️ MongoDB Database
🔄 Real-time Socket.IO communication

---

## ✨ Key Features

### 👤 User App
- User registration & login
- Ride booking
- Pickup & destination
- Fare estimation
- Driver matching
- Live ride status
- Ride history
- Ratings & reviews
- Notifications
- Profile management

### 🚗 Driver App
- Driver authentication
- Online/offline status
- Location updates
- Incoming ride requests
- Accept/reject rides
- Active ride management
- Ride history
- Earnings information

### 🖥️ Admin Dashboard
- Dashboard overview
- User management
- Driver management
- Vehicle management
- Ride management
- Live map
- Payments
- Reviews
- Notifications
- Reports
- System settings

---

## 🏗️ Architecture

```text
                 ┌──────────────────────┐
                 │     Flutter Apps     │
                 │  User + Driver App   │
                 └──────────┬───────────┘
                            │
                       REST / Socket.IO
                            │
                 ┌──────────▼───────────┐
                 │   Node.js + Express  │
                 │      REST API        │
                 └──────────┬───────────┘
                            │
                 ┌──────────▼───────────┐
                 │       MongoDB        │
                 │      Database        │
                 └──────────────────────┘

                 ┌──────────────────────┐
                 │    React Admin       │
                 │      Dashboard      │
                 └──────────┬───────────┘
                            │
                         REST API
                            │
                       Backend API
>>>>>>> 4f228f0878b5759ef04bdc1025265ca1bc81875c
