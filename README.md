# SMIT Smart Attendance Management System

A high-performance, real-time Attendance Management & On-Duty/Leave Automation Platform built for **Sri Muthukumaran Institute of Technology (Department of Information Technology)**.

---

## 🌟 Key Features

- **Multi-Role Portal**: Tailored workflows and role-based access control for **Students**, **Faculty**, **HOD**, and **Principal / Admin**.
- **Automated OD & Leave Propagation**:
  - Approved On-Duty (OD) and Leave requests automatically prefill and lock in period attendance sheets.
  - Prevents erroneous duplicate marking or manual overrides of officially sanctioned absences.
- **Smart Period-by-Period Attendance**:
  - Quick bulk-action controls ("Mark All Present", "Mark All Absent").
  - Mobile touch-friendly responsive interface with segmented status buttons.
  - Real-time KPI counts (Present, Absent, OD, Permission, Leave).
- **Attendance Analytics & Defaulter Tracking**:
  - Live 75% Anna University compliance threshold tracker.
  - Subject-by-subject percentage breakdowns with margin calculations ("Classes you can safely miss" vs "Classes required to reach 75%").
- **Audit Trails & Security**:
  - Tamper-evident session locks and modification logging.
  - Strict JWT session authentication and role validation.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system (Lucide icons, Canvas Confetti).
- **Backend**: Express 5, Node.js (`node:sqlite` Native SQLite engine).
- **Deployment**: Vercel Serverless Functions (`/api`) with SPA rewrites.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 22.x or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Naren-Karthick/SMIT-Attendance-System.git
   cd SMIT-Attendance-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   npm --prefix client install
   ```

3. **Start the Development Servers**:
   - Backend API:
     ```bash
     npm run server
     ```
   - Frontend Client:
     ```bash
     npm run client
     ```
   Open `http://localhost:3000` in your browser.

---

## 🔐 Demo Credentials (Seeded Automatically)

| Role | Username / ID | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Principal** | `principal` | `principal123` | College-wide reports, HOD oversight |
| **HOD (IT)** | `hod_it` | `hod123` | Department approvals, session overrides, batch reports |
| **Faculty** | `faculty1` | `faculty123` | Period attendance marking, student lookups |
| **Student** | `210821205001` | `student123` | OD / Leave applications, personal attendance dashboard |

---

## ☁️ Deployment on Vercel

The project includes pre-configured [`vercel.json`](./vercel.json) and [`api/index.js`](./api/index.js) for zero-friction deployment:

1. Import this repository into **[Vercel](https://vercel.com/new)**.
2. Ensure the framework preset is set to **Vite** or Other.
3. Build command: `npm --prefix client install && npm --prefix client run build`
4. Output directory: `client/dist`
5. Click **Deploy**!
