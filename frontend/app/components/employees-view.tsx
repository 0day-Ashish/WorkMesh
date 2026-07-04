"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, UserCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { apiClient } from "../apiClient";

export default function EmployeesView() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Pre-provision Form Modal/Fields
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newSalary, setNewSalary] = useState(5000);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const emps = await apiClient.employees.list();
      const depts = await apiClient.departments.list();
      setEmployees(emps);
      setDepartments(depts);
    } catch (err) {
      console.error("Failed to load employees list", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handlePreProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName || !newDesignation || !newDeptId) return;

    // Check if ID already exists
    const exists = employees.some(emp => emp.employee_code.toUpperCase() === newId.toUpperCase());
    if (exists) {
      alert("Employee code already exists.");
      return;
    }

    try {
      // 1. Pre-provision Employee Code
      const emp = await apiClient.employees.create({
        employee_code: newId.toUpperCase(),
        full_name: newName,
        designation: newDesignation,
        department_id: newDeptId,
        joining_date: new Date().toISOString(),
        status: "active"
      });

      // 2. Set up starting salary structure (July 2026 default)
      await apiClient.payroll.upsertPayroll(emp.id, {
        month: 7,
        year: 2026,
        basicSalary: newSalary,
        deductions: Math.round(newSalary * 0.08)
      });

      setMessage(`Code "${newId.toUpperCase()}" pre-issued for ${newName}. Ready for registration.`);
      setNewId("");
      setNewName("");
      setNewDesignation("");
      setNewDeptId("");
      setShowAddForm(false);
      refreshData();
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to pre-provision employee");
    }
  };

  // Filter roster
  const filteredEmployees = employees.filter(emp => {
    const name = emp.full_name || "";
    const code = emp.employee_code || "";
    const designation = emp.designation || "";
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          designation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = deptFilter === "all" || emp.department_id === deptFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading organization roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Organization Roster</h2>
          <p className="text-xs text-slate-500 mt-1">Search staff directories, pre-issue hire codes, and modify account profiles.</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              const nextNum = employees.length + 1;
              setNewId(`EMP${String(nextNum).padStart(3, "0")}`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pre-issue Employee Code</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Pre-provision Form */}
      {showAddForm && (
        <div className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Pre-provision Registration Code</span>
          </h3>

          <form onSubmit={handlePreProvision} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Employee Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. EMP006"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-880 focus:border-blue-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Emily Watson"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-880 focus:border-blue-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Role Designation
              </label>
              <input
                type="text"
                required
                placeholder="e.g. UX Designer"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-880 focus:border-blue-500 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                required
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-880 focus:border-blue-500 focus:bg-white outline-none"
              >
                <option value="">-- Choose Unit --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Starting Wage ($)
              </label>
              <input
                type="number"
                required
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-880 focus:border-blue-500 focus:bg-white outline-none"
              />
            </div>

            <div className="md:col-span-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md active:scale-98 transition-all cursor-pointer font-sans"
              >
                Issue Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-background border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3.5">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name, code or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_notice">On Notice</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-background border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="px-5 py-3">Code / ID</th>
                <th className="px-5 py-3">Full Name</th>
                <th className="px-5 py-3">Designation</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Register Status</th>
                <th className="px-5 py-3">Employment Status</th>
                <th className="px-5 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEmployees.map(emp => {
                const isClaimed = !!emp.user_id;
                const joinedDateStr = emp.joining_date ? new Date(emp.joining_date).toISOString().split("T")[0] : "None";

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-bold text-slate-800">{emp.employee_code}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{emp.full_name || "Employee"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{emp.user?.email || "Unregistered (Code Pre-issued)"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{emp.designation || "No Title"}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-normal">
                      {departments.find(d => d.id === emp.department_id)?.name || "--"}
                    </td>
                    <td className="px-5 py-3.5">
                      {isClaimed ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                          <UserCheck className="w-3.5 h-3.5" /> Registered
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold text-[10px] italic">
                          Pending Claim
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                        emp.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : emp.status === "on_notice"
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      }`}>
                        {(emp.status || "active").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-normal">{joinedDateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
