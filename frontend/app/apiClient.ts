// WorkMesh API Client with JWT Auth & Token Refresh Handling
"use client";

const API_BASE_URL = "http://localhost:5001/api";

export interface DecodedToken {
  id: string; // User ID
  email: string;
  role: "admin" | "employee";
  employee_id: string | null;
  exp: number;
}

// Local storage keys
const ACCESS_TOKEN_KEY = "workmesh_access_token";
const REFRESH_TOKEN_KEY = "workmesh_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Decode JWT helper
export function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function getLoggedInUserRole(): "admin" | "employee" | null {
  const token = getAccessToken();
  if (!token) return null;
  const decoded = parseJwt(token);
  return decoded ? decoded.role : null;
}

// Unified request handler
async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set headers
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  options.headers = headers;

  let response = await fetch(url, options);

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        // Refresh token
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const tokens = await refreshResponse.json();
          setTokens(tokens.accessToken, tokens.refreshToken);
          
          // Retry original request with new access token
          headers.set("Authorization", `Bearer ${tokens.accessToken}`);
          options.headers = headers;
          response = await fetch(url, options);
        } else {
          // Refresh failed
          clearTokens();
          if (typeof window !== "undefined") {
            window.location.reload(); // Re-trigger sign-in screen
          }
        }
      } catch (err) {
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Return empty object for 204 or empty responses
  if (response.status === 204) return {};
  
  return response.json();
}

// API methods
export const apiClient = {
  auth: {
    signin: async (data: any) => {
      const res = await request("/auth/signin", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setTokens(res.accessToken, res.refreshToken);
      return res;
    },
    signup: async (data: any) => {
      return request("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    logout: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await request("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
      clearTokens();
    },
    forgotPassword: async (email: string) => {
      return request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    resetPassword: async (data: any) => {
      return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
  employees: {
    getMe: async () => {
      return request("/employees/me");
    },
    patchMe: async (data: any) => {
      return request("/employees/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    list: async () => {
      return request("/employees");
    },
    create: async (data: any) => {
      return request("/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    get: async (id: string) => {
      return request(`/employees/${id}`);
    },
    update: async (id: string, data: any) => {
      return request(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },
  departments: {
    list: async () => {
      return request("/departments");
    },
    create: async (data: any) => {
      return request("/departments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return request(`/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request(`/departments/${id}`, {
        method: "DELETE",
      });
    },
  },
  attendance: {
    checkin: async () => {
      return request("/attendance/checkin", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    checkout: async () => {
      return request("/attendance/checkout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    getMe: async () => {
      return request("/attendance/me");
    },
    list: async (params?: { employee_id?: string; startDate?: string; endDate?: string }) => {
      let query = "";
      if (params) {
        const parts = [];
        if (params.employee_id) parts.push(`employee_id=${params.employee_id}`);
        if (params.startDate) parts.push(`startDate=${params.startDate}`);
        if (params.endDate) parts.push(`endDate=${params.endDate}`);
        if (parts.length > 0) query = `?${parts.join("&")}`;
      }
      return request(`/attendance${query}`);
    },
    createRegularization: async (data: any) => {
      return request("/attendance/regularizations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getRegularizations: async () => {
      return request("/attendance/regularizations");
    },
    decideRegularization: async (id: string, status: "Approved" | "Rejected") => {
      return request(`/attendance/regularizations/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },
  leave: {
    create: async (data: any) => {
      return request("/leave", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getMe: async () => {
      return request("/leave/me");
    },
    list: async () => {
      return request("/leave");
    },
    getBalances: async () => {
      return request("/leave/balances/me");
    },
    decide: async (id: string, status: "Approved" | "Rejected", comment?: string) => {
      return request(`/leave/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ status, comment }),
      });
    },
  },
  payroll: {
    getMe: async () => {
      return request("/payroll/me");
    },
    getEmployeePayroll: async (employeeId: string) => {
      return request(`/payroll/${employeeId}`);
    },
    upsertPayroll: async (employeeId: string, data: any) => {
      return request(`/payroll/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },
  documents: {
    getMe: async () => {
      return request("/documents/me");
    },
    uploadMe: async (data: any) => {
      return request("/documents/me", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    getEmployeeDocuments: async (employeeId: string) => {
      return request(`/documents/${employeeId}`);
    },
    uploadEmployeeDocument: async (employeeId: string, data: any) => {
      return request(`/documents/${employeeId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
  holidays: {
    list: async () => {
      return request("/holidays");
    },
    create: async (data: any) => {
      return request("/holidays", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
  contacts: {
    submit: async (data: { fullName: string; email: string; message: string }) => {
      return request("/contacts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
};
