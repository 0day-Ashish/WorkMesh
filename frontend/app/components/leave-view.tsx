"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "../apiClient";

interface LeaveViewProps {
  user: any;
}

export default function LeaveView({ user }: LeaveViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState<"Casual" | "Sick" | "Earned">("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      if (isAdmin) {
        const emps = await apiClient.employees.list();
        setEmployees(emps);
        const allLeaves = await apiClient.leave.list();
        setLeaves(allLeaves);
      } else {
        const myLeaves = await apiClient.leave.getMe();
        setLeaves(myLeaves);
        const myBalances = await apiClient.leave.getBalances();
        setBalances(myBalances);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load leave records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!startDate || !endDate || !remarks) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMessage("Start date cannot be after the end date.");
      return;
    }

    try {
      await apiClient.leave.create({
        fromDate: startDate,
        toDate: endDate,
        leaveType,
        reason: remarks
      });
      setMessage("Leave request submitted successfully!");
      setStartDate("");
      setEndDate("");
      setRemarks("");
      refreshData();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply for leave");
    }
  };

  const handleAdminDecision = async (reqId: string, status: "Approved" | "Rejected") => {
    setMessage("");
    setErrorMessage("");
    try {
      await apiClient.leave.decide(reqId, status);
      setMessage(`Leave request is now marked as ${status}.`);
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit decision");
    }
  };

  // Get active leave balances
  const casualBal = balances.find((b: any) => b.leave_type === "Casual") || { total: 10, remaining: 10 };
  const sickBal = balances.find((b: any) => b.leave_type === "Sick") || { total: 12, remaining: 12 };
  const earnedBal = balances.find((b: any) => b.leave_type === "Earned") || { total: 15, remaining: 15 };

  if (isLoading && leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading leave records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Leave Manager</h2>
        <p className="text-xs text-slate-500 mt-1">Review leave balances, request time-off, or approve pending employee requests.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form / Info (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Balance panel */}
          {!isAdmin && (
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Leave Entitlements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "Casual Leave", info: casualBal },
                  { name: "Sick Leave", info: sickBal },
                  { name: "Earned Leave", info: earnedBal }
                ].map(({ name, info }) => {
                  return (
                    <div key={name} className="p-4 bg-slate-50 rounded-xl border border-slate-200/40">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{name}</p>
                      <p className="text-2xl font-extrabold text-slate-800 mt-1">{info.remaining}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">out of {info.total} total days</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Leave Application Form */}
          {!isAdmin && (
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Apply for leave
              </h3>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Leave Type
                    </label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    >
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Earned">Earned Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Reason / Remarks
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about your leave application..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Apply Leave</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Admin Queue List */}
          {isAdmin && (
            <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                HR Leave Approvals Queue
              </h3>
              {leaves.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No leave requests recorded.</p>
              ) : (
                <div className="space-y-4">
                  {leaves.map(req => {
                    const empName = employees.find(e => e.id === req.employee_id)?.full_name || "Employee";
                    const fromDateStr = new Date(req.from_date).toISOString().split("T")[0];
                    const toDateStr = new Date(req.to_date).toISOString().split("T")[0];

                    return (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-extrabold text-slate-800 text-sm">{empName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: {req.employee_id}</p>
                          </div>
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

                        <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200/50 py-2.5">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Leave Category</span>
                            <p className="font-bold text-slate-700 mt-0.5">{req.leave_type}</p>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Requested Range</span>
                            <p className="font-bold text-slate-700 mt-0.5">{fromDateStr} to {toDateStr}</p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee Reason</span>
                          <p className="italic text-slate-500 mt-0.5">"{req.reason || "No remarks provided"}"</p>
                        </div>

                        {req.status === "Pending" && (
                          <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                            <button
                              onClick={() => handleAdminDecision(req.id, "Approved")}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Approve Request
                            </button>
                            <button
                              onClick={() => handleAdminDecision(req.id, "Rejected")}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Reject Request
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: History for Employees (1/3 width) */}
        {!isAdmin && (
          <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              My Leave Log
            </h3>
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No leaves applied yet.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {leaves.map(req => {
                  const fromDateStr = new Date(req.from_date).toISOString().split("T")[0];
                  const toDateStr = new Date(req.to_date).toISOString().split("T")[0];
                  return (
                    <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{req.leave_type} Leave</span>
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
                      <p className="text-[11px] text-slate-500">Duration: <strong className="text-slate-600">{fromDateStr} to {toDateStr}</strong></p>
                      <p className="italic text-[10px] text-slate-400 mt-1">"{req.reason}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
