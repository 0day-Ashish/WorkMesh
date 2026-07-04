"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye } from "lucide-react";

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-mono">Last Updated: July 4, 2026 | Document Ref: WM-PRV-2026-V2</p>
          </div>

          <div className="space-y-6 text-xs text-slate-600 leading-relaxed font-semibold">
            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. General Scope & Commitment</h2>
              <p>
                WorkMesh is committed to protecting the privacy and security of employee records. This Privacy Policy details the types of personal, operational, and database information compiled by the WorkMesh portal and how we protect it in production.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. Information Collection & Usage</h2>
              <p>
                To provide unified shift console and leaves ledger services, the system processes:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Identity Information</strong>: Full Name, email address, department alignments, and manager associations.</li>
                <li><strong>Timekeeping Records</strong>: Clock-in/out timestamps, IP locations, shift regularization notes, and duration aggregates.</li>
                <li><strong>Compensation Ledger</strong>: Basic salary metrics, bonuses, deductions, and tax files.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">3. Access Verification & Security</h2>
              <p>
                WorkMesh is built on robust middleware defenses designed to meet compliance controls and keep your data locked. Administrative actions utilize <strong>JWT Token Family Rotations</strong>, preventing session interception. All network endpoints enforce strict parameter sanitization to block SQL/NoSQL injection and directory traversal attacks.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">4. Data Retention</h2>
              <p>
                We retain timekeeping and compensation records for audit compliance purposes as required under active corporate guidelines and regulatory requirements. Records are deleted or anonymized upon system closure or deletion request by authorized organizational administrators.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">5. Inquiries & Admin Contacts</h2>
              <p>
                For question details regarding compliance controls or data vault practices, please contact the administrative support desk at <a href="mailto:privacy@workmesh.com" className="text-blue-600 hover:underline">privacy@workmesh.com</a>.
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
