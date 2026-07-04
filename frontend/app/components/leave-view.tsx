"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Employee, LeaveBalance, LeaveRequest, mockStore } from "../mockStore";

interface LeaveViewProps {
  user: Employee;
}

export default function LeaveView({ user }: LeaveViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  // Leave Form Fields
  const [leaveType, setLeaveType] = useState<"Casual" | "Sick" | "Earned">("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remarks, setRemarks] = useState("");

  // Admin Review comment
  const [adminComment, setAdminComment] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refreshData = () => {
    setEmployees(mockStore.getEmployees());
    setLeaves(mockStore.getLeaveRequests());
    setBalances(mockStore.getLeaveBalances());
  };

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const handleApplyLeave = (e: React.FormEvent) => {
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

    const res = mockStore.applyLeave({
      employeeId: user.id,
      leaveType,
      startDate,
      endDate,
      remarks
    });

    if (typeof res === "string") {
      setErrorMessage(res);
    } else {
      setMessage("Leave request submitted successfully!");
      setStartDate("");
      setEndDate("");
      setRemarks("");
      refreshData();
    }
  };

  const handleAdminDecision = (reqId: string, status: "Approved" | "Rejected") => {
    mockStore.updateLeaveStatus(reqId, status, adminComment);
    setMessage(`Leave request is now marked as ${status}.`);
    setAdminComment("");
    refreshData();
    setTimeout(() => setMessage(""), 3000);
  };

  // Get active leave balance
  const activeBalance = balances.find(b => b.employeeId === user.id);

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

      {/* Admin Queue Review Section */}
      {isAdmin && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Pending Leave Requests Queue ({leaves.filter(l => l.status === "Pending").length})
          </h3>

          {leaves.filter(l => l.status === "Pending").length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No leave applications pending review.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves
                .filter(l => l.status === "Pending")
                .map(req => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  
                  // Compute requested days
                  const d1 = new Date(req.startDate);
                  const d2 = new Date(req.endDate);
                  const diffDays = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                  return (
                    <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-700">{emp?.fullName}</span>
                          <span className="text-[10px] text-slate-400">({req.employeeId})</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Type: <strong className="text-blue-600">{req.leaveType}</strong> • Dates: <strong>{req.startDate} to {req.endDate}</strong> ({diffDays} days)
                        </p>
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                          Remarks: "{req.remarks}"
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 md:w-64">
                        <input
                          type="text"
                          placeholder="Add approval comment/feedback..."
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

      {/* Leave Balance Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["Casual", "Sick", "Earned"] as const).map(type => {
          const info = activeBalance ? activeBalance[type] : { total: 0, used: 0 };
          const remaining = info.total - info.used;
          return (
            <div key={type} className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type} Leave</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-800">{remaining}</span>
                <span className="text-xs text-slate-400">days left</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Used: {info.used} / Total entitlement: {info.total}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Apply Leave Form */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Apply for Time Off</span>
          </h3>

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Leave Category
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Remarks / Purpose
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Travel, rest, dental appointment..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Submit Request</span>
            </button>
          </form>
        </div>

        {/* Right: History List */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Leave Application Log</span>
            </h3>

            {leaves.filter(l => l.employeeId === user.id).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No leave applications filed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Category</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2">Remarks</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Approver Comment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {leaves
                      .filter(l => l.employeeId === user.id)
                      .map(req => {
                        const d1 = new Date(req.startDate);
                        const d2 = new Date(req.endDate);
                        const days = Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                          <tr key={req.id}>
                            <td className="py-2.5 font-bold text-slate-800">{req.leaveType}</td>
                            <td className="py-2.5 text-slate-600">
                              {req.startDate} to {req.endDate}
                              <span className="text-[10px] text-slate-400 block mt-0.5">({days} days)</span>
                            </td>
                            <td className="py-2.5 truncate max-w-[120px]" title={req.remarks}>{req.remarks}</td>
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
                            <td className="py-2.5 text-slate-400 italic text-[11px]">
                              {req.adminComment || "--"}
                            </td>
                          </tr>
                        );
                      })}
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
