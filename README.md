# UNO MINDA Industrial Instruction Management System

A cutting-edge, premium digital Standard Operating Procedure (SOP) management and interactive instruction execution platform. Built with a modern glassmorphic interface, real-time analytics, and secure stage-wise compliance verification.

---

## 🚀 Core Features

### 1. Interactive 3-Stage Workflow (Operator Execution)
- **Stage 1 (Review)**: Comprehensive instruction details and safety requirements.
- **Stage 2 (Execution & SOP)**: Fullscreen embedded PDF SOP viewer with mandatory acknowledgment.
- **Stage 3 (Verification)**: Secure Exit Verification password required to complete the task.

### 2. QR Code Integration
- **Direct Scan Routing**: Navigate immediately to a machine's active instructions by scanning its unique QR code (e.g. `/employee/scan/CNC-01`).
- **Instant Recognition**: Automatically pulls all active instructions linked to that specific machine.

### 3. Administrator & Supervisor Portal
- **SOP Publisher**: Upload PDF guidelines, assign to specific Target Objects (Plants, Departments, Lines, Machines), and specify priorities.
- **Reporting & Compliance Log**: Complete history of who completed which instruction, when, and on which machine.
- **System Configurator**: Create, update, or remove plants, lines, departments, and machines. Manage exit verification credentials instantly.

---

## 💻 Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Lucide Icons, Vanilla CSS with HSL design variables.
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL (Neon DB).
- **ORM & Database**: Prisma ORM with connection pooling.
- **Authentication**: Stateless JSON Web Tokens (JWT) with secure Refresh Token rotation.

---

## 🔑 Demo Access Credentials

### 🔵 Administrator & Supervisor Portals
| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@unominda.com` | `admin123` |
| **Admin** | `admin@unominda.com` | `admin123` |
| **Supervisor** | `supervisor@unominda.com` | `supervisor123` |

### 🟢 Employee / Operator Portal
| Role | Email | Password |
| :--- | :--- | :--- |
| **Operator 1** | `employee@unominda.com` | `employee123` |
| **Operator 2** | `operator2@unominda.com` | `operator123` |

### 🔒 Default Exit Verification Password
- **Password**: `1234` *(Configurable per machine or instruction under settings)*

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### Installation
1. Clone the repository and install all dependencies:
   ```bash
   npm run install:all
   ```

2. Configure environments:
   - Create `backend/.env` containing:
     ```env
     PORT=5000
     DATABASE_URL="postgresql://..."
     JWT_SECRET="your_jwt_secret"
     REFRESH_SECRET="your_refresh_secret"
     ```

3. Spin up local development servers:
   ```bash
   npm run dev
   ```
   *This command runs the Next.js frontend, Express API server, and Git auto-sync watcher concurrently.*

---

## ⚡ Git Auto-Sync
This repository contains a background file watcher located at `scripts/auto-sync.js` which monitors the workspace and automatically commits and pushes your changes to GitHub dynamically with a 15-second debounce.

OUTPUT SCREEN:
<img width="730" height="469" alt="image" src="https://github.com/user-attachments/assets/0b663728-1bcf-47ba-8bf1-eea6ee2185ee" />
<img width="779" height="469" alt="image" src="https://github.com/user-attachments/assets/be93c03e-00c0-45b0-af92-bc050c9670f1" />
<img width="739" height="456" alt="image" src="https://github.com/user-attachments/assets/2e01e4ae-0a39-44b7-8f94-dcc3d136a663" />
<img width="764" height="461" alt="image" src="https://github.com/user-attachments/assets/5bb43cf7-6327-4c8b-a94f-276423df69d8" />

👨‍💻 Developed For-

UNO MINDA(INTERNSHIP PURPOSE)
Main Facility (Seating / Casting / Switch Division):Survey No. 209/2A2, 2B1, 2B2, 2C1Thalli Road, Mathagondapalli VillageHosur, Krishnagiri, Tamil Nadu, 635114
⭐ If you found this project useful, please give it a star on GitHub.

UNO MINDA – Machine Instruction & Compliance Management System

A modern ERP solution developed to improve industrial instruction handling, employee compliance monitoring, and operational efficiency.
