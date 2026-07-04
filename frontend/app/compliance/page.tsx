"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, CheckCircle, Database } from "lucide-react";

export default function CompliancePage() {
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Security & Compliance Log</h1>
            <p className="text-xs text-slate-400 font-mono">Last Updated: July 4, 2026 | Standard Version: ISO-27001 / SOC2 Type II</p>
          </div>

          <div className="space-y-6 text-xs text-slate-600 leading-relaxed font-semibold">
            <section className="space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">1. Token Authorization Standard</h2>
              <p>
                WorkMesh operates on a stateless JSON Web Token (JWT) architecture. Session authentication utilizes:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-[11px] uppercase">Access Tokens</h3>
                  <p className="text-[10px] text-slate-500">Short-lived 15-minute verification payloads encoded using RSA/SHA-256 signatures.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-[11px] uppercase">Token Rotation</h3>
                  <p className="text-[10px] text-slate-500">Access refresh cycles trigger automatic cryptographic family checks to detect replayed tokens.</p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">2. Endpoint Defense Layer</h2>
              <p>
                All ingress routes to the backend Express service pass through multiple security validation tiers:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Zod Input Schema Mapping</strong>: Enforces strict data types and sanitizes request bodies, protecting records against SQL, path-traversal, and injection vectors.</li>
                <li><strong>Dynamic Rate Limiting</strong>: Restricts endpoints to 100 requests per 15-minute window to mitigate DDoS and token-cracking activities.</li>
                <li><strong>Secure Headers (Helmet)</strong>: Block MIME-sniffing, cross-site scripting (XSS), clickjacking, and enforce HTTPS Transport Security.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">3. File Vault Compliance</h2>
              <p>
                The document vault handles digital employee payslips and records. The upload controller validates mime types, restricts sizes, and processes storage paths relative to sandboxed subdirectories, completely eliminating path-traversal directory leakage vulnerabilities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">4. SOC2 Control Matrices</h2>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-[11px] text-left">
                  <thead className="bg-slate-50 font-extrabold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Control Domain</th>
                      <th className="px-4 py-3">Audit Metric</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    <tr>
                      <td className="px-4 py-3 font-bold">Data Encryption</td>
                      <td className="px-4 py-3">AES-256 for resting DB, TLS 1.3 in transit</td>
                      <td className="px-4 py-3 text-emerald-600 font-extrabold">Active</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold">Session Expiry</td>
                      <td className="px-4 py-3">Automatic 15-minute inactive logging</td>
                      <td className="px-4 py-3 text-emerald-600 font-extrabold">Active</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold">Audit Tracing</td>
                      <td className="px-4 py-3">Log-footprints for Leave & Attendance approvals</td>
                      <td className="px-4 py-3 text-emerald-600 font-extrabold">Active</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
