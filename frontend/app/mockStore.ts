"use client";

export type UserRole = "admin" | "employee";
export type EmploymentStatus = "active" | "on_notice" | "terminated";
export type AttendanceStatus = "Present" | "Absent" | "Leave" | "Half-day" | "Holiday";
export type RequestStatus = "Pending" | "Approved" | "Rejected";
export type LeaveType = "Casual" | "Sick" | "Earned";

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
}

export interface Employee {
  id: string; // e.g. EMP001
  email: string;
  fullName: string;
  designation: string;
  phone: string;
  address: string;
  departmentId: string;
  status: EmploymentStatus;
  role: UserRole;
  joinedDate: string;
  basicSalary: number;
  allowance: number;
  deductions: number;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:MM:SS
  checkOut: string | null; // HH:MM:SS
  status: AttendanceStatus;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  remarks: string;
  status: RequestStatus;
  adminComment?: string;
  appliedAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  Casual: { total: number; used: number };
  Sick: { total: number; used: number };
  Earned: { total: number; used: number };
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: RequestStatus;
  adminComment?: string;
  appliedAt: string;
}

// Initial Mock Data
const INITIAL_DEPARTMENTS: Department[] = [
  { id: "dept-eng", name: "Engineering", code: "ENG", managerId: "EMP002" },
  { id: "dept-hr", name: "Human Resources", code: "HR", managerId: "EMP001" },
  { id: "dept-mkt", name: "Marketing", code: "MKT", managerId: "EMP003" }
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    email: "jane@workmesh.com",
    fullName: "Jane Doe",
    designation: "HR Director",
    phone: "+1 (555) 019-2834",
    address: "742 Evergreen Terrace, Springfield",
    departmentId: "dept-hr",
    status: "active",
    role: "admin",
    joinedDate: "2024-01-15",
    basicSalary: 8500,
    allowance: 1200,
    deductions: 600,
  },
  {
    id: "EMP002",
    email: "john@workmesh.com",
    fullName: "John Smith",
    designation: "Lead Engineer",
    phone: "+1 (555) 014-9988",
    address: "123 Maple Street, Riverdale",
    departmentId: "dept-eng",
    status: "active",
    role: "employee",
    joinedDate: "2024-03-10",
    basicSalary: 9500,
    allowance: 1500,
    deductions: 800,
  },
  {
    id: "EMP003",
    email: "sarah@workmesh.com",
    fullName: "Sarah Jenkins",
    designation: "Marketing Specialist",
    phone: "+1 (555) 017-4455",
    address: "456 Oak Avenue, Metropolis",
    departmentId: "dept-mkt",
    status: "active",
    role: "employee",
    joinedDate: "2024-08-01",
    basicSalary: 6200,
    allowance: 800,
    deductions: 450,
  },
  {
    id: "EMP004",
    email: "robert@workmesh.com",
    fullName: "Robert Chen",
    designation: "Frontend Engineer",
    phone: "+1 (555) 012-7766",
    address: "890 Pine Lane, Gotham",
    departmentId: "dept-eng",
    status: "on_notice",
    role: "employee",
    joinedDate: "2025-02-20",
    basicSalary: 7000,
    allowance: 1000,
    deductions: 500,
  },
  // Unclaimed profile for registration testing
  {
    id: "EMP005",
    email: "", // Empty means unclaimed
    fullName: "Emily Watson",
    designation: "Product Designer",
    phone: "+1 (555) 018-1122",
    address: "321 Elm St, Coast City",
    departmentId: "dept-eng",
    status: "active",
    role: "employee",
    joinedDate: "2026-07-01",
    basicSalary: 6500,
    allowance: 900,
    deductions: 400,
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // John's attendance
  { id: "att-1", employeeId: "EMP002", date: "2026-07-01", checkIn: "08:58:12", checkOut: "17:35:44", status: "Present" },
  { id: "att-2", employeeId: "EMP002", date: "2026-07-02", checkIn: "09:05:22", checkOut: "18:02:15", status: "Present" },
  { id: "att-3", employeeId: "EMP002", date: "2026-07-03", checkIn: "09:12:00", checkOut: "13:00:00", status: "Half-day" },
  // Sarah's attendance
  { id: "att-4", employeeId: "EMP003", date: "2026-07-01", checkIn: "09:30:15", checkOut: "18:15:30", status: "Present" },
  { id: "att-5", employeeId: "EMP003", date: "2026-07-02", checkIn: null, checkOut: null, status: "Leave" },
  { id: "att-6", employeeId: "EMP003", date: "2026-07-03", checkIn: "09:02:11", checkOut: "17:45:00", status: "Present" },
];

const INITIAL_LEAVE_BALANCES: LeaveBalance[] = [
  { employeeId: "EMP001", Casual: { total: 12, used: 2 }, Sick: { total: 10, used: 1 }, Earned: { total: 15, used: 0 } },
  { employeeId: "EMP002", Casual: { total: 12, used: 4 }, Sick: { total: 10, used: 2 }, Earned: { total: 15, used: 5 } },
  { employeeId: "EMP003", Casual: { total: 12, used: 1 }, Sick: { total: 10, used: 4 }, Earned: { total: 15, used: 2 } },
  { employeeId: "EMP004", Casual: { total: 12, used: 6 }, Sick: { total: 10, used: 0 }, Earned: { total: 15, used: 0 } },
  { employeeId: "EMP005", Casual: { total: 12, used: 0 }, Sick: { total: 10, used: 0 }, Earned: { total: 15, used: 0 } },
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "lv-1",
    employeeId: "EMP002",
    leaveType: "Casual",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    remarks: "Family trip",
    status: "Approved",
    adminComment: "Enjoy your trip!",
    appliedAt: "2026-06-01"
  },
  {
    id: "lv-2",
    employeeId: "EMP003",
    leaveType: "Sick",
    startDate: "2026-07-02",
    endDate: "2026-07-02",
    remarks: "Doctor appointment & rest",
    status: "Approved",
    adminComment: "Get well soon",
    appliedAt: "2026-07-01"
  },
  {
    id: "lv-3",
    employeeId: "EMP002",
    leaveType: "Earned",
    startDate: "2026-07-15",
    endDate: "2026-07-22",
    remarks: "Summer vacation plans",
    status: "Pending",
    appliedAt: "2026-07-03"
  }
];

const INITIAL_REGULARIZATIONS: RegularizationRequest[] = [
  {
    id: "reg-1",
    employeeId: "EMP002",
    date: "2026-06-25",
    requestedCheckIn: "09:00:00",
    requestedCheckOut: "18:00:00",
    reason: "Forgot to punch in due to early project meeting",
    status: "Pending",
    appliedAt: "2026-07-02"
  }
];

const STORAGE_KEYS = {
  EMPLOYEES: "wm_employees",
  DEPARTMENTS: "wm_departments",
  ATTENDANCE: "wm_attendance",
  LEAVES: "wm_leaves",
  BALANCES: "wm_balances",
  REGULARIZATIONS: "wm_regularizations",
  AUTH_USER: "wm_auth_user",
  USER_ACCOUNTS: "wm_user_accounts"
};

// Simple email -> password store for auth simulation
const INITIAL_ACCOUNTS = {
  "jane@workmesh.com": "password123",
  "john@workmesh.com": "password123",
  "sarah@workmesh.com": "password123",
  "robert@workmesh.com": "password123"
};

class MockStore {
  private isBrowser = typeof window !== "undefined";

  private get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) return fallback;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  }

  private set<T>(key: string, val: T): void {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }

  resetStore(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.LEAVES);
    localStorage.removeItem(STORAGE_KEYS.BALANCES);
    localStorage.removeItem(STORAGE_KEYS.REGULARIZATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_ACCOUNTS);
    // Reload page to re-initialize
    window.location.reload();
  }

  // --- Auth API ---
  getAuthUser(): Employee | null {
    // Note: John Smith is default if nothing is selected
    return this.get<Employee | null>(STORAGE_KEYS.AUTH_USER, INITIAL_EMPLOYEES[1]); 
  }

  setAuthUser(emp: Employee | null): void {
    this.set(STORAGE_KEYS.AUTH_USER, emp);
  }

  getAccounts() {
    return this.get<Record<string, string>>(STORAGE_KEYS.USER_ACCOUNTS, INITIAL_ACCOUNTS);
  }

  login(email: string, pass: string): Employee | string {
    const employees = this.getEmployees();
    const accounts = this.getAccounts();
    const emp = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (!emp) return "Invalid email address";
    if (accounts[emp.email.toLowerCase()] !== pass) return "Incorrect password";
    if (emp.status === "terminated") return "This account has been deactivated";
    this.setAuthUser(emp);
    return emp;
  }

  signup(employeeCode: string, email: string, pass: string): Employee | string {
    const employees = this.getEmployees();
    const accounts = this.getAccounts();

    // Check code
    const index = employees.findIndex(e => e.id.toUpperCase() === employeeCode.toUpperCase());
    if (index === -1) {
      return "Employee code not recognized. Please consult HR.";
    }

    const emp = employees[index];
    if (emp.email) {
      return "This employee code has already been registered.";
    }

    // Check if email already in use
    const emailExists = employees.some(e => e.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return "Email address is already registered.";
    }

    // Update employee profile
    emp.email = email.toLowerCase();
    employees[index] = emp;
    this.set(STORAGE_KEYS.EMPLOYEES, employees);

    // Save login credentials
    accounts[email.toLowerCase()] = pass;
    this.set(STORAGE_KEYS.USER_ACCOUNTS, accounts);

    // Set logged-in
    this.setAuthUser(emp);
    return emp;
  }

  logout(): void {
    this.setAuthUser(null);
  }

  // --- Employees API ---
  getEmployees(): Employee[] {
    return this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  }

  saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index > -1) {
      employees[index] = employee;
    } else {
      employees.push(employee);
      // Create a leave balance for new employee
      const balances = this.getLeaveBalances();
      balances.push({
        employeeId: employee.id,
        Casual: { total: 12, used: 0 },
        Sick: { total: 10, used: 0 },
        Earned: { total: 15, used: 0 }
      });
      this.set(STORAGE_KEYS.BALANCES, balances);
    }
    this.set(STORAGE_KEYS.EMPLOYEES, employees);

    // Update active auth user if edited self
    const cur = this.getAuthUser();
    if (cur && cur.id === employee.id) {
      this.setAuthUser(employee);
    }
  }

  // --- Departments API ---
  getDepartments(): Department[] {
    return this.get<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  saveDepartment(dept: Department): void {
    const depts = this.getDepartments();
    const index = depts.findIndex(d => d.id === dept.id);
    if (index > -1) {
      depts[index] = dept;
    } else {
      depts.push(dept);
    }
    this.set(STORAGE_KEYS.DEPARTMENTS, depts);
  }

  deleteDepartment(id: string): void {
    const depts = this.getDepartments();
    this.set(STORAGE_KEYS.DEPARTMENTS, depts.filter(d => d.id !== id));
  }

  // --- Attendance API ---
  getAttendance(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  checkIn(employeeId: string): AttendanceRecord {
    const records = this.getAttendance();
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0]; // HH:MM:SS

    // Check if already checked in
    const existing = records.find(r => r.employeeId === employeeId && r.date === today);
    if (existing) {
      if (!existing.checkIn) {
        existing.checkIn = nowTime;
        existing.status = "Present";
      }
      this.set(STORAGE_KEYS.ATTENDANCE, records);
      return existing;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      date: today,
      checkIn: nowTime,
      checkOut: null,
      status: "Present"
    };
    records.push(newRecord);
    this.set(STORAGE_KEYS.ATTENDANCE, records);
    return newRecord;
  }

  checkOut(employeeId: string): AttendanceRecord | null {
    const records = this.getAttendance();
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];

    const record = records.find(r => r.employeeId === employeeId && r.date === today);
    if (!record) return null;

    record.checkOut = nowTime;
    this.set(STORAGE_KEYS.ATTENDANCE, records);
    return record;
  }

  // --- Leaves API ---
  getLeaveRequests(): LeaveRequest[] {
    return this.get<LeaveRequest[]>(STORAGE_KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
  }

  getLeaveBalances(): LeaveBalance[] {
    return this.get<LeaveBalance[]>(STORAGE_KEYS.BALANCES, INITIAL_LEAVE_BALANCES);
  }

  applyLeave(req: Omit<LeaveRequest, "id" | "status" | "appliedAt">): LeaveRequest | string {
    const requests = this.getLeaveRequests();
    const balances = this.getLeaveBalances();

    // Check leave balance
    const userBalance = balances.find(b => b.employeeId === req.employeeId);
    if (!userBalance) return "Leave balance records not found.";

    const type = req.leaveType;
    const balanceInfo = userBalance[type];

    // Calc days (inclusive)
    const d1 = new Date(req.startDate);
    const d2 = new Date(req.endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const remaining = balanceInfo.total - balanceInfo.used;
    if (diffDays > remaining) {
      return `Insufficient leave balance. Requesting ${diffDays} days, but only ${remaining} days available.`;
    }

    const newRequest: LeaveRequest = {
      ...req,
      id: `lv-${Date.now()}`,
      status: "Pending",
      appliedAt: new Date().toISOString().split("T")[0]
    };

    requests.push(newRequest);
    this.set(STORAGE_KEYS.LEAVES, requests);
    return newRequest;
  }

  updateLeaveStatus(reqId: string, status: RequestStatus, comment?: string): void {
    const requests = this.getLeaveRequests();
    const index = requests.findIndex(r => r.id === reqId);
    if (index === -1) return;

    const req = requests[index];
    req.status = status;
    req.adminComment = comment;
    requests[index] = req;
    this.set(STORAGE_KEYS.LEAVES, requests);

    // If approved, decrement balance
    if (status === "Approved") {
      const balances = this.getLeaveBalances();
      const userBalanceIndex = balances.findIndex(b => b.employeeId === req.employeeId);
      if (userBalanceIndex > -1) {
        const balance = balances[userBalanceIndex];
        const d1 = new Date(req.startDate);
        const d2 = new Date(req.endDate);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        balance[req.leaveType].used += diffDays;
        balances[userBalanceIndex] = balance;
        this.set(STORAGE_KEYS.BALANCES, balances);

        // Also add attendance rows marked as "Leave" for those days
        const attendance = this.getAttendance();
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split("T")[0];
          // Check if record exists
          const exists = attendance.some(a => a.employeeId === req.employeeId && a.date === dateStr);
          if (!exists) {
            attendance.push({
              id: `att-lv-${Date.now()}-${dateStr}`,
              employeeId: req.employeeId,
              date: dateStr,
              checkIn: null,
              checkOut: null,
              status: "Leave"
            });
          }
        }
        this.set(STORAGE_KEYS.ATTENDANCE, attendance);
      }
    }
  }

  // --- Regularizations API ---
  getRegularizations(): RegularizationRequest[] {
    return this.get<RegularizationRequest[]>(STORAGE_KEYS.REGULARIZATIONS, INITIAL_REGULARIZATIONS);
  }

  applyRegularization(req: Omit<RegularizationRequest, "id" | "status" | "appliedAt">): RegularizationRequest {
    const requests = this.getRegularizations();
    const newRequest: RegularizationRequest = {
      ...req,
      id: `reg-${Date.now()}`,
      status: "Pending",
      appliedAt: new Date().toISOString().split("T")[0]
    };
    requests.push(newRequest);
    this.set(STORAGE_KEYS.REGULARIZATIONS, requests);
    return newRequest;
  }

  updateRegularizationStatus(reqId: string, status: RequestStatus, comment?: string): void {
    const requests = this.getRegularizations();
    const index = requests.findIndex(r => r.id === reqId);
    if (index === -1) return;

    const req = requests[index];
    req.status = status;
    req.adminComment = comment;
    requests[index] = req;
    this.set(STORAGE_KEYS.REGULARIZATIONS, requests);

    // If approved, update attendance record
    if (status === "Approved") {
      const attendance = this.getAttendance();
      const existingIndex = attendance.findIndex(a => a.employeeId === req.employeeId && a.date === req.date);
      if (existingIndex > -1) {
        attendance[existingIndex].checkIn = req.requestedCheckIn;
        attendance[existingIndex].checkOut = req.requestedCheckOut;
        attendance[existingIndex].status = "Present";
      } else {
        attendance.push({
          id: `att-reg-${Date.now()}`,
          employeeId: req.employeeId,
          date: req.date,
          checkIn: req.requestedCheckIn,
          checkOut: req.requestedCheckOut,
          status: "Present"
        });
      }
      this.set(STORAGE_KEYS.ATTENDANCE, attendance);
    }
  }
}

export const mockStore = new MockStore();
