# Architecture

## System

```text
Flutter (User + Driver)
  ├─ REST via Dio
  ├─ Socket.IO client
  ├─ GetX controllers/routes/DI
  ├─ Geolocator GPS
  └─ Google Maps
        │
        ▼
Node.js / Express / Socket.IO
  ├─ JWT auth + role authorization
  ├─ Ride state machine
  ├─ MongoDB nearby-driver query
  ├─ GPS trace persistence
  ├─ Fare calculation
  ├─ Notification service
  └─ Admin APIs
        │
        ▼
MongoDB
  ├─ users / drivers / admins
  ├─ vehicles
  ├─ rides
  ├─ locations
  ├─ payments
  ├─ ratings
  ├─ notifications
  └─ systemsettings
        ▲
        │
React Admin
  ├─ REST operations
  └─ Socket.IO live driver map
```

## Backend responsibility

The backend is authoritative for identity, ride assignment, ride transitions, measured fare data and admin authorization. Clients may request a transition but cannot mutate ride ownership or final fare directly.

## Driver matching

Matching uses MongoDB geospatial `$near` against `Driver.currentLocation`, then filters to approved, online, non-busy drivers with a fresh `lastLocationAt`, excludes drivers who already rejected the ride, and requires an active vehicle matching the requested vehicle type.

## Ride acceptance race protection

`findOneAndUpdate` accepts only a ride whose status is still `searching` and driver is still `null`. MongoDB therefore serializes the winner instead of allowing two clients to accept based on stale reads.

## Reconnection

Socket.IO reconnect is enabled in clients. After each reconnect, the mobile controllers query `/rides/active`, then rejoin the `ride:<id>` room. This means REST/MongoDB is the synchronization source of truth and sockets are the low-latency delivery channel.

## Location storage

Driver live updates modify the driver's current GeoJSON point and append a `Location` sample. During an active ride, the sample references `rideId`. Completed-ride distance is calculated from consecutive samples; TTL automatically expires old raw location samples after 30 days.
