# BloodConnect – Emergency Blood Donor Platform

> **Emergency Blood Donor Platform connecting patients, hospitals, and life-saving donors in real time with proximity matching and response-time analytics.**

---

## 🚨 Problem & Purpose
During medical emergencies, trauma surgeries, and childbirth complications, finding compatible blood quickly can be a life-or-death race against time. **BloodConnect** eliminates bureaucratic friction by instantly linking hospitals, patients, and emergency responders with verified nearby blood donors using real-time proximity matching and automated dispatching.

---

## ✨ Features Implemented

### 🩸 Mandatory Requirements
- **Donor Registration**: Donors register with full name, blood group, contact phone, city, address, location coordinates, alert radius, and availability status.
- **Blood Groups**: Full support for all 8 standard blood groups: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`.
- **Location**: Geolocation-aware search with city, address, and Haversine distance proximity calculation.
- **Availability Toggle**: Real-time 1-click status switch (`Available` vs `Busy` / `Donated Recently`).
- **Emergency Blood Request**: Urgent requests with patient details, units needed, hospital, contact, clinical notes, and priority badges.
- **Search Donors**: Filter by blood group chips, city, keyword search, and availability toggle.
- **Request Status**: Multi-stage lifecycle tracking: `PENDING` ➔ `ACCEPTED` ➔ `FULFILLED` ➔ `CANCELLED`.
- **Admin Dashboard**: Full CRUD management interface for donors and requests, system statistics, and database management.
- **MongoDB Atlas Connection**: Native Mongoose ODM with dual-mode fallback (connects directly to MongoDB Atlas with seamless in-memory resilience so the app runs without database downtime).
- **CRUD Operations**: Complete Create, Read, Update, Delete for Donors, Requests, and Hospitals.

### ⚡ Additional Requirements
- **Search by Blood Group**: One-click filter chips for instant filtering with clinical compatibility suggestions.
- **Search by Location**: City, district, or coordinate-based search.
- **Donor Availability**: Live status badge with inline toggle.
- **Emergency Priority**: Visual hierarchy: `CRITICAL` (pulsing red trauma alert), `URGENT` (amber), `STANDARD` (blue).

### 🚀 Advanced Features
- **Nearest Donor Matching**: Real-time Haversine proximity engine ranks compatible donors by distance (km) and matches them instantly to the emergency patient.
- **Interactive Blood Compatibility Matrix**: Visual guide displaying universal donor (`O-`) and universal recipient (`AB+`) clinical transfusion rules.
- **Real-Time Notifications & WebSocket Alerts**: Socket.io live updates for emergency request broadcasts, donor dispatching, and status changes with synthesized audible alarms.
- **Hospital Command Center**: Live blood bank cold storage inventory manager (`+` / `-` unit controls) with deficit alerts (< 3 units).
- **Response-Time Analytics**: Visual metric cards calculating average turnaround time (minutes from request to fulfillment), fulfillment rates, and supply vs. demand bar charts.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express.js, Socket.io (WebSocket), Mongoose (MongoDB ODM), dotenv, cors.
- **Database**: MongoDB Atlas (`mongodb+srv://...`) with dual-mode in-memory resilience.
- **Frontend**: React (Vite), HTML5, CSS3 with custom design system, JavaScript (ES6+), Lucide Icons, Web Audio API.

---

## 📁 Project Structure

```
d:\BloodConnect\
├── client\                  # React (Vite) Frontend
│   ├── src\
│   │   ├── components\
│   │   │   ├── Navbar.jsx               # Navigation & live socket status
│   │   │   ├── EmergencyBanner.jsx      # Top pulsing emergency ticker
│   │   │   ├── HomeView.jsx             # Hero, KPIs, Compatibility Matrix
│   │   │   ├── DonorSearchView.jsx      # Donor search & GPS proximity filter
│   │   │   ├── BloodRequestView.jsx     # Request queue & matched donors drawer
│   │   │   ├── HospitalDashboard.jsx    # Hospital inventory & hotline manager
│   │   │   ├── AdminDashboard.jsx       # Full CRUD & Response-Time Analytics
│   │   │   ├── DonorRegisterModal.jsx   # Donor registration dialog
│   │   │   ├── EmergencyRequestModal.jsx# Emergency blood request dialog
│   │   │   └── ToastAlert.jsx           # Real-time toast notifications
│   │   ├── utils\
│   │   │   └── sound.js                 # Web Audio API emergency siren synthesizer
│   │   ├── App.jsx                      # Main app controller & Socket.io listener
│   │   ├── index.css                    # Modern CSS design system & animations
│   │   └── main.jsx
│   ├── index.html                       # HTML5 entry with emergency favicon
│   └── vite.config.js                   # Vite config with /api and /socket.io proxy
│
├── server\                  # Node.js & Express Backend
│   ├── config\
│   │   └── db.js                        # MongoDB Atlas connection handler
│   ├── models\
│   │   ├── Donor.js                     # Donor schema with blood group & geo indexes
│   │   ├── BloodRequest.js              # Blood request schema with urgency & metrics
│   │   └── Hospital.js                  # Hospital & blood bank inventory schema
│   ├── controllers\
│   │   ├── donorController.js           # Donor CRUD & availability handlers
│   │   ├── requestController.js         # Request CRUD, proximity match & dispatch
│   │   ├── hospitalController.js        # Hospital directory & inventory adjustment
│   │   └── analyticsController.js       # Response-time & supply/demand analytics
│   ├── routes\
│   │   ├── donorRoutes.js
│   │   ├── requestRoutes.js
│   │   ├── hospitalRoutes.js
│   │   └── analyticsRoutes.js
│   ├── utils\
│   │   ├── distance.js                  # Haversine distance & compatibility matrix
│   │   ├── seedData.js                  # Initial realistic emergency seed records
│   │   └── dataStore.js                 # Dual-mode Mongoose / Memory data provider
│   ├── .env                             # Environment configuration
│   └── server.js                        # Express server & Socket.io entry point
│
└── package.json                         # Unified root scripts
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies (Already Completed)
```bash
npm run install:all
```

### 2. Configure MongoDB Atlas (Optional)
In `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/bloodconnect?retryWrites=true&w=majority
NODE_ENV=development
```
> **Note**: If `MONGODB_URI` is not yet configured or Atlas is unreachable, BloodConnect automatically activates **Resilient Fallback Mode** with realistic seed data so all features, CRUD, matching, and analytics work out-of-the-box!

### 3. Start the Unified Server
```bash
npm start
```
Open your browser and navigate to:
👉 **`http://localhost:5000`**

### 4. For Live React Hot-Reload Development (Optional)
```bash
npm run client
```
Access the Vite dev server at **`http://localhost:3000`** (requests to `/api` and `/socket.io` are automatically proxied to port 5000).

## Deploying to Vercel

This repository includes a Vercel configuration for the Vite frontend and Express API:

1. Import the repository into Vercel without changing the root directory.
2. Add `MONGODB_URI` and a long random `JWT_SECRET` in the Vercel project environment variables.
3. Deploy with the included `vercel.json` settings.

The API is deployed as a Vercel Function at `/api`. Socket.IO is available during local development; Vercel Functions do not provide a persistent WebSocket server, so the application uses its normal API behavior there.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/donors` | List donors with blood group, city, availability & distance filters |
| `POST` | `/api/donors` | Register a new blood donor |
| `GET` | `/api/donors/:id` | Get donor details |
| `PUT` | `/api/donors/:id` | Update donor profile |
| `PATCH` | `/api/donors/:id/availability` | 1-click toggle availability status |
| `DELETE` | `/api/donors/:id` | Delete donor record |
| `GET` | `/api/requests` | List emergency blood requests sorted by urgency |
| `POST` | `/api/requests` | Post an emergency blood request & auto-match donors |
| `PATCH` | `/api/requests/:id/status` | Update request status (records response time on fulfillment) |
| `GET` | `/api/requests/:id/match-donors` | Nearest donor matching algorithm (Haversine km) |
| `POST` | `/api/requests/:id/notify-donors` | Dispatch emergency alerts to matched donors |
| `GET` | `/api/hospitals` | Hospital list with blood inventory |
| `PATCH` | `/api/hospitals/:id/inventory` | Adjust blood bank units (`+` / `-`) |
| `GET` | `/api/analytics` | Response-time analytics, supply vs demand, fulfillment % |
| `POST` | `/api/analytics/seed` | Reset and re-seed database with realistic demo data |
