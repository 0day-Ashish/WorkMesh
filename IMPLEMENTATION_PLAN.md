# Implementation Plan - WorkMesh Backend API Modules

This plan outlines the design and implementation details for adding the remaining core backend API modules for the WorkMesh application: **Employees**, **Departments**, **Documents**, **Attendance**, **Holidays**, and **Leaves**. 

These APIs will enable collaboration with frontend and integration with the WorkMesh database.

---

## User Review Required

> [!IMPORTANT]
> **Authentication and RBAC**: All endpoints (except public reads or auth) will utilize `authMiddleware` to identify the user and `requireRole` to enforce Role-Based Access Control (RBAC). 
> - **Admin** endpoints: Require `admin` role.
> - **Employee** endpoints: Require `employee` or `admin` role.

> [!WARNING]
> **Leave Balance Deduction**: When an employee applies for leave (`POST /api/leave`), the application will check if the requested calendar duration exceeds the employee's remaining leave balance for that year. If it is valid, we will deduct the balance (`remaining` is decremented, `used` is incremented) immediately when the request is created.

---

## Open Questions
* **Leave Approval**: Do we need an endpoint for admins to approve/reject leaves? (The provided endpoint list only lists `PATCH /attendance/regularizations/:id/decision` for attendance regularizations, but not for leaves. We will implement `GET /api/leave/me` and `POST /api/leave` as requested, but let us know if leave decision endpoints are needed).
* **Document Upload Mocking**: We will write metadata to the database, expecting `doc_type` and `file_url` in the JSON request body, as there is no local file storage or AWS S3 integration implemented in the current repository.

---

## Proposed Changes

### Core Routing

#### [MODIFY] [app.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/app.ts)
- Mount the new routers under their respective paths:
  - `/api/employees` -> `createEmployeesRouter()`
  - `/api/departments` -> `createDepartmentsRouter()`
  - `/api/documents` -> `createDocumentsRouter()`
  - `/api/attendance` -> `createAttendanceRouter()`
  - `/api/holidays` -> `createHolidaysRouter()`
  - `/api/leave` -> `createLeaveRouter()`

---

### 1. Employees Module

#### [NEW] [employees.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/employees/employees.schema.ts)
Zod schemas for input validation:
- `createEmployeeSchema`: `{ employee_code: string, full_name?: string, designation?: string, phone?: string, address?: string, joining_date?: string, status?: 'active' | 'on_notice' | 'terminated', department_id?: string }`
- `updateEmployeeSchema`: Same fields as above, all optional.
- `patchMeSchema`: `{ full_name?: string, phone?: string, address?: string }` (only self-editable fields).

#### [NEW] [employees.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/employees/employees.controller.ts)
Controller class handling:
- `getMe`: Get profile of logged-in employee (`req.user.employee_id`).
- `patchMe`: Update own profile.
- `listEmployees`: Get all employees (Admin-only).
- `createEmployee`: Pre-provision an employee code (Admin-only).
- `getEmployeeById`: Get any employee by ID (Admin-only).
- `updateEmployee`: Update any employee by ID (Admin-only).

#### [NEW] [employees.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/employees/employees.routes.ts)
Wire endpoints to controller actions:
- `GET /me` (Employee/Admin)
- `PATCH /me` (Employee/Admin)
- `GET /` (Admin)
- `POST /` (Admin)
- `GET /:id` (Admin)
- `PUT /:id` (Admin)

---

### 2. Departments Module

#### [NEW] [departments.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/departments/departments.schema.ts)
Zod schemas:
- `createDepartmentSchema`: `{ name: string, manager_id?: string }`
- `updateDepartmentSchema`: `{ name?: string, manager_id?: string }`

#### [NEW] [departments.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/departments/departments.controller.ts)
Controller class:
- `listDepartments`: Return all departments.
- `createDepartment`: Create department. Check for name uniqueness.
- `updateDepartment`: Edit department (name, manager_id). Verify manager existence.
- `deleteDepartment`: Delete department.

#### [NEW] [departments.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/departments/departments.routes.ts)
- `GET /` (Admin)
- `POST /` (Admin)
- `PUT /:id` (Admin)
- `DELETE /:id` (Admin)

---

### 3. Documents Module

#### [NEW] [documents.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/documents/documents.schema.ts)
Zod schemas:
- `uploadDocumentSchema`: `{ doc_type: string, file_url: string }`

#### [NEW] [documents.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/documents/documents.controller.ts)
Controller class:
- `getOwnDocuments`: Get documents where `employee_id = req.user.employee_id`.
- `uploadOwnDocument`: Upload doc for self.
- `getEmployeeDocuments`: Get documents for a specific `employeeId`.
- `uploadEmployeeDocument`: Upload doc for a specific `employeeId`.

#### [NEW] [documents.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/documents/documents.routes.ts)
- `GET /me` (Employee/Admin)
- `POST /me` (Employee/Admin)
- `GET /:employeeId` (Admin)
- `POST /:employeeId` (Admin)

---

### 4. Attendance Module

#### [NEW] [attendance.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/attendance/attendance.schema.ts)
Zod schemas:
- `createRegularizationSchema`: `{ date: string, requested_check_in?: string, requested_check_out?: string, reason: string }`
- `decisionSchema`: `{ status: 'Approved' | 'Rejected' }`

#### [NEW] [attendance.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/attendance/attendance.controller.ts)
Controller class:
- `checkIn`: Check-in for today. Upsert/create attendance record for today.
- `checkOut`: Check-out for today. Update today's attendance record.
- `getOwnAttendance`: Get own logs.
- `listAllAttendance`: Get logs for all employees (filterable by date range/employee_id).
- `createRegularization`: Request attendance regularization.
- `getOwnRegularizations`: Get own regularization requests.
- `decideRegularization`: Approve/Reject regularization. If Approved, update/create corresponding Attendance log.

#### [NEW] [attendance.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/attendance/attendance.routes.ts)
- `POST /checkin` (Employee)
- `POST /checkout` (Employee)
- `GET /me` (Employee)
- `GET /` (Admin)
- `POST /regularizations` (Employee)
- `GET /regularizations` (Employee)
- `PATCH /regularizations/:id/decision` (Admin)

---

### 5. Holidays Module

#### [NEW] [holidays.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/holidays/holidays.schema.ts)
Zod schemas:
- `createHolidaySchema`: `{ date: string, name: string, region?: string }`

#### [NEW] [holidays.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/holidays/holidays.controller.ts)
Controller class:
- `listHolidays`: Fetch all holidays sorted by date.
- `createHoliday`: Create holiday record.

#### [NEW] [holidays.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/holidays/holidays.routes.ts)
- `GET /` (Public / Authenticated)
- `POST /` (Admin)

---

### 6. Leave Module

#### [NEW] [leave.schema.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/leave/leave.schema.ts)
Zod schemas:
- `createLeaveRequestSchema`: `{ leave_type: string, start_date: string, end_date: string, remarks?: string }`

#### [NEW] [leave.controller.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/leave/leave.controller.ts)
Controller class:
- `applyLeave`: Validate leave duration against `LeaveBalance` for the calendar year of `start_date`. Check if remaining >= duration. If yes, deduct from `LeaveBalance` (increment `used`, decrement `remaining`) and create the `LeaveRequest` with status `Pending`.
- `getOwnLeaves`: Fetch all leaves for the employee.

#### [NEW] [leave.routes.ts](file:///c:/Users/Garima/OneDrive/Desktop/WORKMESH/src/modules/leave/leave.routes.ts)
- `POST /` (Employee)
- `GET /me` (Employee)

---

## Verification Plan

### Automated Tests
We will add integration tests under `tests/` directory:
- `tests/employees.test.ts`
- `tests/departments.test.ts`
- `tests/documents.test.ts`
- `tests/attendance.test.ts`
- `tests/holidays.test.ts`
- `tests/leave.test.ts`

Run all tests via:
```bash
npm test
```

### Manual Verification
- Test using Postman/curl requests to verify:
  1. Success and validation error cases.
  2. Role checks (e.g. employee blocked from calling `/api/employees` list).
  3. Proper updates to database tables (attendance check-in/out, leave balance decrement).
