"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, Plus, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { apiClient } from "../apiClient";

interface AttendanceViewProps {
  user: any;
}

export default function AttendanceView({ user }: AttendanceViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [regularizations, setRegularizations] = useState<any[]>([]);
  const [calendarRecords, setCalendarRecords] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(user.id);
  
  // Checking today's state
  const [todayRecord, setTodayRecord] = useState<any | null>(null);

  // Form Fields for Regularization
  const [regDate, setRegDate] = useState("");
  const [regCheckIn, setRegCheckIn] = useState("09:00");
  const [regCheckOut, setRegCheckOut] = useState("18:00");
  const [regReason, setRegReason] = useState("");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (isAdmin) {
        const emps = await apiClient.employees.list();
        setEmployees(emps);
      }
      
      // Fetch regularizations
      const regs = await apiClient.attendance.getRegularizations();
      setRegularizations(regs);

      // Fetch monthly derived calendar for selected employee (July 2026)
      const startDate = "2026-07-01";
      const endDate = "2026-07-31";
      
      let cal: any[] = [];
      if (selectedEmpId === user.id) {
        cal = await apiClient.attendance.getMe();
      } else if (isAdmin) {
        // Since there is no admin calendar endpoint, we simulate it using raw attendance
        const rawAtt = await apiClient.attendance.list({ 
          employee_id: selectedEmpId, 
          startDate, 
          endDate 
        });
        
        // Fill dates dynamically for July 2026
        const temp = [];
        for (let i = 1; i <= 31; i++) {
          const dateStr = `2026-07-${String(i).padStart(2, "0")}`;
          const match = rawAtt.find((r: any) => new Date(r.date).toISOString().split("T")[0] === dateStr);
          const dayOfWeek = new Date(dateStr).getDay();
          
          let status = "Absent";
          if (dayOfWeek === 0 || dayOfWeek === 6) status = "Weekend";
          
          temp.push({
            date: dateStr,
            check_in: match ? match.check_in : null,
            check_out: match ? match.check_out : null,
            status: match ? match.status : status
          });
        }
        cal = temp;
      }
      setCalendarRecords(cal);

      // Set today's punch state
      const todayStr = new Date().toISOString().split("T")[0];
      const todayRec = cal.find(r => r.date === todayStr);
      setTodayRecord(todayRec || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load attendance logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user.id, selectedEmpId]);

  const handleApplyRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regCheckIn || !regCheckOut || !regReason) return;
    setErrorMsg("");
    setMessage("");

    // Check if future date
    if (new Date(regDate) > new Date()) {
      setErrorMsg("Cannot apply regularization for a future date.");
      return;
    }

    try {
      const requested_check_in = new Date(`${regDate}T${regCheckIn}:00.000Z`).toISOString();
      const requested_check_out = new Date(`${regDate}T${regCheckOut}:00.000Z`).toISOString();

      await apiClient.attendance.createRegularization({
        date: regDate,
        requested_check_in,
        requested_check_out,
        reason: regReason
      });

      setMessage("Regularization request submitted for review.");
      setRegDate("");
      setRegReason("");
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to file regularization request");
    }
  };

  const handleAdminDecision = async (reqId: string, status: "Approved" | "Rejected") => {
    setErrorMsg("");
    setMessage("");
    try {
      await apiClient.attendance.decideRegularization(reqId, status);
      setMessage(`Request is now marked as ${status}.`);
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to decide regularization request");
    }
  };

  // Calendar construction helper (July 2026)
  const daysInMonth = 31;
  const startDayOffset = 3; // Wed
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = [...Array(startDayOffset).fill(null), ...daysArray];

  // Helper to resolve day status
  const getDayStatus = (dayNum: number): { status: string; checkIn?: string; checkOut?: string } => {
    const dateStr = `2026-07-${String(dayNum).padStart(2, "0")}`;
    const record = calendarRecords.find(r => r.date === dateStr);
    if (record) {
      return {
        status: record.status,
        checkIn: record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        checkOut: record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
      };
    }
    // Default weekend fallback
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return { status: "Weekend" };
    return { status: "Absent" };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Shift Logs & Attendance</h2>
          <p className="text-xs text-slate-500 mt-1">Review check-in history, monthly calendars, and regularize punches.</p>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Admin Employee Selector */}
      {isAdmin && (
        <div className="bg-background border border-slate-200/60 rounded-2xl p-5 shadow-sm flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Inspect Calendar For:
          </span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 transition-colors"
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-blue-600" />
                <span>July 2026 Shift Grid</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold uppercase tracking-wider font-mono">
                System Demo Mode
              </span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="py-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}

              {/* Day Cells */}
              {calendarGrid.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/20 border border-transparent rounded-lg" />;
                }

                const { status, checkIn, checkOut } = getDayStatus(dayNum);
                
                let colorClass = "bg-slate-50 border-slate-100 text-slate-400";
                if (status === "Present") {
                  colorClass = "bg-emerald-50/30 border-emerald-200/60 text-emerald-700";
                } else if (status === "Half-day") {
                  colorClass = "bg-amber-50/30 border-amber-200/60 text-amber-700";
                } else if (status === "Leave") {
                  colorClass = "bg-blue-50/30 border-blue-200/60 text-blue-700";
                } else if (status.startsWith("Holiday")) {
                  colorClass = "bg-indigo-50/30 border-indigo-200/60 text-indigo-700";
                } else if (status === "Weekend") {
                  colorClass = "bg-slate-100/40 border-slate-200/20 text-slate-400";
                } else if (status === "Absent") {
                  colorClass = "bg-red-50/20 border-red-200/40 text-red-600";
                }

                return (
                  <div 
                    key={dayNum} 
                    className={`aspect-square border rounded-xl p-1.5 flex flex-col justify-between hover:scale-[1.02] transition-transform ${colorClass}`}
                  >
                    <span className="font-extrabold text-[10px]">{dayNum}</span>
                    <div className="flex flex-col text-[8px] leading-tight select-none">
                      {checkIn && <span className="font-medium">In: {checkIn}</span>}
                      {checkOut && <span className="font-medium">Out: {checkOut}</span>}
                      {!checkIn && <span className="font-bold uppercase tracking-wider text-[7px] truncate">{status}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Requests and Decisons (1/3 width) */}
        <div className="space-y-6">
          {/* Employee Request Form */}
          {!isAdmin && (
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Apply Regularization
              </h3>
              <form onSubmit={handleApplyRegularization} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="time"
                      required
                      value={regCheckIn}
                      onChange={(e) => setRegCheckIn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Check-Out Time
                    </label>
                    <input
                      type="time"
                      required
                      value={regCheckOut}
                      onChange={(e) => setRegCheckOut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reason for correction
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Card scanner failure at front entrance desk"
                    value={regReason}
                    onChange={(e) => setRegReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </form>
            </div>
          )}

          {/* Regularizations Log / Admin Approvals Queue */}
          <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              {isAdmin ? "Correction Approvals" : "Correction History"}
            </h3>

            {regularizations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No correction requests recorded.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {regularizations.map(req => {
                  const reqDate = new Date(req.date).toISOString().split("T")[0];
                  const inTime = req.requested_check_in ? new Date(req.requested_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None";
                  const outTime = req.requested_check_out ? new Date(req.requested_check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "None";
                  return (
                    <div key={req.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{reqDate}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          req.status === "Approved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : req.status === "Rejected"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="text-slate-500 space-y-1 text-[11px]">
                        <p>Requested: <strong className="text-slate-700">{inTime} to {outTime}</strong></p>
                        <p className="italic text-slate-400 mt-1">"{req.reason}"</p>
                      </div>

                      {isAdmin && req.status === "Pending" && (
                        <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                          <button
                            onClick={() => handleAdminDecision(req.id, "Approved")}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAdminDecision(req.id, "Rejected")}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
