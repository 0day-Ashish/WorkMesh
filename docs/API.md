# WorkMesh API Reference

Base URL: `http://localhost:3000` (see `PORT` in `.env`)

All API routes are prefixed with `/api`.

---

## Authentication

Protected routes require:

```
Authorization: Bearer <accessToken>
```

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access token | 15 minutes | JWT; use on every authenticated request |
| Refresh token | 7 days | Opaque string; store securely; rotate on refresh |

### Error format

```json
{ "message": "Human-readable error message" }
```

Validation errors (400) may include a `errors` array with field details.

---

## Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/signup` | Public | Claim a pre-issued employee code with email + password |
| GET | `/verify-email` | Public | Confirm email via `?token=` query param |
| POST | `/signin` | Public | Login; returns access + refresh tokens |
| POST | `/refresh` | Public | Exchange refresh token for new token pair |
| POST | `/logout` | Public | Revoke refresh token |
| POST | `/forgot-password` | Public | Send password-reset link to email |
| POST | `/reset-password` | Public | Set new password with reset token |
| POST | `/resend-verification` | Public | Resend email verification link |

### POST `/api/auth/signup`

```json
{
  "employee_code": "EMP002",
  "email": "new.hire@workmesh.com",
  "password": "SecurePass123!"
}
```

**Password rules:** min 8 chars, uppercase, lowercase, number, special char (`@$!%*?&#`).

**201**
```json
{ "message": "Registration successful. Please check your email to verify your account." }
```

### GET `/api/auth/verify-email?token=<jwt>`

**200**
```json
{ "message": "Email verified successfully. You can now sign in." }
```

### POST `/api/auth/signin`

```json
{
  "email": "employee@workmesh.com",
  "password": "EmployeePassword123!"
}
```

**200**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "a1b2c3..."
}
```

### POST `/api/auth/refresh`

```json
{ "refreshToken": "a1b2c3..." }
```

**200** — same shape as signin (new access + refresh tokens).

### POST `/api/auth/logout`

```json
{ "refreshToken": "a1b2c3..." }
```

**200**
```json
{ "message": "Logged out successfully." }
```

### POST `/api/auth/forgot-password`

```json
{ "email": "user@workmesh.com" }
```

**200** — always returns success (anti-enumeration).

### POST `/api/auth/reset-password`

```json
{
  "token": "<reset-token-from-email>",
  "password": "NewSecurePass123!"
}
```

**200**
```json
{ "message": "Password reset successfully. You can now sign in with your new password." }
```

---

## Employees — `/api/employees`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Employee, Admin | View own profile |
| PATCH | `/me` | Employee, Admin | Edit own profile (limited fields) |
| GET | `/` | Admin | List all employees |
| POST | `/` | Admin | Pre-provision a new employee code |
| GET | `/:id` | Admin | View any employee record |
| PUT | `/:id` | Admin | Edit any employee (incl. status) |

### PATCH `/api/employees/me`

```json
{
  "full_name": "John Doe",
  "phone": "+15550123",
  "address": "123 Main St"
}
```

### POST `/api/employees` (Admin)

```json
{
  "employee_code": "EMP004",
  "full_name": "Alice Johnson",
  "designation": "Software Engineer",
  "phone": "+15550456",
  "address": "789 Oak Ave",
  "joining_date": "2026-08-01",
  "status": "active",
  "department_id": "<uuid>"
}
```

**`status` values:** `active` | `on_notice` | `terminated`

### PUT `/api/employees/:id` (Admin)

Same fields as create; all optional.

---

## Departments — `/api/departments`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Admin | List departments |
| POST | `/` | Admin | Create department |
| PUT | `/:id` | Admin | Update department |
| DELETE | `/:id` | Admin | Delete department |

### POST `/api/departments`

```json
{
  "name": "Marketing",
  "manager_id": "<employee-uuid-or-null>"
}
```

---

## Documents — `/api/documents`

Documents are stored as metadata (type + URL). No multipart upload on the server.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/me` | Employee, Admin | List own documents |
| POST | `/me` | Employee, Admin | Upload own document |
| GET | `/:employeeId` | Admin | List documents for an employee |
| POST | `/:employeeId` | Admin | Upload document for an employee |

### POST body (upload)

```json
{
  "doc_type": "ID Proof",
  "file_url": "https://storage.example.com/docs/id-proof.pdf"
}
```

---

## Attendance — `/api/attendance`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/checkin` | Employee | Record today's check-in |
| POST | `/checkout` | Employee | Record today's check-out |
| GET | `/me` | Employee | Own attendance history |
| GET | `/` | Admin | All attendance (filterable) |
| POST | `/regularizations` | Employee | File a correction request |
| GET | `/regularizations` | Employee | View own correction requests |
| PATCH | `/regularizations/:id/decision` | Admin | Approve or reject request |

### GET `/api/attendance` (Admin query params)

| Param | Type | Description |
|-------|------|-------------|
| `employee_id` | UUID | Filter by employee |
| `startDate` | ISO date | From date |
| `endDate` | ISO date | To date |

### POST `/api/attendance/regularizations`

```json
{
  "date": "2026-07-01",
  "requested_check_in": "2026-07-01T09:00:00.000Z",
  "requested_check_out": "2026-07-01T18:00:00.000Z",
  "reason": "Forgot to check in"
}
```

### PATCH `/api/attendance/regularizations/:id/decision`

```json
{ "status": "Approved" }
```

**`status` values:** `Approved` | `Rejected`

---

## Holidays — `/api/holidays`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List holiday calendar |
| POST | `/` | Admin | Add a holiday |

### POST `/api/holidays`

```json
{
  "date": "2026-12-25",
  "name": "Christmas",
  "region": "National"
}
```

---

## Leave — `/api/leave`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Employee | Apply for leave |
| GET | `/me` | Employee | Own leave request history |

### POST `/api/leave`

```json
{
  "leave_type": "Sick",
  "start_date": "2026-07-10",
  "end_date": "2026-07-12",
  "remarks": "Medical appointment"
}
```

Rejected server-side if remaining balance is insufficient. Balance is deducted when the request is created (status `Pending`).

**Leave request `status` values:** `Pending` | `Approved` | `Rejected`

---

## Health check

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/health` | Public |

**200**
```json
{ "status": "OK", "timestamp": "2026-07-04T08:15:00.000Z" }
```

---

## Seed data (local dev)

After `npm run db:migrate` and `npm run db:seed`:

| Role | Email | Password | Employee code |
|------|-------|----------|---------------|
| Admin | `admin@workmesh.com` | `AdminPassword123!` | `ADM001` |
| Employee | `employee@workmesh.com` | `EmployeePassword123!` | `EMP001` |
| Unclaimed | — | — | `EMP002`, `EMP003` |

---

## Quick start for frontend teammates

```bash
# 1. Install & configure
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed

# 2. Start server
npm run dev

# 3. Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@workmesh.com","password":"EmployeePassword123!"}'

# 4. Use access token
curl http://localhost:3000/api/employees/me \
  -H "Authorization: Bearer <accessToken>"
```

---

## Rate limits

| Scope | Limit |
|-------|-------|
| General `/api/*` | 100 requests / 15 min per IP |
| Auth-sensitive routes (signup, signin, forgot/reset password, resend verification) | 10 requests / 15 min per IP |

Disabled when `NODE_ENV=test`.
