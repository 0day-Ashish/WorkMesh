"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Layers, Users, CheckCircle2 } from "lucide-react";
import { apiClient } from "../apiClient";

export default function DepartmentsView() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const depts = await apiClient.departments.list();
      const emps = await apiClient.employees.list();
      setDepartments(depts);
      setEmployees(emps);
    } catch (err) {
      console.error("Failed to load departments data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      await apiClient.departments.create({
        name,
        manager_id: managerId || null
      });
      setMessage(`Department "${name}" created successfully.`);
      setName("");
      setManagerId("");
      setShowAddForm(false);
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to create department");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !name) return;

    try {
      await apiClient.departments.update(editingDept.id, {
        name,
        manager_id: managerId || null
      });
      setMessage(`Department "${name}" updated successfully.`);
      setEditingDept(null);
      setName("");
      setManagerId("");
      refreshData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update department");
    }
  };

  const handleStartEdit = (dept: any) => {
    setEditingDept(dept);
    setName(dept.name);
    setManagerId(dept.manager_id || "");
    setShowAddForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const inDept = employees.filter(e => e.department_id === id);
    if (inDept.length > 0) {
      alert(`Cannot delete department. There are ${inDept.length} employee(s) assigned to this department.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the department "${name}"?`)) {
      try {
        await apiClient.departments.delete(id);
        setMessage(`Department "${name}" deleted.`);
        refreshData();
        setTimeout(() => setMessage(""), 3000);
      } catch (err: any) {
        alert(err.message || "Failed to delete department");
      }
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDept(null);
    setName("");
    setManagerId("");
  };

  if (isLoading && departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading departments directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Departments Control Board</h2>
          <p className="text-xs text-slate-500 mt-1">Manage corporate organizational units and department leadership.</p>
        </div>
        {!showAddForm && !editingDept && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Department</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Form Area (Add or Edit) */}
      {(showAddForm || editingDept) && (
        <div className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            {editingDept ? `Edit Department: ${editingDept.name}` : "Create New Department"}
          </h3>

          <form onSubmit={editingDept ? handleSaveEdit : handleAddDept} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Department Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Product Design"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Assign Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
              >
                <option value="">-- No Manager Assigned --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || "Employee"} ({emp.designation || "No Designation"})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                {editingDept ? "Save Changes" : "Create Unit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map(dept => {
          const count = employees.filter(e => e.department_id === dept.id).length;
          const managerName = employees.find(e => e.id === dept.manager_id)?.full_name || "Unassigned";
          const deptCode = dept.name.substring(0, 3).toUpperCase();

          return (
            <div key={dept.id} className="bg-background border border-slate-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {deptCode}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm truncate">{dept.name}</h3>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Employees:
                    </span>
                    <span className="font-semibold text-slate-800">{count} assigned</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Department Lead:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[120px]">{managerName}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleStartEdit(dept)}
                  className="flex items-center justify-center gap-1.5 flex-1 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className="flex items-center justify-center gap-1.5 flex-1 py-1.5 border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg text-[10px] font-bold text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
