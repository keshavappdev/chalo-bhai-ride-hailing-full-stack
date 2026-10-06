# 🚕 Chalo Bhai

### Full-Stack Ride-Hailing & Mobility Platform

A modern full-stack ride-hailing project combining **Flutter mobile applications, Node.js backend, MongoDB, React Admin Dashboard, and real-time Socket.IO communication** into one integrated system.

---

## ✨ Project Overview

**Chalo Bhai** is a complete ride-hailing platform concept with dedicated experiences for:

**👤 Users** — Book rides, track drivers, manage trips and ratings.

**🚗 Drivers** — Go online, receive ride requests, manage trips and share live location.

**🖥️ Admin** — Manage users, drivers, vehicles, rides and platform operations.

The project focuses on building a realistic **mobile + backend + admin ecosystem** rather than a standalone UI application.

---

## 🛠️ Tech Stack

| Layer               | Technologies             |
| ------------------- | ------------------------ |
| 📱 Mobile           | Flutter, Dart, GetX      |
| ⚙️ Backend          | Node.js, Express.js      |
| 🗄️ Database        | MongoDB, Mongoose        |
| 🔄 Real-Time        | Socket.IO                |
| 🖥️ Admin           | React.js, Vite           |
| 🔐 Authentication   | JWT, bcrypt              |
| 🗺️ Maps & Location | Google Maps, Geolocator  |
| 🐳 DevOps           | Docker, Docker Compose   |
| 🔔 Notifications    | Firebase Cloud Messaging |
| 🔧 Tools            | Git, GitHub, REST APIs   |

---

## 🏗️ Architecture

```text
              ┌─────────────────────────┐
              │      Flutter App        │
              │    User + Driver        │
              └────────────┬────────────┘
                           │
                    REST + Socket.IO
                           │
                           ▼
              ┌─────────────────────────┐
              │    Node.js Backend      │
              │   Express + Socket.IO   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │        MongoDB          │
              └─────────────────────────┘
                           ▲
                           │
                    REST + Socket.IO
                           │
              ┌────────────┴────────────┐
              │     React Admin         │
              │       Dashboard         │
              └─────────────────────────┘
```

---

## 📱 Mobile Experience

### User App

* Ride booking
* Pickup & destination
* Fare estimation
* Driver matching
* Live ride tracking
* Ride status
* Ride history
* Ratings & reviews
* Notifications

### Driver App

* Driver authentication
* Online / Offline mode
* Live GPS location
* Ride requests
* Ride acceptance
* Active ride management
* Navigation
* Ride history
* Earnings

---

## 🖥️ Admin Dashboard

A centralized React dashboard for managing the complete platform.

* Dashboard & analytics
* User management
* Driver management
* Driver approval
* Vehicle management
* Ride management
* Live driver map
* Payments
* Ratings & reviews
* Notifications
* Reports
* System settings

---

## 🔄 Core Ride Flow

```text
User
  ↓
Select Pickup & Destination
  ↓
Fare Estimate
  ↓
Request Ride
  ↓
Nearby Driver Matching
  ↓
Driver Accepts
  ↓
Live Location Tracking
  ↓
Ride Started
  ↓
Ride Completed
  ↓
Rating & Review
```

---

## 📂 Project Structure

```text
chalo-bhai-ride-hailing-full-stack/
│
├── mobile/                 Flutter application
├── backend/                Node.js + Express API
├── admin/                  React admin dashboard
│
├── docs/                   Project documentation
├── docker-compose.yml      Docker configuration
├── README.md
├── VALIDATION.md
└── BRANDING_CHANGES.md
```

---

## 🚀 Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

### Admin

```bash
cd admin
npm install
npm run dev
```

### Mobile

```bash
cd mobile
flutter pub get
flutter run
```

### Docker

```bash
docker compose up --build
```

> Environment files and private credentials are intentionally excluded from the repository. Use the provided `.env.example` files for local configuration.

---

## 🎯 What This Project Demonstrates

* Cross-platform Flutter development
* REST API architecture
* Real-time Socket.IO communication
* GPS & location-based services
* MongoDB data modeling
* Authentication & authorization
* React admin dashboard development
* Mobile ↔ Backend integration
* Docker-based development
* Full-stack application architecture

---

## 👨‍💻 Developer

### Keshav

**Flutter / Mobile Application Developer**

[GitHub](https://github.com/keshavappdev)

---

### ⭐ Chalo Bhai

A complete **mobile + backend + admin** ride-hailing system built to showcase practical full-stack development and real-world application architecture.
