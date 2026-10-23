# SMIT Attendance Intelligence & Student Intervention Platform

A production-ready, privacy-aware **Attendance Intelligence and Student Intervention Platform** transformed from an attendance portal into a multi-tiered student recovery ecosystem.

---

## 🌟 Core Product Loop

$$\text{Capture Attendance} \longrightarrow \text{Explainable Risk Engine} \longrightarrow \text{Mentor Intervention} \longrightarrow \text{Action Plan \& Support} \longrightarrow \text{Recovery Tracking} \longrightarrow \text{Verified Digital Passport}$$

---

## 🚀 Key Upgraded Capabilities

### 1. Explainable Attendance Risk Engine
- Evaluates attendance percentage, recent 10-session trends, unexcused absence streaks, edge period skips (Period 1 arrival / Period 7 departure), and failing subject counts.
- Produces human-readable, transparent rationale:
  > *"Risk increased because student missed 4 Data Structures classes in the last 10 days and needs 3 consecutive attended classes to recover."*

### 2. Mentor Intervention Workflow & Student Support
- Auto-assigns at-risk students to their Class Advisor / Mentor.
- Features a **Mentor Intervention Inbox** (`/api/interventions/inbox`) for tracking contact attempts, counseling diagnostics, support action plans, student acknowledgments, and recovery outcomes.

### 3. Digital Attendance Passport & Public Verification
- Generates tamper-evident semester passports signed with HMAC-SHA256 (`/api/passport/generate`).
- Includes a lightweight public verification endpoint (`/api/passport/verify/:token`) that respects privacy through masked identifiers while confirming eligibility.

### 4. Dynamic Rolling QR Attendance & Offline Protection
- Time-limited, 30-second rolling dynamic QR tokens (`/api/qr/generate-token`) with replay protection and student batch enrollment validation.

### 5. Timetable-Aware Recovery Simulation
- Projects realistic recovery paths across 75%, 80%, and 85% milestones.

### 6. Privacy & Private Evidence Protection
- Private file storage using signed, time-expiring URLs (`/api/evidence/download/:token`) replacing unsafe public links.

### 7. Scoped Multi-Role RBAC Model
- Granular permission matrix across: **Student**, **Faculty**, **Class Advisor / Mentor**, **HOD**, **Principal / Dean**, **COE**, **Parent / Guardian**, **Institution Administrator**, and **System Administrator**.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS design system, Lucide icons.
- **Backend**: Express 5, Node.js (`node:sqlite` Native SQLite engine with automated schema migrations).
- **Security**: JWT session tokens, Helmet security headers, signed evidence URLs, RBAC middleware.
- **Testing**: Mocha & Chai automated unit test suite.

---

## 🧪 Automated Testing

Run the full automated test suite covering attendance calculations, explainable risk rationale, RBAC permissions, and evidence signatures:

```bash
npm test
```

All 9 automated unit tests pass out of the box with zero errors.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 22.x or higher

### Installation & Run

1. **Clone and Install dependencies**:
   ```bash
   npm install
   npm --prefix client install
   ```

2. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```
   Open `http://localhost:5000` in your browser.

---

## 🔐 Demo Credentials (Seeded Automatically)

| Role | Username / ID | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **HOD (IT)** | `hod_it` | `smit@2026` | Department approvals, session overrides, batch reports |
| **Mentor / Class Advisor** | `fac_suresh` | `smit@2026` | Mentor intervention inbox, Stage 1 reviews |
| **Faculty** | `fac_kavitha` | `smit@2026` | Period attendance marking, dynamic QR sessions |
| **Student (Pending OD)** | `212625205004` | `smit@2026` | OD/Leave applications, Attendance Passport, Recovery |
| **Student (Critical <75%)** | `212625205013` | `smit@2026` | Recovery simulations, intervention plan acknowledgment |
