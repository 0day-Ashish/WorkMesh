# WorkMesh - Unified HR & Operations Portal

![WorkMesh Console Preview](frontend/public/assets/image.png)

WorkMesh is a premium, secure, and unified Human Resource Management & Operations platform designed for modern teams. It integrates shift punch consoles, daily attendance logs, regularization workflows, leave balance trackers, digital payroll slips, and document compliance vaults into a single cohesive system.

---

## 🏗️ Architecture & System Workflow

WorkMesh follows a decoupled architecture, joining a high-fidelity client portal with a secure, rate-limited REST API.

```mermaid
graph TD
    User([Employee / Admin]) -->|Interacts| FE[Next.js Frontend]
    FE -->|REST API requests + JWT Auth| BE[Express Backend]
    FE -->|Secured Chat queries| Groq[Groq API: Llama-3.3]
    BE -->|ORM Operations| Prisma[Prisma Client]
    Prisma -->|Queries & Updates| DB[(PostgreSQL Database)]

    subgraph FE_App [Frontend Portal]
        FE
        Lenis[Lenis Smooth Scroll]
        Chat[Chatbot Widget]
    end

    subgraph BE_App [Backend API Service]
        BE
        Auth[Auth Middleware]
        Leave[Leave Service]
        Payroll[Payroll Service]
        Attend[Attendance Service]
    end
```

---

## 📂 Folder Structure

```text
WorkMesh/
├── frontend/                  # Next.js Frontend Application
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/          # Groq Cloud API Proxy Endpoint
│   │   ├── components/        # UI View Components
│   │   │   ├── ChatbotWidget  # Floating Round AI Chatbot Widget
│   │   │   ├── LenisProvider  # Smooth Scroll Manager
│   │   │   ├── landing-page   # Landing Page
│   │   │   ├── dashboard-view # Main Employee Console
│   │   │   └── auth-views     # Login & Registration Forms
│   │   ├── globals.css        # Global CSS with Neobrutalism theme
│   │   └── layout.tsx         # Root Layout
│   └── package.json           # Frontend package configurations
├── prisma/                    # Database Migrations & Seeds
│   ├── schema.prisma          # Database Entity Schema
│   └── seed.ts                # Database Seeder file
├── src/                       # Express Backend Application
│   ├── modules/               # Domain-specific backend modules
│   │   ├── attendance/        # Attendance Logs & Regularizations
│   │   ├── auth/              # JWT Auth & Password Recovery
│   │   ├── leave/             # Leave Requests & Accrual Balances
│   │   └── payroll/           # Payroll Processing & Payslip downloads
│   ├── middlewares/           # Auth Guards & Security Headers
│   ├── server.ts              # Express Server entrypoint
│   └── app.ts                 # Express Configurations
├── package.json               # Backend package configurations
└── README.md                  # Project Documentation
```

---

## 🚀 Setup & Execution Guide

Follow these steps to set up and run both services locally.

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **PostgreSQL Database**: Running locally or hosted on AWS RDS / Render

### 1. Database Setup

WorkMesh supports local PostgreSQL instances as well as deployed, managed instances like **AWS RDS**.

#### Option A: AWS RDS PostgreSQL Setup (Recommended for deployments)
1. Provision a PostgreSQL instance on AWS RDS.
2. Configure the database security group to accept inbound traffic from your application server IPs (or `0.0.0.0/0` for initial configuration testing).
3. Update the `DATABASE_URL` environment variable inside your root `.env` file to use the RDS endpoint:
   ```env
   DATABASE_URL="postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/workmesh?schema=public"
   ```
4. Synchronize the database schema directly to your AWS RDS instance:
   ```bash
   npx prisma db push --accept-data-loss
   ```
5. Seed initial data (creates Admin & Employee test profiles, and default leave entitlements):
   ```bash
   npx prisma db seed
   ```

#### Option B: Local PostgreSQL Setup
1. Ensure a PostgreSQL server is running locally on your machine.
2. Copy `.env.example` to `.env` in the root folder, configure the `DATABASE_URL` with your local database credentials, and run migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

### 2. Run Backend Server
From the project root directory:
```bash
# Install dependencies
npm install

# Start Express backend (Running on port 5001)
npm run dev
```

### 3. Run Frontend Portal
From the `frontend` directory:
```bash
cd frontend

# Create .env.local and add GROQ_API key
echo "GROQ_API=your_groq_key_here" > .env.local

# Install dependencies
npm install

# Start Next.js frontend (Running on http://localhost:3000)
npm run dev
```

---

## 🔑 Demo Accounts & Credentials

Use the following seeded accounts to log in and test different system roles:

### 👤 Admin Persona
*   **Email**: `admin@workmesh.com`
*   **Password**: `AdminPassword123!`
*   *Access privileges: Manage departments, review leave balances, decide regularization adjustments.*

### 👤 Employee Persona
*   **Email**: `employee@workmesh.com`
*   **Password**: `EmployeePassword123!`
*   *Access privileges: Check in/out punch console, submit leave requests, view payroll compensation ledger.*

### 🆕 Signup Sandbox Codes
To test registering a new employee profile from scratch, use one of the following unclaimed employee codes during registration:
*   `EMP002`
*   `EMP003`

---

## 🛡️ Core Security Implementations

* **JWT Token Family Rotation**: Automated token lifecycle checks block unauthorized administrative transactions.
* **Path Traversal Mitigation**: File controllers strictly validate file pathways to protect systems from directory traversal vulnerabilities.
* **Dynamic AI Scope Guardrails**: The Groq API endpoint enforces a strict system prompt restricting Llama 3.3 to answer product-specific and HR platform queries only, politely refusing off-topic requests.
