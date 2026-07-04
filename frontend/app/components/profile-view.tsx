"use client";

import React, { useState, useEffect } from "react";
import { User, FileText, Upload, Save, Eye, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import { Employee, mockStore, Department } from "../mockStore";

interface ProfileViewProps {
  user: Employee;
}

interface MockDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(user.id);
  const [activeTab, setActiveTab] = useState<"details" | "documents">("details");

  // Form Fields
  const [targetEmp, setTargetEmp] = useState<Employee | null>(null);
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<any>("active");
  const [role, setRole] = useState<any>("employee");
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [deductions, setDeductions] = useState(0);

  // Mock Documents State
  const [documents, setDocuments] = useState<MockDoc[]>([
    { id: "doc-1", name: "ID_Proof_Verification.pdf", type: "ID Proof", size: "1.2 MB", uploadedAt: "2026-01-16" },
    { id: "doc-2", name: "Offer_Letter_WorkMesh.pdf", type: "Offer Letter", size: "2.4 MB", uploadedAt: "2026-01-15" }
  ]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Payslip");

  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmployees(mockStore.getEmployees());
    setDepartments(mockStore.getDepartments());
  }, []);

  useEffect(() => {
    const list = mockStore.getEmployees();
    const emp = list.find(e => e.id === selectedEmpId) || user;
    setTargetEmp(emp);
    
    // Set form fields
    setFullName(emp.fullName);
    setDesignation(emp.designation);
    setPhone(emp.phone);
    setAddress(emp.address);
    setDepartmentId(emp.departmentId);
    setStatus(emp.status);
    setRole(emp.role);
    setBasicSalary(emp.basicSalary);
    setAllowance(emp.allowance);
    setDeductions(emp.deductions);
    setMessage("");
  }, [selectedEmpId, user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmp) return;

    // Build updated object
    let updated: Employee;
    if (isAdmin) {
      // Admin can edit everything
      updated = {
        ...targetEmp,
        fullName,
        designation,
        phone,
        address,
        departmentId,
        status,
        role,
        basicSalary: Number(basicSalary),
        allowance: Number(allowance),
        deductions: Number(deductions)
      };
    } else {
      // Employee can ONLY edit phone and address
      updated = {
        ...targetEmp,
        phone,
        address
      };
    }

    mockStore.saveEmployee(updated);
    // Refresh lists
    setEmployees(mockStore.getEmployees());
    setMessage("Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;

    const newDoc: MockDoc = {
      id: `doc-${Date.now()}`,
      name: newDocName.endsWith(".pdf") ? newDocName : `${newDocName}.pdf`,
      type: newDocType,
      size: "820 KB",
      uploadedAt: new Date().toISOString().split("T")[0]
    };

    setDocuments([newDoc, ...documents]);
    setNewDocName("");
    setMessage("Document uploaded successfully (mocked)!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector Banner (Admin Only) */}
      {isAdmin && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Manage Profile For:
            </span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-blue-500 transition-colors"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.id})
                </option>
              ))}
            </select>
          </div>
          {selectedEmpId !== user.id && (
            <button
              onClick={() => setSelectedEmpId(user.id)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Back to My Profile
            </button>
          )}
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "details"
              ? "text-blue-600 font-extrabold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>Personal Details</span>
          {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === "documents"
              ? "text-blue-600 font-extrabold"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span>Documents Vault</span>
          {activeTab === "documents" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {activeTab === "details" ? (
        /* ================= DETAILS TAB ================= */
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base">
                {fullName.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {fullName || "Loading Employee..."}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {selectedEmpId} • Joined: {targetEmp?.joinedDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile details */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={targetEmp?.email || ""}
                  disabled={true}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 cursor-not-allowed outline-none"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">*Email cannot be changed directly</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Editable Contact Fields (Always active for self, and for admin) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Home Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              {/* Administration Controls */}
              {isAdmin && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Employment Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="on_notice">On Notice</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Security Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">HR Admin / Officer</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Compensation Section */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3 pt-3 border-t border-slate-100">
                Salary Structure Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Basic Salary ($)
                  </label>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Allowances ($)
                  </label>
                  <input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Deductions ($)
                  </label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Updates</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= DOCUMENTS TAB ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Verified Documents Records
            </h3>

            <div className="divide-y divide-slate-100">
              {documents.map(doc => (
                <div key={doc.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Category: {doc.type} • Size: {doc.size} • Uploaded: {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => alert(`Opening preview for ${doc.name} (mock download)`)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View / PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Upload New Document
            </h3>
            
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Document Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pan_Card_Verification"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Document Type
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                >
                  <option value="ID Proof">ID Proof</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Payslip">Payslip</option>
                  <option value="Tax Form">Tax Form</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
