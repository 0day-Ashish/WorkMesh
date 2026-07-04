"use client";

import React, { useState } from "react";
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
  Sparkles,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    <aside className={`relative ${isCollapsed ? "w-20" : "w-64"} bg-background border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-50`}>
      
      {/* Floating Border Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-md text-slate-500 hover:text-slate-800 hover:scale-105 transition-all z-50 cursor-pointer no-print"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Brand Logo Header */}
      <div className={`h-16 border-b border-slate-100 flex items-center ${isCollapsed ? "justify-center" : "px-6 gap-2.5"}`}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
          <Image
            src="/assets/logo.png"
            alt="WorkMesh Logo"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        {!isCollapsed && (
          <h1 className="font-semibold text-slate-800 tracking-tight text-base leading-none">WorkMesh</h1>
        )}
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 ${isCollapsed ? "px-2.5" : "px-4"} py-6 space-y-1.5 overflow-y-auto`}>
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase px-3 mb-2">
            Menu
          </div>
        )}
        {navigationItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"} rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-blue-50/70 text-blue-600 shadow-sm shadow-blue-500/5"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {!isCollapsed && <span>{item.label}</span>}
                {!isCollapsed && item.adminOnly && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold uppercase tracking-wider shrink-0">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      {/* User Session Info & Action Footer */}
      <div className={`p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col ${isCollapsed ? "items-center gap-3" : "gap-3.5"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-1.5"}`}>
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border border-white shadow-sm shrink-0">
            {user.fullName.split(" ").map(n => n[0]).join("")}
          </div>
          {!isCollapsed && (
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
          )}
        </div>

        <button
          onClick={onLogout}
          className={`flex items-center ${isCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2"} rounded-lg text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 w-full`}
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
