# Chalo Bhai API Documentation

Base REST URL: `http://localhost:4000/api`  
Socket URL: `http://localhost:4000`

All authenticated REST requests use:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Standard error shape:

```json
{
  "success": false,
  "message": "Human readable error",
  "details": {}
}
```

Common statuses: `400` bad input, `401` missing/invalid JWT, `403` role/account restriction, `404` not found, `409` ride/account state conflict, `422` validation error, `429` rate limit, `500` server error.

## Authentication

### POST `/auth/register/user`
Auth: No

Request:

```json
{"name":"Rider","email":"rider@example.com","phone":"9999999999","password":"StrongPass123"}
```

Response `201`:

```json
{"success":true,"token":"...","account":{"id":"...","name":"Rider","email":"rider@example.com","role":"user"}}
```

Possible errors: `409` email/phone already exists; `422` invalid fields.

### POST `/auth/register/driver`
Auth: No

```json
{
  "name":"Driver",
  "email":"driver@example.com",
  "phone":"8888888888",
  "password":"StrongPass123",
  "licenseNumber":"DL-12345",
  "vehicle":{"make":"Maruti","model":"Dzire","color":"White","plateNumber":"MP04AB1234","type":"car","year":2024}
}
```

Returns JWT and driver account. New drivers start with `verificationStatus=pending`.

### POST `/auth/login`
Auth: No

```json
{"email":"rider@example.com","password":"StrongPass123","role":"user"}
```

`role`: `user`, `driver`, or `admin`.

### GET `/auth/me`
Auth: Any authenticated role. Returns the authenticated account summary.

## User

### PATCH `/users/me`
Auth: User

```json
{"name":"Updated Name","avatarUrl":"https://..."}
```

### PUT `/users/location`
Auth: User

```json
{"lat":23.2599,"lng":77.4126}
```

### GET `/users/rides`
Auth: User. Returns up to 100 recent rides with populated driver/vehicle data.

## Driver

### POST `/drivers/online`
Auth: Driver

```json
{"isOnline":true,"lat":23.2599,"lng":77.4126}
```

Driver must be admin-approved before going online.

### PUT `/drivers/location`
Auth: Driver

```json
{"lat":23.2599,"lng":77.4126,"heading":120,"speed":8.4,"accuracy":5,"rideId":"optional"}
```

REST fallback for location update; the mobile app normally uses Socket.IO `driver:location`.

### GET `/drivers/rides`
Auth: Driver. Returns driver ride history.

### GET `/drivers/earnings`
Auth: Driver.

Response:

```json
{"success":true,"summary":{"total":1250,"rides":8},"recent":[]}
```

### GET `/drivers/nearby?lat=23.25&lng=77.41&radius=7000`
Auth: User or Admin. Returns approved online non-busy drivers near a point.

## Vehicles

### GET `/vehicles/mine`
Auth: Driver. Returns driver's vehicles.

### PATCH `/vehicles/:id`
Auth: Driver and vehicle ownership required.

Example:

```json
{"color":"Black","isActive":true}
```

## Rides

### POST `/rides/estimate`
Auth: User

```json
{
  "pickup":{"lat":23.2599,"lng":77.4126},
  "destination":{"lat":23.1815,"lng":77.4589}
}
```

Response:

```json
{"success":true,"distanceKm":12.5,"durationMinutes":31,"source":"google_routes","estimatedFare":262}
```

If Google Routes is not configured, `source` is `fallback`.

### POST `/rides`
Auth: User

```json
{
  "pickup":{"address":"Pickup address","lat":23.2599,"lng":77.4126},
  "destination":{"address":"Destination address","lat":23.1815,"lng":77.4589},
  "requestedVehicleType":"car",
  "paymentMethod":"cash"
}
```

Creates a `searching` ride and immediately runs nearby-driver matching. A user cannot create a second active ride.

### GET `/rides/active`
Auth: User or Driver. Returns the authenticated account's active ride or `null`.

### GET `/rides/:id`
Auth: User/Driver participant or Admin. Returns populated ride details.

### POST `/rides/:id/accept`
Auth: Driver. Atomic acceptance. Driver must be approved, online, not busy, and have an active vehicle.

Possible `409`: ride already claimed or driver unavailable.

### POST `/rides/:id/reject`
Auth: Driver. Adds the driver to `rejectedDrivers` while ride is searching.

### PATCH `/rides/:id/status`
Auth: Assigned Driver

```json
{"status":"driver_arriving"}
```

Allowed transitions:

- `accepted → driver_arriving`
- `driver_arriving → arrived`
- `arrived → in_progress`
- `in_progress → completed`

Completing calculates actual duration, GPS-trace distance, final fare and payment record; driver is released from busy state.

### POST `/rides/:id/cancel`
Auth: Ride User, assigned Driver or Admin

```json
{"reason":"Changed plans"}
```

Closed rides cannot be cancelled.

## Ratings

### POST `/ratings/ride/:rideId`
Auth: User or Driver participant. Ride must be completed.

```json
{"rating":5,"review":"Great ride"}
```

One rating per role per ride. User → driver ratings update driver's aggregate rating.

### GET `/ratings/mine`
Auth: User or Driver. Returns ratings received by the authenticated account.

## Notifications

### GET `/notifications`
Auth: Any account. Returns latest notifications.

### PATCH `/notifications/:id/read`
Auth: Notification owner. Marks as read.

### POST `/notifications/device-token`
Auth: User or Driver

```json
{"token":"firebase-device-token"}
```

Stores a unique FCM token on the account.

### DELETE `/notifications/device-token`
Auth: User or Driver. Same body; removes the token.

## Admin

All `/admin/*` routes require an Admin JWT.

### GET `/admin/stats`
Returns total users/drivers, online drivers, active/completed/cancelled rides and collected paid fare.

### GET `/admin/users`
Returns users.

### PATCH `/admin/users/:id/status`

```json
{"isActive":false}
```

### GET `/admin/drivers`
Returns drivers.

### PATCH `/admin/drivers/:id/verification`

```json
{"status":"approved"}
```

Status: `pending`, `approved`, `rejected`, `suspended`.

### GET `/admin/vehicles`
Returns all vehicles with driver details.

### PATCH `/admin/vehicles/:id`
Supports `make`, `model`, `color`, `type`, `year`, `isActive`.

### GET `/admin/rides`
Returns up to 500 recent rides.

### GET `/admin/payments`
Returns recent payment/fare ledger rows with ride, user and driver details.

### GET `/admin/ratings`
Returns ratings/reviews.

### GET `/admin/live-drivers`
Returns currently online drivers and latest location.

### GET `/admin/reports?days=30`
Returns daily aggregate totals, completed, cancelled and final-fare totals for 1–90 days.

### GET `/admin/settings`
Returns settings as a key/value object.

### PATCH `/admin/settings`

```json
{"supportPhone":"1800...","defaultCity":"Bhopal","commissionPercent":15,"maintenanceMode":false}
```

Persists values in `systemsettings`.

### POST `/admin/notifications`

```json
{"role":"user","recipientId":"...","title":"Support update","body":"Your issue is resolved"}
```

Creates MongoDB notification, emits Socket.IO in-app event and also sends FCM when configured.

## Socket.IO

Handshake:

```js
const socket = io(SOCKET_URL, {
  auth: { token: jwt },
  transports: ['websocket']
});
```

### Client → Server: `ride:join`

```json
{"rideId":"..."}
```

Server verifies the socket belongs to the user, assigned driver or admin before joining `ride:<id>`.

### Client → Server: `driver:location`
Driver JWT required.

```json
{"lat":23.2599,"lng":77.4126,"heading":90,"speed":10,"accuracy":5,"rideId":"..."}
```

Optional acknowledgement:

```json
{"ok":true}
```

### Server → Driver: `ride:request`

```json
{"ride":{"_id":"...","status":"searching","pickup":{},"destination":{}},"vehicle":{}}
```

Only nearby eligible driver rooms receive this event.

### Server → User: `ride:searching`

```json
{"rideId":"...","candidateCount":4}
```

### Server → User: `ride:accepted`
Populated ride object including assigned driver and vehicle.

### Server → Ride/User: `ride:state`
Latest populated ride object after a status transition/cancellation.

### Server → Ride/User: `ride:driver_location`

```json
{"rideId":"...","driverId":"...","lat":23.25,"lng":77.41,"heading":120,"at":"2026-09-29T...Z"}
```

### Server → Admin: `admin:driver_location`
Live driver location for the admin map.

### Server → Account: `notification:new`
New stored notification object.

## Synchronization rule

Socket.IO events are low-latency hints, not the only source of truth. After reconnect, clients must call `/rides/active` and then emit `ride:join` again. This behavior is implemented by the included Flutter controllers.
