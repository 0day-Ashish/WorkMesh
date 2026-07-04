"use client";

import React, { useState, useEffect } from "react";
import { Clock, Play, Square, Calendar, Plus, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { AttendanceRecord, Employee, mockStore, RegularizationRequest } from "../mockStore";

interface AttendanceViewProps {
  user: Employee;
}

export default function AttendanceView({ user }: AttendanceViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [regularizations, setRegularizations] = useState<RegularizationRequest[]>([]);
  
  // Checking today's state
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  // Form Fields for Regularization
  const [regDate, setRegDate] = useState("");
  const [regCheckIn, setRegCheckIn] = useState("09:00:00");
  const [regCheckOut, setRegCheckOut] = useState("18:00:00");
  const [regReason, setRegReason] = useState("");

  // Admin Review Comment
  const [adminComment, setAdminComment] = useState("");

  const [message, setMessage] = useState("");

  const refreshData = () => {
    setEmployees(mockStore.getEmployees());
    setAttendance(mockStore.getAttendance());
    setRegularizations(mockStore.getRegularizations());

    const todayStr = new Date().toISOString().split("T")[0];
    const todayRec = mockStore.getAttendance().find(r => r.employeeId === user.id && r.date === todayStr);
    setTodayRecord(todayRec || null);
  };

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const handleCheckIn = () => {
    const rec = mockStore.checkIn(user.id);
    setTodayRecord(rec);
    refreshData();
  };

  const handleCheckOut = () => {
    const rec = mockStore.checkOut(user.id);
    setTodayRecord(rec);
    refreshData();
  };

  const handleApplyRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDate || !regCheckIn || !regCheckOut || !regReason) return;

    // Check if future date
    if (new Date(regDate) > new Date()) {
      alert("Cannot apply regularization for a future date.");
      return;
    }

    mockStore.applyRegularization({
      employeeId: user.id,
      date: regDate,
      requestedCheckIn: regCheckIn,
      requestedCheckOut: regCheckOut,
      reason: regReason
    });

    setMessage("Regularization request submitted for review.");
    setRegDate("");
    setRegReason("");
    refreshData();
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAdminDecision = (reqId: string, status: "Approved" | "Rejected") => {
    mockStore.updateRegularizationStatus(reqId, status, adminComment);
    setMessage(`Request is now marked as ${status}.`);
    setAdminComment("");
    refreshData();
    setTimeout(() => setMessage(""), 3000);
  };

  // Calendar construction helper (simulating July 2026 for hackathon demonstration)
  // July 2026 starts on a Wednesday (3) and has 31 days.
  const daysInMonth = 31;
  const startDayOffset = 3; // Wed
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarGrid = [...Array(startDayOffset).fill(null), ...daysArray];

  // Helper to resolve day status
  const getDayStatus = (dayNum: number): { status: string; checkIn?: string; checkOut?: string } => {
    const dateStr = `2026-07-${String(dayNum).padStart(2, "0")}`;
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();

    // Check if holiday (Saturday/Sunday)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Look in attendance records
    const record = attendance.find(a => a.employeeId === user.id && a.date === dateStr);
    if (record) {
      return { 
        status: record.status, 
        checkIn: record.checkIn || undefined, 
        checkOut: record.checkOut || undefined 
      };
    }

    if (isWeekend) {
      return { status: "Holiday" };
    }

    // Default: Absent if past date (before today) and no record
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr < todayStr) {
      return { status: "Absent" };
    }

    return { status: "Unmarked" };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Attendance Logs & Correction</h2>
        <p className="text-xs text-slate-500 mt-1">Punch in, view calendar ledger, or file check-in correction forms.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Admin Queue Review Section */}
      {isAdmin && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Pending Attendance Corrections Queue ({regularizations.filter(r => r.status === "Pending").length})
          </h3>

          {regularizations.filter(r => r.status === "Pending").length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No correction requests pending approval.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {regularizations
                .filter(r => r.status === "Pending")
                .map(req => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  return (
                    <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-700">{emp?.fullName}</span>
                          <span className="text-[10px] text-slate-400">({req.employeeId})</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Date: <strong>{req.date}</strong> • Requested: <strong>{req.requestedCheckIn}</strong> to <strong>{req.requestedCheckOut}</strong>
                        </p>
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                          Reason: "{req.reason}"
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 md:w-64">
                        <input
                          type="text"
                          placeholder="Add review feedback comment..."
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                        />
                        <div className="flex gap-2">
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
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Main Console & Calendar Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Check-in button & Correction Application (Employee View) */}
        {!isAdmin && (
          <div className="space-y-6">
            {/* Quick check-in */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Simulated Punch Station</span>
              </h3>
              
              <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Punch Status</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  todayRecord?.checkIn && !todayRecord.checkOut
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-200 text-slate-600"
                }`}>
                  {todayRecord?.checkIn && !todayRecord.checkOut ? "Checked In" : "Not Checked In"}
                </span>
              </div>

              <div className="flex gap-2">
                {!todayRecord?.checkIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Check In</span>
                  </button>
                ) : !todayRecord.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold active:scale-98 transition-all cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Check Out</span>
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 text-center bg-slate-50 text-xs text-slate-500 rounded border border-slate-100">
                    Shift finished.
                  </div>
                )}
              </div>
            </div>

            {/* File Regularization Form */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>File Correction Request</span>
              </h3>

              <form onSubmit={handleApplyRegularization} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Check-In Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="09:00:00"
                      value={regCheckIn}
                      onChange={(e) => setRegCheckIn(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Check-Out Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="18:00:00"
                      value={regCheckOut}
                      onChange={(e) => setRegCheckOut(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Justification / Reason
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Forgot password, early offsite client meetup..."
                    value={regReason}
                    onChange={(e) => setRegReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Request Correction</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Side: Ledger / Calendar (Spans 2 columns if Employee, all 3 if Admin) */}
        <div className={`bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
          isAdmin ? "lg:col-span-3" : "lg:col-span-2"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Monthly Shift Calendar (July 2026)
              </h3>
              
              {/* Legend keys */}
              <div className="flex flex-wrap gap-2 text-[9px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded" /> Present</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded" /> Half-day</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded" /> Absent</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 rounded" /> Holiday</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500 rounded" /> Leave</span>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {/* Day names */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="font-bold text-slate-400 uppercase text-[10px] py-1">
                  {day}
                </div>
              ))}

              {calendarGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="py-2.5 border border-transparent" />;
                
                const { status, checkIn, checkOut } = getDayStatus(day);

                // Badge color based on status
                let colorClass = "bg-slate-50 border-slate-100 text-slate-400";
                if (status === "Present") colorClass = "bg-emerald-500 text-white border-emerald-600";
                if (status === "Half-day") colorClass = "bg-amber-500 text-white border-amber-600";
                if (status === "Absent") colorClass = "bg-red-500 text-white border-red-600";
                if (status === "Holiday") colorClass = "bg-slate-200 text-slate-500 border-slate-300";
                if (status === "Leave") colorClass = "bg-blue-500 text-white border-blue-600";

                return (
                  <div
                    key={day}
                    title={checkIn ? `Punch Log: ${checkIn} to ${checkOut}` : status}
                    className={`py-2 border rounded-lg font-semibold flex flex-col items-center justify-center transition-all ${colorClass}`}
                  >
                    <span>{day}</span>
                    {checkIn && (
                      <span className="text-[7px] opacity-90 mt-0.5 leading-none">
                        {checkIn.substring(0, 5)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User History Table */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
              Leave & Regularization History
            </h4>

            {regularizations.filter(r => r.employeeId === user.id).length === 0 ? (
              <p className="text-xs text-slate-400">No correction tickets filed.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Date</th>
                      <th className="py-2">Requested Time</th>
                      <th className="py-2">Justification</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Review Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {regularizations
                      .filter(r => r.employeeId === user.id)
                      .map(req => (
                        <tr key={req.id}>
                          <td className="py-2.5 font-bold">{req.date}</td>
                          <td className="py-2.5">{req.requestedCheckIn} - {req.requestedCheckOut}</td>
                          <td className="py-2.5 truncate max-w-[120px]" title={req.reason}>{req.reason}</td>
                          <td className="py-2.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              req.status === "Approved"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : req.status === "Rejected"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 italic text-[11px]">{req.adminComment || "--"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
