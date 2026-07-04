"use client";

import React, { useState, useEffect } from "react";
import { Bell, Search, Globe, ChevronRight } from "lucide-react";
import { Employee } from "./mockStore";
import { apiClient, getAccessToken, clearTokens, parseJwt } from "./apiClient";
import Sidebar, { ViewType } from "./components/sidebar";
import ChatbotWidget from "./components/ChatbotWidget";
import AuthViews from "./components/auth-views";
import LandingPage from "./components/landing-page";
import DashboardView from "./components/dashboard-view";
import ProfileView from "./components/profile-view";
import DepartmentsView from "./components/departments-view";
import AttendanceView from "./components/attendance-view";
import LeaveView from "./components/leave-view";
import PayrollView from "./components/payroll-view";
import EmployeesView from "./components/employees-view";

export default function Home() {
  const [user, setUser] = useState<any | null>(null);
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [isClient, setIsClient] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const refreshProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await apiClient.employees.getMe();
      const decoded = parseJwt(token);
      setUser({
        ...profile,
        fullName: profile.full_name || "Employee",
        joinedDate: profile.joining_date,
        role: decoded?.role || "employee"
      });
    } catch (err) {
      clearTokens();
      setUser(null);
    }
  };

  // Hydrate client state
  useEffect(() => {
    setIsClient(true);
    refreshProfile();
  }, []);

  const handleLogout = async () => {
    await apiClient.auth.logout();
    setUser(null);
    setActiveView("dashboard");
  };

  const handleUserSwap = () => {
    refreshProfile();
    setActiveView("dashboard");
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user not authenticated, render landing page with login modal triggers
  if (!user) {
    return (
      <>
        <LandingPage onGetStarted={() => setShowAuthModal(true)} />
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-md w-full">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-805 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded cursor-pointer transition-colors z-50 font-sans"
              >
                Close
              </button>
              <AuthViews onAuthSuccess={() => {
                refreshProfile();
                setShowAuthModal(false);
              }} />
            </div>
          </div>
        )}
        <ChatbotWidget />
      </>
    );
  }

  // Renders view content based on state
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView user={user} setView={setActiveView} />;
      case "profile":
        return <ProfileView user={user} />;
      case "departments":
        return <DepartmentsView />;
      case "attendance":
        return <AttendanceView user={user} />;
      case "leave":
        return <LeaveView user={user} />;
      case "payroll":
        return <PayrollView user={user} />;
      case "employees":
        return <EmployeesView />;
      default:
        return <DashboardView user={user} setView={setActiveView} />;
    }
  };

  // Human-readable title resolving
  const viewTitles: Record<ViewType, string> = {
    dashboard: "Console Overview",
    profile: "Employee Profile Vault",
    attendance: "Daily Shift Records",
    leave: "Time-Off Ledger",
    payroll: "Compensation Sheet",
    employees: "Roster Management",
    departments: "Corporate Directory Units"
  };

  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar - Left Navigation */}
      <Sidebar 
        user={user} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onLogout={handleLogout} 
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header - Navigation Bar */}
        <header className="h-16 bg-background border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-40 no-print">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="text-slate-400">WorkMesh</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-800">{viewTitles[activeView]}</span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-4">
            {/* Mock Global Search */}
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                readOnly
                placeholder="Universal query lookup..."
                className="bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-[11px] text-slate-400 w-48 outline-none select-none cursor-not-allowed"
              />
            </div>

            {/* Notification Bell */}
            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            </button>
          </div>
        </header>

        {/* Core view content container */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating AI Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
