# Implemented Features - Auth, RBAC & Security for WorkMesh

This document tracks the complete list of authentication, role-based access control, and security features implemented for the **WorkMesh** backend application.

---

## 1. Directory Structure

```
WorkMesh/
├── prisma/
│   ├── schema.prisma   # PostgreSQL database schema & constraints
│   └── seed.ts         # Initial database seeding script (Admin, Employee, Unclaimed Codes)
├── src/
│   ├── config/
│   │   └── db.ts       # Centralized Prisma Client instance
│   ├── middlewares/
│   │   ├── authMiddleware.ts      # Stateless JWT Access Token validation guard
│   │   ├── errorHandler.ts        # Centralized Express error handler (JSON formatted)
│   │   ├── roleMiddleware.ts      # RBAC Route guard (Admin / Employee gating)
│   │   └── validateMiddleware.ts  # Zod schema validation interceptor
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.controller.ts # REST API route handlers
│   │       ├── auth.routes.ts     # Route definitions mapped under /api/auth
│   │       ├── auth.schema.ts     # Zod validation schemas with transformations
│   │       └── auth.service.ts    # Hashing, token rotation, and email services
│   ├── app.ts          # Express App configuration (CORS, Helmet, Rate Limiter)
│   └── server.ts       # App entry point with graceful shutdown listeners
├── tests/
│   └── auth.test.ts    # Jest + Supertest suites (26 test cases)
├── .env                # Local secrets configuration (Git ignored)
├── .env.example        # Secrets template
├── .gitignore          # Repository gitignore policies
├── docker-compose.yml  # Local PostgreSQL database container configuration
├── jest.config.js      # Jest configuration
├── jest.setup.js       # Test environment setup (sets NODE_ENV=test)
└── tsconfig.json       # TypeScript options
```

---

## 2. API Endpoints

All endpoints are prefixed with `/api/auth` and communicate exclusively in JSON payloads.

| Endpoint | Method | Rate Limit | Authorization | Payload | Success Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/signup` | `POST` | 10 req / 15m | Public | `{ employee_code, email, password }` | `201 Created` with success message |
| `/verify-email` | `GET` | Unlimited | Public | Query param: `?token=<jwt>` | `200 OK` with verified message |
| `/resend-verification`| `POST` | 10 req / 15m | Public | `{ email }` | `200 OK` with success message |
| `/signin` | `POST` | 10 req / 15m | Public | `{ email, password }` | `200 OK` with access + refresh token |
| `/refresh` | `POST` | Unlimited | Public | `{ refreshToken }` | `200 OK` with new access + refresh token |
| `/logout` | `POST` | Unlimited | Public | `{ refreshToken }` | `200 OK` with logged out message |
| `/forgot-password`| `POST` | 10 req / 15m | Public | `{ email }` | `200 OK` with success message |
| `/reset-password` | `POST` | 10 req / 15m | Public | `{ token, password }` | `200 OK` with reset message |

---

## 3. Database Schema Specifications

*   **Users Table (`users`)**:
    *   Stateless representation of accounts.
    *   Composite relation to `Employee` via `employee_id` (Unique, Nullable).
    *   Primary fields: `email` (Unique, Lowercase), `password_hash`, `role` (`admin` / `employee`), `email_verified` (Boolean).
*   **Refresh Tokens Table (`refresh_tokens`)**:
    *   Hashed refresh token values stored securely (`SHA-256`).
    *   Includes `expires_at` and `revoked_at` (Nullable) columns.
    *   Cascades deletion upon parent user removal.
    *   Index on `user_id` for fast invalidation lookups.
*   **Password Resets Table (`password_resets`)**:
    *   One-time use password reset token hashes (`SHA-256`).
    *   Auto-deletes old tokens on new request generation.
    *   Index on `user_id` for cleanup.

---

## 4. Key Security Implementations

*   **Strict Role-Based Access Control**:
    *   Access Token JWT holds user payload: `{ id, email, role, employee_id }`.
    *   Middlewares extract tokens via `Authorization: Bearer <token>` and block unauthorized scopes with `401 Unauthorized` or `403 Forbidden` JSON codes.
*   **Token Rotation & Reuse Detection**:
    *   Refresh tokens rotate upon every `/refresh` exchange (the old one is revoked, and a new pair is issued).
    *   Reusing a revoked token triggers **Token Family Invalidation**, immediately revoking all active sessions for that user as a theft countermeasure.
*   **Token Isolation**:
    *   Verification tokens are signed using a different secret key than access tokens to prevent privilege swap vulnerabilities.
*   **Rate Limiting & Throttling**:
    *   API routes are secured with `express-rate-limit`. Sensitive endpoints (signup, signin, password resets) are restricted to 10 requests per 15 minutes.
*   **Security Headers & Parsers**:
    *   Integrated `helmet` for XSS protection, content-type sniffing protection, and clickjacking defense.
    *   Disabled `X-Powered-By` header to restrict backend technology fingerprinting.
    *   Applied a `10kb` body payload size limit to prevent memory flooding (DoS).
*   **Password Policies**:
    *   Passwords are encrypted using **12 rounds of bcrypt**.
    *   Signup and password resets enforce strict password requirements (min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol).
*   **Account Deactivation / Offboarding**:
    *   Terminated employees (`status: 'terminated'`) are immediately blocked from logging in or claiming codes.
*   **Anti-Account Enumeration**:
    *   Forgot-password and resend-verification endpoints return generic success messages even if the email does not exist in the database, protecting user privacy.
*   **Email Normalization**:
    *   Emails are stripped of leading/trailing whitespace and lowercased during schema validation and database checks to block duplicate account tricks.
*   **Centralized Error Mapping**:
    *   Standardizes database constraints (Prisma duplicate keys), validation errors (Zod structures), and custom app errors into a clean, unified payload: `{ message: "..." }` or `{ errors: [{ field: "...", message: "..." }] }`.
*   **Graceful Shutdown**:
    *   Monitors `SIGTERM` and `SIGINT` signals to close the server and release Prisma database pools properly.
