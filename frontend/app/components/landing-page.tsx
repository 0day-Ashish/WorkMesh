"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "../apiClient";
import {
  ArrowRight,
  Clock,
  Calendar,
  FileText,
  Banknote,
  Layers,
  Users,
  Shield,
  Lock,
  Server,
  Activity,
  Smartphone,
  ChevronRight,
  Sparkles
} from "lucide-react";
interface LandingPageProps {
  onGetStarted: () => void;
}

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatComma?: boolean;
}

const AnimatedCounter = ({ target, duration = 2500, decimals = 0, prefix = "", suffix = "", formatComma = false }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      const currentValue = easedProgress * target;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  const formatted = formatComma
    ? Math.floor(count).toLocaleString()
    : count.toFixed(decimals);

  return (
    <span>{prefix}{formatted}{suffix}</span>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-black rounded-xl bg-white overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left text-xs font-extrabold uppercase tracking-wider text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer"
      >
        <span>{question}</span>
        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
      </button>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-48 border-t border-black p-5 bg-slate-50" : "max-h-0"}`}>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{answer}</p>
      </div>
    </div>
  );
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setIsSubmitting(true);
    setFormError("");
    try {
      await apiClient.contacts.submit({
        fullName: contactName,
        email: contactEmail,
        message: contactMessage,
      });
      setFormSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Floating Header Wrapper */}
      <div className="sticky top-0 z-40 w-full flex justify-center no-print px-4 sm:px-6 pointer-events-none">
        <header className={`
          pointer-events-auto flex items-center justify-between border border-black rounded-full shadow-sm mt-4 transition-all duration-500 ease-in-out
          ${isScrolled
            ? "w-full max-w-7xl px-8 sm:px-10 py-4 bg-background/90 backdrop-blur-lg shadow-md"
            : "w-full max-w-4xl px-6 sm:px-8 py-3 bg-background/70 backdrop-blur-md"
          }
        `}>
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/logo.png"
              alt="WorkMesh Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-black text-sm tracking-tight uppercase">WorkMesh</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <Link href="/compliance" className="hover:text-slate-900 transition-colors">Compliance</Link>
            <a href="#showcase" className="hover:text-slate-900 transition-colors">Preview</a>
          </nav>

          <button
            onClick={onGetStarted}
            className="flex items-center gap-1.5 px-4 py-2 border border-black hover:bg-slate-900 hover:text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Portal Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </header>
      </div>

      {/* Hero Section */}
      <section className="px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.05] font-sans">
            The Operating System for <span className="text-blue-600">Modern Teams</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl">
            Integrate shift punch consoles, daily attendance logs, regularization workflows, leave balance trackers, digital payroll slips, and document compliance vaults into a single cohesive platform.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 border border-black hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#features"
              className="flex items-center gap-2 px-6 py-3.5 border border-black bg-white hover:bg-slate-55 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all active:scale-[0.98]"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero Interactive Showcase Mock */}
        <div className="lg:col-span-6 border border-black rounded-2xl bg-white p-6 shadow-xl relative overflow-hidden group hover:border-slate-800 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 leading-none">Active Attendance</p>
                  <p className="font-extrabold text-sm text-slate-800 mt-1">Checked In (Demo)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">08:45:12</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Balance</p>
                <p className="text-xl font-black text-slate-800 mt-1">12 Days</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Sick & Casual remaining</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Payroll</p>
                <p className="text-xl font-black text-emerald-600 mt-1">$5,280</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Net Monthly Wage</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Vault</span>
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest font-mono">Secure HTTPS</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-700 bg-white border border-slate-250 p-2.5 rounded-lg">
                <span className="font-semibold truncate">employment_offer_letter.pdf</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">PDF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Banner */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 w-full relative z-10 -mt-10 sm:-mt-3 mb-16 no-print">
        <div className="bg-slate-900 border border-black rounded-2xl py-12 text-white grid grid-cols-2 md:grid-cols-4 gap-8 text-center shadow-lg">
          {[
            { label: "Roster Enrolled", component: <AnimatedCounter target={500} suffix="+ Staff" /> },
            { label: "Shifts Tracked", component: <AnimatedCounter target={25000} formatComma suffix="+" /> },
            { label: "Approvals Handled", component: <AnimatedCounter target={99.8} decimals={1} suffix="% Speed" /> },
            { label: "Payrolls Settled", component: <AnimatedCounter target={1.2} decimals={1} prefix="$" suffix="M+ Monthly" /> }
          ].map(stat => (
            <div key={stat.label} className="space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-400">{stat.component}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="px-6 sm:px-12 py-20 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Product Features</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Six powerful CoreHR modules connected to your live operational database.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: "Shift Log Check-In",
              desc: "Dynamic timekeeping console recording real-time check-ins and elapsed duration counters with database precision."
            },
            {
              icon: Calendar,
              title: "Time-Off Planner",
              desc: "Apply for leaves, trace balances, and monitor regularization correction requests on a month-based grid calendar."
            },
            {
              icon: Banknote,
              title: "Wage Sheet & Payroll",
              desc: "Manage salary scale increments, taxes, and PF deductions. Render printable digital pay slips for your staff."
            },
            {
              icon: FileText,
              title: "Document Vault Repository",
              desc: "Store compliance records, employment letters, and credentials securely. Control uploader logs and file downloads."
            },
            {
              icon: Layers,
              title: "Corporate Directory Units",
              desc: "Create and update departments. Assign leads, trace metrics, and manage organizational units seamlessly."
            },
            {
              icon: Users,
              title: "Roster Management",
              desc: "Query the complete employee roster. Pre-provision hiring authorization keys to claim accounts."
            }
          ].map(feat => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="p-6 bg-white border border-black rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wide">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 w-full mt-8 mb-16 no-print space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Operational Workflow</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">From checking in on your morning shift to downloading your end-of-month payslip.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: "01",
              title: "Punch Console",
              desc: "Employees check in to start their shifts via the dashboard punch card.",
              icon: Clock,
              color: "text-blue-600 bg-blue-50 border-blue-100"
            },
            {
              step: "02",
              title: "Roster Logging",
              desc: "WorkMesh logs coordinates, timestamps, and calculates shift hours dynamically.",
              icon: Activity,
              color: "text-amber-600 bg-amber-50 border-amber-100"
            },
            {
              step: "03",
              title: "Review & Adjust",
              desc: "Missed punches can be adjusted via regularization workflows with manager approvals.",
              icon: Shield,
              color: "text-emerald-600 bg-emerald-50 border-emerald-100"
            },
            {
              step: "04",
              title: "Payslip Payout",
              desc: "Finance approves hours, compiling digital monthly slips ready for secure PDF download.",
              icon: Banknote,
              color: "text-purple-600 bg-purple-50 border-purple-100"
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white border border-black rounded-2xl p-6 shadow-md relative hover:border-slate-800 transition-colors space-y-4">
                {/* Step number watermark */}
                <div className="absolute top-4 right-4 text-3xl font-black text-slate-100 font-mono tracking-tighter select-none">
                  {item.step}
                </div>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1.5 pt-2 text-left">
                  <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wide">
                    {idx + 1}. {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compliance / Security Section */}
      <section id="compliance" className="max-w-7xl mx-auto px-6 sm:px-12 w-full mt-8 mb-16 no-print">
        <div className="bg-slate-50 border border-black rounded-2xl py-16 px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center shadow-md">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Bank-Grade Compliance</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              WorkMesh is built on robust middleware defenses designed to meet compliance controls and keep your data locked.
            </p>
            <div className="space-y-3.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-emerald-600" />
                <span>JWT Access Token Family Rotation</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-emerald-600" />
                <span>Role-Based Access Control (RBAC)</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-emerald-600" />
                <span>Sanitized Path Traversal Mitigation</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
                <span>Strict API Limit Restrictions</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "Session Expiry",
                desc: "15-minute access token rotations combined with secure database checks prevent token leakage."
              },
              {
                title: "Mass-Assignment Blocks",
                desc: "Explicit model destructured keys reject query injections from malicious HTTP requests."
              },
              {
                title: "Single-Sign On Ready",
                desc: "Registration codes ensure only verified pre-provisioned employees can claim portal access."
              },
              {
                title: "Audit Logging",
                desc: "Critical transactions like leave decisions and check-ins generate reviewer footprints."
              }
            ].map(item => (
              <div key={item.title} className="p-5 bg-white border border-black rounded-xl space-y-2">
                <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 sm:px-12 w-full mt-8 mb-16 no-print space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Quick answers regarding our features, workflow security, and platform behaviors.</p>
        </div>

        <div className="space-y-4 text-left">
          <FAQItem
            question="How does the digital payroll slip generation work?"
            answer="Administrators verify monthly attendance rosters and process salaries directly in their portal. Employees can review summaries online or download secure, print-ready PDF copies of their payslips instantly."
          />
          <FAQItem
            question="Is my company's shift roster data secure?"
            answer="Yes. WorkMesh utilizes role-based access control (RBAC), secure token authentication, and strict parameter sanitization to protect administration databases from vulnerabilities."
          />
          <FAQItem
            question="Can employees request regularization for missed check-ins?"
            answer="Absolutely. The portal features a complete approval workflow where employees submit time adjustment requests, which are automatically sent to managers for verification and approval."
          />
          <FAQItem
            question="How are leave balances calculated?"
            answer="Accruals update dynamically based on company leave policies. Approved time-off requests are automatically deducted from the user's active balance in real-time."
          />
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 w-full mt-8 mb-16 no-print">
        <div className="bg-white border border-black rounded-2xl py-12 px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center shadow-md">
          <div className="lg:col-span-5 space-y-5 text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Get in Touch</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Have questions about deploying WorkMesh, licensing configurations, or compliance audits? Send a query and our corporate response unit will get back to you shortly.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Support Desk</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">support@workmesh.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center border border-blue-100 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Global HQ</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">San Francisco, CA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-black rounded-xl p-6 sm:p-8">
            {formSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-lg text-center space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">Inquiry Sent Successfully</h4>
                <p className="text-xs text-slate-500 font-medium">Thank you for contacting us. Our operations team will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-white border border-black rounded-lg px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Business Email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@company.com"
                      className="w-full bg-white border border-black rounded-lg px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="How can we help your team?"
                    className="w-full bg-white border border-black rounded-lg px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 transition-colors resize-none"
                  />
                </div>

                {formError && (
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">{formError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-2.5 px-4 bg-slate-900 border border-black hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="max-w-7xl mx-auto px-6 sm:px-12 w-full mb-16 no-print">
        <div className="bg-white border border-black rounded-2xl py-16 px-8 sm:px-16 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/logo.png"
                alt="WorkMesh Logo"
                className="w-7 h-7 object-contain"
              />
              <span className="font-black text-sm uppercase tracking-wider text-slate-800">WorkMesh</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-black uppercase tracking-wider text-slate-500">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <Link href="/compliance" className="hover:text-slate-900 transition-colors">Compliance</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-mono">
            <p>&copy; {new Date().getFullYear()} WorkMesh Inc. All rights reserved.</p>
            <p>Portal Build v2.0.1 (Production-Ready)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
