"use client";

import React, { useState, useEffect } from "react";
import { User, FileText, Upload, Save, Eye, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import { apiClient } from "../apiClient";

interface ProfileViewProps {
  user: any;
}

export default function ProfileView({ user }: ProfileViewProps) {
  const isAdmin = user.role === "admin";
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState(user.id);
  const [activeTab, setActiveTab] = useState<"details" | "documents">("details");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("active");
  const [role, setRole] = useState("employee");
  const [basicSalary, setBasicSalary] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [deductions, setDeductions] = useState(0);

  // Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Payslip");

  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load directories
  useEffect(() => {
    const loadDirectories = async () => {
      try {
        if (isAdmin) {
          const emps = await apiClient.employees.list();
          setEmployees(emps);
        }
        const depts = await apiClient.departments.list();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load directories", err);
      }
    };
    loadDirectories();
  }, [isAdmin]);

  // Load selected profile data
  const loadProfileData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // 1. Fetch profile
      let emp: any = null;
      if (selectedEmpId === user.id) {
        emp = await apiClient.employees.getMe();
      } else if (isAdmin) {
        emp = await apiClient.employees.get(selectedEmpId);
      }

      if (emp) {
        setFullName(emp.full_name || "");
        setDesignation(emp.designation || "");
        setPhone(emp.phone || "");
        setAddress(emp.address || "");
        setDepartmentId(emp.department_id || "");
        setStatus(emp.status || "active");
        setRole(emp.user?.role || "employee");
      }

      // 2. Fetch documents
      let docs: any[] = [];
      if (selectedEmpId === user.id) {
        docs = await apiClient.documents.getMe();
      } else if (isAdmin) {
        docs = await apiClient.documents.getEmployeeDocuments(selectedEmpId);
      }
      setDocuments(docs);

      // 3. Fetch payroll
      let salaryList: any[] = [];
      if (selectedEmpId === user.id) {
        salaryList = await apiClient.payroll.getMe();
      } else if (isAdmin) {
        salaryList = await apiClient.payroll.getEmployeePayroll(selectedEmpId);
      }
      if (salaryList && salaryList.length > 0) {
        setBasicSalary(Number(salaryList[0].basic_salary) || 0);
        setDeductions(Number(salaryList[0].deductions) || 0);
        setAllowance(0);
      } else {
        setBasicSalary(0);
        setDeductions(0);
        setAllowance(0);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [selectedEmpId, user.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    try {
      if (selectedEmpId === user.id) {
        // Employee saves own contact details
        await apiClient.employees.patchMe({ phone, address });
      } else if (isAdmin) {
        // Admin saves all details
        await apiClient.employees.update(selectedEmpId, {
          full_name: fullName,
          designation,
          phone,
          address,
          department_id: departmentId || null,
          status,
        });

        // Upsert salary structure for current month/year
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        await apiClient.payroll.upsertPayroll(selectedEmpId, {
          month: currentMonth,
          year: currentYear,
          basicSalary,
          deductions,
        });
      }
      setMessage("Profile details saved successfully!");
      setTimeout(() => setMessage(""), 3000);
      loadProfileData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile changes");
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    setErrorMsg("");
    setMessage("");

    const nameWithExt = newDocName.endsWith(".pdf") ? newDocName : `${newDocName}.pdf`;
    const dummyUrl = `https://storage.workmesh.com/docs/${Date.now()}-${nameWithExt}`;

    try {
      if (selectedEmpId === user.id) {
        await apiClient.documents.uploadMe({ doc_type: newDocType, file_url: dummyUrl });
      } else if (isAdmin) {
        await apiClient.documents.uploadEmployeeDocument(selectedEmpId, { doc_type: newDocType, file_url: dummyUrl });
      }
      setNewDocName("");
      setMessage("Document uploaded successfully!");
      setTimeout(() => setMessage(""), 3000);
      loadProfileData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document");
    }
  };

  if (isLoading && documents.length === 0 && !fullName) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-2 font-medium">Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Selector Banner (Admin Only) */}
      {isAdmin && (
        <div className="bg-background border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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
                  {emp.full_name} ({emp.employee_code})
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

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === "details" ? (
        /* ================= DETAILS TAB ================= */
        <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base border border-slate-200/50">
                {fullName ? fullName.split(" ").map(n => n[0]).join("") : "U"}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">{fullName || "Unnamed Profile"}</h3>
                <p className="text-xs text-slate-400">{designation || "No Designation Issued"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Profile fields */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                  General Info
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAdmin}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Department Unit
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                  >
                    <option value="">No Department Assigned</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Employment Status
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="on_notice">On Notice</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Portal Security Role
                    </label>
                    <select
                      disabled={true} // Secure role changes
                      value={role}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact details and Salary structure (Admin edit only) */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                    Contact Vault (Writeable)
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Home Address Location
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200 resize-none"
                    />
                  </div>
                </div>

                {/* Salary details (Admin Only) */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                    Compensation structure {isAdmin ? "(Edit Mode)" : "(View Only)"}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Basic Wage
                      </label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={basicSalary}
                        onChange={(e) => setBasicSalary(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Allowance
                      </label>
                      <input
                        type="number"
                        disabled={true} // Static calculated on backend or mock
                        value={allowance}
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Deductions
                      </label>
                      <input
                        type="number"
                        disabled={!isAdmin}
                        value={deductions}
                        onChange={(e) => setDeductions(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/40 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Estimated Net Salary:</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      ${(basicSalary - deductions).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Vault Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ================= DOCUMENTS TAB ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Upload Area */}
          <div className="bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Issue Document Record
            </h4>
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Record File Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ID_Verification"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Document Type Category
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white outline-none transition-all duration-200"
                >
                  <option value="ID Proof">ID Proof</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Payslip">Payslip</option>
                  <option value="Certificate">Certificate</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-850 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Metadata File</span>
              </button>
            </form>
          </div>

          {/* Documents Table */}
          <div className="lg:col-span-2 bg-background border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Document Vault Repository
            </h4>
            {documents.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No document records found in this vault</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Uploaded At</th>
                      <th className="py-2.5 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map(doc => {
                      const name = doc.file_url ? doc.file_url.split("/").pop() : "document.pdf";
                      const dateStr = doc.uploaded_at ? new Date(doc.uploaded_at).toISOString().split("T")[0] : "None";
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/50">
                          <td className="py-3 font-semibold text-slate-800 max-w-[200px] truncate" title={name}>
                            {name}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                              {doc.doc_type}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">{dateStr}</td>
                          <td className="py-3 text-right">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open URL</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
