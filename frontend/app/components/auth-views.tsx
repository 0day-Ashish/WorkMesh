"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, Mail, UserPlus, KeyRound, AlertCircle, Sparkles } from "lucide-react";
import { Employee, mockStore } from "../mockStore";

interface AuthViewsProps {
  onAuthSuccess: (user: Employee) => void;
}

export default function AuthViews({ onAuthSuccess }: AuthViewsProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    const res = mockStore.login(email, password);
    if (typeof res === "string") {
      setError(res);
    } else {
      onAuthSuccess(res);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!employeeCode || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    const res = mockStore.signup(employeeCode, email, password);
    if (typeof res === "string") {
      setError(res);
    } else {
      onAuthSuccess(res);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!email) {
      setError("Please enter your registered email address");
      return;
    }
    // Simulate reset
    const employees = mockStore.getEmployees();
    const exists = employees.some(emp => emp.email.toLowerCase() === email.toLowerCase());
    if (!exists) {
      setError("Email address not found in system roster");
      return;
    }

    setSuccessMsg("A password reset link has been dispatched to your email address (simulated).");
    setTimeout(() => {
      setMode("login");
      setSuccessMsg("");
      setEmail("");
    }, 4000);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md border border-slate-100 shrink-0">
            <Image
              src="/assets/logo.png"
              alt="WorkMesh Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">WorkMesh</h2>
        </div>
        <h3 className="text-center text-sm text-slate-500 font-medium">
          {mode === "login" && "Sign in to your employee portal"}
          {mode === "signup" && "Register your pre-issued code"}
          {mode === "forgot" && "Recover your password credentials"}
        </h3>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@workmesh.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setError(""); setMode("forgot"); }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                Sign In
              </button>

              <div className="relative flex justify-center text-xs mt-6">
                <span className="bg-white px-2 text-slate-400 font-medium">Or simulate new hire setup</span>
              </div>

              <button
                type="button"
                onClick={() => { setError(""); setMode("signup"); }}
                className="w-full mt-3 flex justify-center items-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register with Employee Code</span>
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Employee Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="EMP005 (for pre-issued code test)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Tip: Use <code className="font-bold text-slate-500">EMP005</code> as it is pre-seeded but unregistered.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="emily@workmesh.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Choose Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                Register & Sign In
              </button>

              <button
                type="button"
                onClick={() => { setError(""); setMode("login"); }}
                className="w-full mt-3 flex justify-center py-2 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@workmesh.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                Request Password Reset
              </button>

              <button
                type="button"
                onClick={() => { setError(""); setMode("login"); }}
                className="w-full mt-3 flex justify-center py-2 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel & Go Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
