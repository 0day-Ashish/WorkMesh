"use client";

import React, { useState } from "react";
import { Wrench, RotateCcw, UserCheck, ShieldCheck } from "lucide-react";
import { Employee, mockStore } from "../mockStore";

interface DemoToolbarProps {
  currentUser: Employee | null;
  onUserChanged: (user: Employee) => void;
}

export default function DemoToolbar({ currentUser, onUserChanged }: DemoToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const employees = mockStore.getEmployees();

  const handleUserSelect = (empId: string) => {
    const target = employees.find(e => e.id === empId);
    if (target) {
      mockStore.setAuthUser(target);
      onUserChanged(target);
    }
  };

  const handleReset = () => {
    if (confirm("Reset the simulated database to original values? This deletes all changes in localStorage.")) {
      mockStore.resetStore();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 no-print">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all duration-200 text-xs font-semibold select-none border border-slate-700/50"
      >
        <Wrench className={`w-3.5 h-3.5 ${isOpen ? "rotate-45" : ""}`} />
        <span>Demo Controls</span>
      </button>

      {/* Control Drawer */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 transition-all duration-200 text-slate-800 flex flex-col gap-3.5">
          <div>
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate User Accounts</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Directly swap logins to see how Admin vs. Employee dashboards react in real-time.
            </p>
          </div>

          {/* User selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Select Persona
            </label>
            <select
              value={currentUser?.id || ""}
              onChange={(e) => handleUserSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 transition-colors"
            >
              {employees
                .filter(e => e.email) // Show only registered
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.role === "admin" ? "HR Admin" : emp.designation})
                  </option>
                ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[9px] text-slate-400 font-medium">
              Active User: {currentUser?.fullName || "None"}
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors border border-red-100"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset DB</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
