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
