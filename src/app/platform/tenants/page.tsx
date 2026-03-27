"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Users, ChevronRight, ExternalLink } from "lucide-react";
import { platformApi, type TenantListItem } from "../service/platformApi";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TenantListItem | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  function load() {
    setLoading(true);
    platformApi.getTenants().then(setTenants).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading && tenants.length === 0) {
    return <div className="flex items-center justify-center py-20 gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading tenants...</div>;
  }

  if (error && tenants.length === 0) {
    return <div className="max-w-xl mx-auto mt-12 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}<Link href="/platform" className="block mt-2 text-orange-600 hover:underline">Back to Platform</Link></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}
          <button className="ml-2" onClick={() => setToast(null)}>x</button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
            <p className="text-sm text-gray-500">{tenants.length} tenant{tenants.length !== 1 ? "s" : ""} registered</p>
          </div>
        </div>
        <Link href="/platform/tenants/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium shadow-sm transition-all text-sm">
          <Plus className="h-4 w-4" /> Add Tenant
        </Link>
      </div>

      {/* Tenant cards */}
      {tenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No tenants yet. Create your first tenant to get started.</p>
          <Link href="/platform/tenants/add" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
            <Plus className="h-4 w-4" /> Add Tenant
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((t) => {
            const isSuspended = t.status === "suspended";
            const sym = (t.currency || "GBP") === "EUR" ? "\u20AC" : (t.currency || "GBP") === "USD" ? "$" : "\u00A3";
            const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
            const expDays = t.expireDate ? Math.ceil((new Date(t.expireDate).getTime() - Date.now()) / 86400000) : null;

            return (
              <div key={t.tenantId} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${isSuspended ? "border-red-200" : "border-gray-200"}`}>
                {/* Top row: Name, status, actions */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isSuspended ? "bg-red-500" : "bg-green-500"}`} />
                    <h3 className="font-semibold text-gray-900 truncate">{t.name || t.tenantId}</h3>
                    {t.companyName && t.companyName !== t.name && <span className="text-sm text-gray-500 truncate hidden sm:inline">({t.companyName})</span>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/platform/tenants/${encodeURIComponent(t.tenantId)}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                      Manage <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button type="button" onClick={() => setDeleteConfirm(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete tenant">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Detail grid */}
                <div className="px-5 py-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
                    {/* Tenant ID */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Tenant ID</p>
                      <p className="text-sm font-mono text-gray-700">{t.tenantId}</p>
                    </div>

                    {/* Subdomain / URL */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Subdomain</p>
                      <p className="text-sm font-mono text-gray-700">{t.tenantSubdomain || "—"}</p>
                      {t.tenantUrl && (
                        <a href={t.tenantUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-orange-600 hover:underline truncate max-w-full mt-0.5">
                          <ExternalLink className="h-3 w-3 shrink-0" /> {t.tenantUrl}
                        </a>
                      )}
                    </div>

                    {/* Plan */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Plan</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">{t.planKey || "—"}</span>
                    </div>

                    {/* Billing */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Billing</p>
                      <p className="text-sm font-medium text-gray-800">
                        {t.billingAmount != null ? `${sym}${t.billingAmount.toLocaleString()} / ${t.billingCycle || "monthly"}` : "—"}
                      </p>
                    </div>

                    {/* Start date */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Start</p>
                      <p className="text-sm text-gray-700">{formatDate(t.startDate)}</p>
                    </div>

                    {/* Expire date */}
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Expires</p>
                      <p className="text-sm text-gray-700">{formatDate(t.expireDate)}</p>
                      {expDays != null && (
                        <p className={`text-xs mt-0.5 ${expDays < 0 ? "text-red-600 font-medium" : expDays <= 30 ? "text-amber-600" : "text-gray-400"}`}>
                          {expDays < 0 ? `Expired ${Math.abs(expDays)}d ago` : expDays === 0 ? "Expires today" : `${expDays}d remaining`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Second row: Contact & DB */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {t.email && <span>Contact: <span className="text-gray-700">{t.email}</span></span>}
                    {t.phone && <span>Phone: <span className="text-gray-700">{t.phone}</span></span>}
                    {t.billingEmail && <span>Billing: <span className="text-gray-700">{t.billingEmail}</span></span>}
                    <span>DB: <span className="font-mono text-gray-600">tenant_{t.tenantId}</span></span>
                    <span>Currency: <span className="text-gray-700">{t.currency || "GBP"}</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2>
            <p className="text-sm text-gray-600 mt-1">Remove <strong>{deleteConfirm.name || deleteConfirm.tenantId}</strong>? This removes the tenant and its subscription.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
              <button onClick={async () => {
                try { await platformApi.deleteTenant(deleteConfirm.tenantId); setToast({ message: "Tenant deleted" }); load(); setDeleteConfirm(null); }
                catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to delete tenant", error: true }); }
              }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
