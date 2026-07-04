"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-[#F2F0EF] min-h-screen text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Floating Header */}
      <div className="sticky top-0 z-40 w-full flex justify-center px-4 sm:px-6 pointer-events-none">
        <header className={`
          pointer-events-auto flex items-center justify-between border border-black rounded-full shadow-sm mt-4 transition-all duration-500 ease-in-out w-full
          ${isScrolled 
            ? "max-w-7xl px-8 sm:px-10 py-4 bg-white/90 backdrop-blur-lg shadow-md" 
            : "max-w-4xl px-6 sm:px-8 py-3 bg-white/70 backdrop-blur-md"
          }
        `}>
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="WorkMesh Logo" className="w-8 h-8 object-contain" />
            <span className="font-black text-sm tracking-tight uppercase">WorkMesh</span>
          </div>

          <Link 
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 border border-black hover:bg-slate-900 hover:text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </header>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-12 w-full mt-12 mb-16">
        <div className="bg-white border border-black rounded-2xl p-8 sm:p-12 shadow-md space-y-8 text-left">
          <div className="space-y-3 border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Terms of Service</h1>
            <p className="text-xs text-slate-400 font-mono">Last Updated: July 4, 2026 | Document Ref: WM-TOS-2026-V1</p>
          </div>

          <div className="space-y-6 text-xs text-slate-600 leading-relaxed font-semibold">
            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. Acceptance of Terms</h2>
              <p>
                By accessing and logging into the WorkMesh employee portal, you agree to comply with and be bound by these Terms of Service. These terms apply to all authorized employees, administrators, and organization-assigned users.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. Authorized Portal Access</h2>
              <p>
                Access to this platform is strictly pre-provisioned. You may only register or log in using email credentials issued or approved by your organization's HR department. You are responsible for safeguarding your authentication credentials. Actions taken using your token will be legally attributed to you.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">3. Roster & Attendance Integrity</h2>
              <p>
                The shift punch console, daily attendance tracking logs, and regularization workflows are official compliance records. Falsifying check-in logs, coordinates, or submitting incorrect time adjustment records constitutes a breach of employment policies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">4. System Intellectual Property</h2>
              <p>
                All software, mock layouts, design aesthetics, branding assets, and database schemas are the exclusive property of WorkMesh Inc. and its corporate licensors. Copying, decompiling, or probing APIs without authorization is strictly prohibited.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">5. Service Availability</h2>
              <p>
                We strive to maintain continuous availability of the portal and chatbot assistant. However, we do not warrant that services will be uninterrupted or error-free during system maintenance window updates.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-12 w-full mb-16 no-print">
        <div className="bg-white border border-black rounded-2xl py-12 px-8 sm:px-16 shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/assets/logo.png" alt="WorkMesh Logo" className="w-6 h-6 object-contain" />
              <span className="font-black text-xs uppercase tracking-wider text-slate-800">WorkMesh</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">&copy; 2026 WorkMesh Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
