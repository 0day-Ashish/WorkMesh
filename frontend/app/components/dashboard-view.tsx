"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  CalendarDays, 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Play,
  Square,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { apiClient } from "../apiClient";

interface DashboardViewProps {
  user: any;
  setView: (view: any) => void;
}

export default function DashboardView({ user, setView }: DashboardViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [regularizations, setRegularizations] = useState<any[]>([]);
  
  // Ticker for Check In Time
  const [todayRecord, setTodayRecord] = useState<any | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [isLoading, setIsLoading] = useState(true);

  // User compensation fields fetched from payroll
  const [userCompensation, setUserCompensation] = useState({
    basicSalary: 0,
    allowance: 0,
    deductions: 0,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const isUserAdmin = user.role === "admin";
      
      let emps: any[] = [];
      let atts: any[] = [];
      let lvs: any[] = [];
      let bals: any[] = [];
      let regs: any[] = [];
      
      if (isUserAdmin) {
        emps = await apiClient.employees.list();
        atts = await apiClient.attendance.list();
        lvs = await apiClient.leave.list();
        regs = await apiClient.attendance.getRegularizations();
      } else {
        const meProfile = await apiClient.employees.getMe();
        emps = [meProfile];
        atts = await apiClient.attendance.getMe();
        lvs = await apiClient.leave.getMe();
        bals = await apiClient.leave.getBalances();
        regs = await apiClient.attendance.getRegularizations();

        // Fetch payroll for the side panel
        try {
          const pay = await apiClient.payroll.getMe();
          if (pay && pay.length > 0) {
            setUserCompensation({
              basicSalary: Number(pay[0].basic_salary) || 0,
              allowance: 0,
              deductions: Number(pay[0].deductions) || 0,
            });
          }
        } catch (e) {
          console.error("Failed to fetch payroll for dashboard", e);
        }
      }
      
      setEmployees(emps);
      setAttendance(atts);
      setLeaves(lvs);
      setBalances(bals);
      setRegularizations(regs);

      const todayStr = new Date().toISOString().split("T")[0];
      const todayRec = atts.find((r: any) => {
        const rDateStr = new Date(r.date).toISOString().split("T")[0];
        return rDateStr === todayStr;
      });
      setTodayRecord(todayRec || null);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Elapsed timer loop
  useEffect(() => {
    if (!todayRecord || !todayRecord.check_in || todayRecord.check_out) {
      setElapsedTime("00:00:00");
      return;
    }

    const timer = setInterval(() => {
      const checkInTime = new Date(todayRecord.check_in);
      const diffMs = Math.abs(new Date().getTime() - checkInTime.getTime());
      const secs = Math.floor((diffMs / 1000) % 60);
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      const hrs = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

      const pad = (num: number) => String(num).padStart(2, "0");
      setElapsedTime(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [todayRecord]);

  const handleCheckIn = async () => {
    try {
      await apiClient.attendance.checkin();
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiClient.attendance.checkout();
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to check out");
    }
  };

  // Metrics
  const totalEmps = employees.length;
  const todayCheckedIn = attendance.filter((r: any) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const rDateStr = new Date(r.date).toISOString().split("T")[0];
    return rDateStr === todayStr && r.check_in && !r.check_out;
  }).length;

  const pendingLeavesCount = leaves.filter((l: any) => l.status === "Pending").length;
  const pendingRegsCount = regularizations.filter((r: any) => r.status === "Pending").length;

  // Active leave balances for Employee
  const casualBal = balances.find((b: any) => b.leave_type === "Casual") || { total: 10, remaining: 10 };
  const sickBal = balances.find((b: any) => b.leave_type === "Sick") || { total: 12, remaining: 12 };
  const earnedBal = balances.find((b: any) => b.leave_type === "Earned") || { total: 15, remaining: 15 };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Fetching dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Welcome back, {user.fullName}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin ? "HR Administrator Dashboard • WorkMesh Control Console" : `${user.designation || "Employee"} • Portal`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Current Date:
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      {isAdmin ? (
        /* ================= ADMIN DASHBOARD VIEW ================= */
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Roster</p>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5">{totalEmps}</p>
              </div>
            </div>

            <div className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5">{todayCheckedIn} active</p>
              </div>
            </div>

            <button 
              onClick={() => setView("leave")}
              className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm flex items-center gap-4 text-left hover:border-blue-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Leaves</p>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  {pendingLeavesCount}
                  {pendingLeavesCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                </p>
              </div>
            </button>

            <button 
              onClick={() => setView("attendance")}
              className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm flex items-center gap-4 text-left hover:border-blue-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regularizations</p>
                <p className="text-xl font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  {pendingRegsCount}
                  {pendingRegsCount > 0 && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                </p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions / Inbox */}
            <div className="bg-background border border-slate-200/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Pending Approvals Queue
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                  Requires Review
                </span>
              </div>
              <div className="p-4 flex-1 space-y-3.5">
                {leaves.filter(l => l.status === "Pending").length === 0 && 
                 regularizations.filter(r => r.status === "Pending").length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">All queues caught up!</p>
                    <p className="text-[10px] mt-0.5">No leave or punch-in corrections pending.</p>
                  </div>
                ) : (
                  <>
                    {leaves.filter(l => l.status === "Pending").map(req => {
                      const empName = employees.find(e => e.id === req.employee_id)?.full_name || "Employee";
                      const fromDateStr = new Date(req.from_date).toISOString().split("T")[0];
                      const toDateStr = new Date(req.to_date).toISOString().split("T")[0];
                      return (
                        <div key={req.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{empName}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Leave Request: {req.leave_type} ({fromDateStr} to {toDateStr})
                            </p>
                          </div>
                          <button
                            onClick={() => setView("leave")}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {regularizations.filter(r => r.status === "Pending").map(req => {
                      const empName = employees.find(e => e.id === req.employee_id)?.full_name || "Employee";
                      const reqDateStr = new Date(req.date).toISOString().split("T")[0];
                      const checkInStr = req.requested_check_in ? new Date(req.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None";
                      const checkOutStr = req.requested_check_out ? new Date(req.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None";
                      return (
                        <div key={req.id} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{empName}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Attendance Correction: {reqDateStr} ({checkInStr} - {checkOutStr})
                            </p>
                          </div>
                          <button
                            onClick={() => setView("attendance")}
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Quick Roster Status */}
            <div className="bg-background border border-slate-200/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Organization Roster Summary
                </h3>
                <button
                  onClick={() => setView("employees")}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Manage Roster
                </button>
              </div>
              <div className="p-4 space-y-3">
                {employees.slice(0, 4).map(emp => (
                  <div key={emp.id} className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                        {(emp.full_name || "Employee").split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{emp.full_name || "Employee"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{emp.designation || "No Title"}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        emp.status === "active" 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : emp.status === "on_notice"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {(emp.status || "active").replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= EMPLOYEE DASHBOARD VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Punch Desk - Large Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Check In / Out Console */}
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4">
                Simulated Punch-In Desk
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Visual Status Indicator */}
                <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-inner flex flex-col items-center justify-center relative bg-slate-50/20 shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Today</span>
                  <span className="text-xl font-black text-slate-800 font-mono tracking-tight mt-1">{elapsedTime}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-2 border ${
                    todayRecord?.check_in && !todayRecord.check_out
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {todayRecord?.check_in && !todayRecord.check_out ? "Checked In" : "Offline"}
                  </span>
                </div>

                <div className="flex-1 space-y-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Attendance Logger</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      Punch in at the start of your shift, and punch out at the end. Shift records will update instantly.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {!todayRecord?.check_in ? (
                      <button
                        onClick={handleCheckIn}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Punch Check-In</span>
                      </button>
                    ) : !todayRecord.check_out ? (
                      <button
                        onClick={handleCheckOut}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Punch Check-Out</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>
                          Shift finished. Check-in: <strong>{new Date(todayRecord.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> • Check-out: <strong>{new Date(todayRecord.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Balance Panel */}
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Leave Balance Summary
                </h3>
                <button
                  onClick={() => setView("leave")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Apply Leave
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { type: "Casual", bal: casualBal },
                  { type: "Sick", bal: sickBal },
                  { type: "Earned", bal: earnedBal }
                ].map(({ type, bal }) => {
                  return (
                    <div key={type} className="p-4 bg-slate-50 rounded-xl border border-slate-200/40">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type} Leave</p>
                      <p className="text-2xl font-extrabold text-slate-800 mt-1">{bal.remaining}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">out of {bal.total} total days</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Roster Status / Info - Sidebar Column */}
          <div className="space-y-6">
            {/* Quick Profile Summary */}
            <div className="bg-background border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-lg border border-slate-200/50">
                {user.fullName.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <h4 className="font-bold text-sm text-slate-800 mt-3">{user.fullName}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{user.designation || "Employee"}</p>

              <div className="w-full mt-4 pt-4 border-t border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee Code:</span>
                  <span className="font-semibold text-slate-700">{user.employee_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Contact:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[150px]">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Join Date:</span>
                  <span className="font-semibold text-slate-700">
                    {user.joinedDate ? new Date(user.joinedDate).toLocaleDateString() : "None"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setView("profile")}
                className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                View Full Profile
              </button>
            </div>

            {/* Quick Payroll Card */}
            <div className="bg-background border border-slate-200/60 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
                Latest Pay Structure
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic Wage:</span>
                  <span className="font-semibold text-slate-700">${userCompensation.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allowances:</span>
                  <span className="font-semibold text-slate-700">+${userCompensation.allowance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deductions:</span>
                  <span className="font-semibold text-red-600">-${userCompensation.deductions.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800">
                  <span>Net Salary:</span>
                  <span className="text-emerald-600">
                    ${(userCompensation.basicSalary + userCompensation.allowance - userCompensation.deductions).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setView("payroll")}
                className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                View Monthly Slips
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
