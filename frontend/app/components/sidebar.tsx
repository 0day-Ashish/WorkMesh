"use client";

import React from "react";
import Image from "next/image";
import { 
  LayoutDashboard, 
  User, 
  Clock, 
  CalendarDays, 
  Banknote, 
  Users, 
  Layers, 
  FileCheck2, 
  LogOut,
  Sparkles
} from "lucide-react";
import { Employee } from "../mockStore";

export type ViewType = 
  | "dashboard" 
  | "profile" 
  | "attendance" 
  | "leave" 
  | "payroll" 
  | "employees" 
  | "departments";

interface SidebarProps {
  user: Employee;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeView, setActiveView, onLogout }: SidebarProps) {
  const isAdmin = user.role === "admin";

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    { id: "profile", label: "Profile & Documents", icon: User, adminOnly: false },
    { id: "attendance", label: "Attendance & Log", icon: Clock, adminOnly: false },
    { id: "leave", label: "Leave & Balances", icon: CalendarDays, adminOnly: false },
    { id: "payroll", label: "Payroll & Payslips", icon: Banknote, adminOnly: false },
    { id: "employees", label: "Employees Roster", icon: Users, adminOnly: true },
    { id: "departments", label: "Departments CRUD", icon: Layers, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Image
            src="/assets/logo.png"
            alt="WorkMesh Logo"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-semibold text-slate-800 tracking-tight text-base leading-none">WorkMesh</h1>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">
          Menu
        </div>
        {navigationItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-blue-50/70 text-blue-600 shadow-sm shadow-blue-500/5"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* User Session Info & Action Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-3 mb-3.5 px-1.5">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border border-white shadow-sm shrink-0">
            {user.fullName.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
              {user.fullName}
            </p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
              {user.role === "admin" ? (
                <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> HR Admin
                </span>
              ) : (
                <span className="truncate">{user.designation}</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
