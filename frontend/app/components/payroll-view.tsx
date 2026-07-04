"use client";

import React, { useState, useEffect } from "react";
import { Banknote, FileText, Printer, Save, CheckCircle2, TrendingUp } from "lucide-react";
import { apiClient } from "../apiClient";

interface PayrollViewProps {
  user: any;
}

export default function PayrollView({ user }: PayrollViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("July 2026");

  // Admin Editor Form Fields
  const [editingEmpId, setEditingEmpId] = useState("");
  const [basicSalary, setBasicSalary] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);

  // Employee payroll list
  const [employeePayrollList, setEmployeePayrollList] = useState<any[]>([]);

  // Selected payslip details (Employee)
  const [basic, setBasic] = useState(6000);
  const [deduct, setDeduct] = useState(720);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      if (isAdmin) {
        const emps = await apiClient.employees.list();
        setEmployees(emps);
      } else {
        const pay = await apiClient.payroll.getMe();
        setEmployeePayrollList(pay);
        if (pay && pay.length > 0) {
          setBasic(Number(pay[0].basic_salary) || 0);
          setDeduct(Number(pay[0].deductions) || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load payroll directory", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const handleStartEdit = async (emp: any) => {
    setEditingEmpId(emp.id);
    setIsLoadingSalary(true);
    try {
      const pay = await apiClient.payroll.getEmployeePayroll(emp.id);
      if (pay && pay.length > 0) {
        setBasicSalary(Number(pay[0].basic_salary) || 0);
        setDeductions(Number(pay[0].deductions) || 0);
      } else {
        setBasicSalary(0);
        setDeductions(0);
      }
    } catch (e) {
      console.error("Failed to load employee salary scale:", e);
      setBasicSalary(0);
      setDeductions(0);
    } finally {
      setIsLoadingSalary(false);
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = employees.find(emp => emp.id === editingEmpId);
    if (!target) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      await apiClient.payroll.upsertPayroll(editingEmpId, {
        month: currentMonth,
        year: currentYear,
        basicSalary: Number(basicSalary),
        deductions: Number(deductions)
      });
      
      setMessage(`Salary structure updated for ${target.full_name}.`);
      setEditingEmpId("");
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to upsert payroll scale");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Payslip calculations for Employee View
  const hra = Math.round(basic * 0.4); // 40% HRA
  const specialAllow = 0;
  const pf = Math.round(basic * 0.12); // 12% PF
  const tax = deduct - pf > 0 ? deduct - pf : 0;

  const totalEarnings = basic;
  const totalDeductions = deduct;
  const netPay = totalEarnings - totalDeductions;

  if (isLoading && employees.length === 0 && employeePayrollList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading payroll ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="no-print">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Payroll & Wage Management</h2>
        <p className="text-xs text-slate-500 mt-1">Review wage sheets, print digital payslips, or adjust employee salary structures.</p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {isAdmin ? (
        /* ================= ADMIN VIEW: SALARY ADJUSTMENT SHEET ================= */
        <div className="bg-background border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden no-print">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Employee Salary Ledger
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Basic Salary (USD)</th>
                  <th className="px-5 py-3">Deductions (USD)</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map(emp => {
                  const isEditing = editingEmpId === emp.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{emp.full_name || "Employee"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Code: {emp.employee_code}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-normal">
                        {emp.designation || "No Designation"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-normal">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          emp.status === "active" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {emp.status}
                        </span>
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-5 py-3.5">
                            {isLoadingSalary ? (
                              <span className="text-[10px] text-slate-400 animate-pulse">Loading...</span>
                            ) : (
                              <input
                                type="number"
                                value={basicSalary}
                                onChange={(e) => setBasicSalary(Number(e.target.value))}
                                className="w-24 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none"
                              />
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {!isLoadingSalary && (
                              <input
                                type="number"
                                value={deductions}
                                onChange={(e) => setDeductions(Number(e.target.value))}
                                className="w-24 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none"
                              />
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={handleSaveSalary}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingEmpId("")}
                                className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-500 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5 font-semibold text-slate-400 italic">
                            Click Edit to fetch/update
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 font-normal">
                            —
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleStartEdit(emp)}
                              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                            >
                              Edit Scale
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= EMPLOYEE VIEW: PRINTABLE DIGITAL PAYSLIP ================= */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Column */}
          <div className="bg-background border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4 h-fit no-print">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Select Payslip Period
            </h4>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white outline-none"
            >
              <option value="July 2026">July 2026 (Active)</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-black rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer font-sans"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Payslip</span>
            </button>
          </div>

          {/* Payslip Vault Document Container */}
          <div className="lg:col-span-3 bg-background border border-slate-200 p-8 shadow-sm print-card rounded-2xl flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-850 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">WORKMESH INC</h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold font-mono">HR Operations Division</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2.5 py-1 bg-slate-900 text-white rounded-md font-bold uppercase tracking-wider">
                    Payslip
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-2">{selectedMonth}</p>
                </div>
              </div>

              {/* Roster detail mapping */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Employee Name</span>
                  <span className="font-extrabold text-slate-800">{user.fullName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Job Designation</span>
                  <span className="font-bold text-slate-700">{user.designation || "Employee"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Staff Code</span>
                  <span className="font-semibold text-slate-600">{user.employee_code}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Disbursement Mode</span>
                  <span className="font-semibold text-slate-600">Bank Transfer</span>
                </div>
              </div>

              {/* Breakdown Ledger Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                {/* Earnings */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Earnings</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Basic Wage Salary:</span>
                      <span className="font-bold text-slate-800">${basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">House Rent Allowance (HRA):</span>
                      <span className="font-semibold text-slate-700">${hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Special Allowances:</span>
                      <span className="font-semibold text-slate-700">${specialAllow.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Deductions</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provident Fund (12% PF):</span>
                      <span className="font-bold text-slate-800">${pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Professional Income Tax:</span>
                      <span className="font-semibold text-slate-700">${tax.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Calculation Banner */}
            <div>
              <div className="mt-8 pt-6 border-t-2 border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Net Take-Home Pay</p>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">USD (United States Dollar)</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600 font-sans">${netPay.toLocaleString()}</span>
                </div>
              </div>

              {/* Printable Disclaimers */}
              <div className="mt-6 text-center text-[9px] text-slate-400 border-t border-slate-100/50 pt-4 leading-relaxed font-mono uppercase tracking-wider">
                This is a system generated print disbursement structure. No manual seal required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
