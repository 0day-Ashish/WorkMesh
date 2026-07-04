"use client";

import React, { useState, useEffect } from "react";
import { Banknote, FileText, Printer, Save, CheckCircle2, TrendingUp } from "lucide-react";
import { Employee, mockStore } from "../mockStore";

interface PayrollViewProps {
  user: Employee;
}

export default function PayrollView({ user }: PayrollViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("June 2026");

  // Admin Editor Form Fields
  const [editingEmpId, setEditingEmpId] = useState("");
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [deductions, setDeductions] = useState(0);

  const [message, setMessage] = useState("");

  const refreshData = () => {
    setEmployees(mockStore.getEmployees());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleStartEdit = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setBasicSalary(emp.basicSalary);
    setAllowance(emp.allowance);
    setDeductions(emp.deductions);
  };

  const handleSaveSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const target = employees.find(emp => emp.id === editingEmpId);
    if (!target) return;

    const updated: Employee = {
      ...target,
      basicSalary: Number(basicSalary),
      allowance: Number(allowance),
      deductions: Number(deductions)
    };

    mockStore.saveEmployee(updated);
    setMessage(`Salary structure updated for ${target.fullName}.`);
    setEditingEmpId("");
    refreshData();
    setTimeout(() => setMessage(""), 3000);
  };

  // Payslip calculations for Employee View
  // We simulate payslip based on user's current record
  const basic = user.basicSalary;
  const allow = user.allowance;
  const deduct = user.deductions;
  
  // Breakdown
  const hra = Math.round(basic * 0.4); // 40% HRA
  const specialAllow = allow - hra > 0 ? allow - hra : 0;
  const pf = Math.round(basic * 0.12); // 12% PF
  const tax = deduct - pf > 0 ? deduct - pf : 0;

  const totalEarnings = basic + allow;
  const totalDeductions = deduct;
  const netPay = totalEarnings - totalDeductions;

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
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden no-print">
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
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Basic Salary</th>
                  <th className="px-5 py-3">Allowances</th>
                  <th className="px-5 py-3">Deductions</th>
                  <th className="px-5 py-3">Net Salary</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map(emp => {
                  const isEditing = editingEmpId === emp.id;
                  const total = emp.basicSalary + emp.allowance - emp.deductions;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-800">{emp.fullName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{emp.designation} ({emp.id})</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-normal">
                        {emp.departmentId.replace("dept-", "").toUpperCase()}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="px-5 py-3.5">
                            <input
                              type="number"
                              value={basicSalary}
                              onChange={(e) => setBasicSalary(Number(e.target.value))}
                              className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none"
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <input
                              type="number"
                              value={allowance}
                              onChange={(e) => setAllowance(Number(e.target.value))}
                              className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none"
                            />
                          </td>
                          <td className="px-5 py-3.5">
                            <input
                              type="number"
                              value={deductions}
                              onChange={(e) => setDeductions(Number(e.target.value))}
                              className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 outline-none"
                            />
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 font-normal">
                            Calculated
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={handleSaveSalary}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingEmpId("")}
                                className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded text-[10px] font-bold text-slate-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            ${emp.basicSalary.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            +${emp.allowance.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-red-600 font-normal">
                            -${emp.deductions.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-emerald-600">
                            ${total.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleStartEdit(emp)}
                              className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
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
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4 h-fit no-print">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Select Payslip Period
            </h4>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white outline-none"
            >
              <option value="June 2026">June 2026 (Active)</option>
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
            </select>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/Save Payslip</span>
            </button>
          </div>

          {/* Payslip sheet (Spans 3 columns) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 p-8 shadow-sm print-card rounded-2xl flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight">WorkMesh Inc.</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Corporate Headquarters • Financial Division</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-wider">
                    Paid
                  </span>
                  <p className="text-xs text-slate-500 font-semibold mt-2">Statement Month: {selectedMonth}</p>
                </div>
              </div>

              {/* Roster & Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400">Employee Name</p>
                  <p className="font-bold text-slate-800 mt-0.5">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Employee Code</p>
                  <p className="font-bold text-slate-800 mt-0.5">{user.id}</p>
                </div>
                <div>
                  <p className="text-slate-400">Designation</p>
                  <p className="font-bold text-slate-800 mt-0.5">{user.designation}</p>
                </div>
                <div>
                  <p className="text-slate-400">Security Access</p>
                  <p className="font-bold text-slate-800 mt-0.5 uppercase">{user.role}</p>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6">
                
                {/* Earnings */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100">
                    Earnings (Credits)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Basic Salary:</span>
                      <span className="font-semibold text-slate-800">${basic.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">House Rent Allowance (HRA):</span>
                      <span className="font-semibold text-slate-800">${hra.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Other Allowances:</span>
                      <span className="font-semibold text-slate-800">${specialAllow.toLocaleString()}.00</span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between font-bold text-slate-800">
                      <span>Total Earnings (Gross):</span>
                      <span>${totalEarnings.toLocaleString()}.00</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3.5 pb-1.5 border-b border-slate-100">
                    Deductions (Debits)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Provident Fund (PF):</span>
                      <span className="font-semibold text-slate-800">${pf.toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Professional Income Tax:</span>
                      <span className="font-semibold text-red-600">-${tax.toLocaleString()}.00</span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-slate-100 flex justify-between font-bold text-slate-800">
                      <span>Total Deductions:</span>
                      <span className="text-red-600">-${totalDeductions.toLocaleString()}.00</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Sum footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulated Net Pay Disbursement</p>
                <p className="text-2xl font-black text-slate-900 mt-1">${netPay.toLocaleString()}.00</p>
              </div>
              <div className="text-right text-xs text-slate-400 font-medium">
                <p>Payment Mode: Direct Bank Deposit</p>
                <p className="mt-0.5">Disbursement Ref: WM-{user.id}-JUN26</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
