"use client";

import React, { useState } from "react";
import { Wrench, UserCheck, ShieldCheck } from "lucide-react";
import { apiClient } from "../apiClient";

interface DemoToolbarProps {
  currentUser: any;
  onUserChanged: () => void;
}

export default function DemoToolbar({ currentUser, onUserChanged }: DemoToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSimulateLogin = async (email: string, role: string) => {
    setIsLoading(true);
    setError("");
    try {
      const password = role === "admin" ? "AdminPassword123!" : "EmployeePassword123!";
      await apiClient.auth.signin({ email, password });
      onUserChanged();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsLoading(false);
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
        <div className="absolute bottom-14 right-0 w-72 bg-background rounded-xl shadow-2xl border border-slate-200 p-4 transition-all duration-200 text-slate-800 flex flex-col gap-3.5">
          <div>
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate User Accounts</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              Click a profile to simulate login using live backend credentials and database roles.
            </p>
          </div>

          {error && (
            <div className="text-[10px] text-red-500 bg-red-50 p-2 rounded border border-red-100">
              {error}
            </div>
          )}

          {/* Quick login options */}
          <div className="flex flex-col gap-2">
            <button
              disabled={isLoading}
              onClick={() => handleSimulateLogin("admin@workmesh.com", "admin")}
              className="flex items-center gap-2.5 px-3 py-2 border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/20 transition-all text-left disabled:opacity-50"
            >
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-bold truncate">Jane Doe (HR Admin)</p>
                <p className="text-[9px] text-slate-400 truncate">admin@workmesh.com</p>
              </div>
            </button>

            <button
              disabled={isLoading}
              onClick={() => handleSimulateLogin("employee@workmesh.com", "employee")}
              className="flex items-center gap-2.5 px-3 py-2 border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50/20 transition-all text-left disabled:opacity-50"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                EM
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-bold truncate">John Smith (Developer)</p>
                <p className="text-[9px] text-slate-400 truncate">employee@workmesh.com</p>
              </div>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[200px]">
              Active: {currentUser?.full_name || currentUser?.fullName || "None"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
