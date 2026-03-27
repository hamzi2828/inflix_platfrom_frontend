"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DropdownMenu } from "@/components/DropdownMenu";
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw, Shield, Check, X as XIcon } from "lucide-react";
import { platformApi, type PlatformAdminAccount } from "../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export default function PlatformAdminAccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformAdminAccount | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PlatformAdminAccount | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const rowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  function load() {
    setLoading(true);
    platformApi.listAdminAccounts().then(setAccounts).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const activeCount = accounts.filter((a) => a.isActive).length;
  const inactiveCount = accounts.length - activeCount;

  if (loading && accounts.length === 0) {
    return <div className="flex items-center justify-center py-20 gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading admin accounts...</div>;
  }

  if (error && accounts.length === 0) {
    return <div className="max-w-xl mx-auto mt-12 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}<Link href="/platform" className="block mt-2 text-orange-600 hover:underline">Back to Platform</Link></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}<button className="ml-2 font-bold" onClick={() => setToast(null)}>x</button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Accounts</h1>
            <p className="text-sm text-gray-500">Manage accounts that can sign in to the Platform Console.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setError(null); load(); }} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium shadow-sm transition-all text-sm">
            <Plus className="h-4 w-4" /> Create Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">{activeCount} active</span>
        {inactiveCount > 0 && <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">{inactiveCount} disabled</span>}
        <span className="text-xs text-gray-400">{accounts.length} total</span>
      </div>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No platform admin accounts.</p>
          <p className="text-xs text-gray-400 mb-4">Create one below or run: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">npm run seed:platform-admin</code></p>
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">
            <Plus className="h-4 w-4" /> Create Admin
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
          <div className="divide-y divide-gray-100">
            {accounts.map((a) => (
              <div key={a._id} className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 ${!a.isActive ? "opacity-60" : ""}`}>
                {/* Avatar / status */}
                <span className={`inline-flex w-9 h-9 items-center justify-center rounded-full shrink-0 text-sm font-semibold ${a.isActive ? "bg-orange-100 text-orange-700" : "bg-gray-200 text-gray-500"}`}>
                  {a.email.charAt(0).toUpperCase()}
                </span>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.email}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 shrink-0">{a.role}</span>
                    {a.isActive ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 shrink-0"><Check className="h-3 w-3" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500 shrink-0"><XIcon className="h-3 w-3" /> Disabled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    {a.createdAtUtc && <span>Created: {formatDateTimeLondon(a.createdAtUtc)}</span>}
                    {a.updatedAtUtc && <span>Updated: {formatDateTimeLondon(a.updatedAtUtc)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { rowMenuTriggerRef.current = e.currentTarget; setMenuOpenId(menuOpenId === a._id ? null : a._id); }}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                    aria-label="Open actions menu"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  <DropdownMenu open={menuOpenId === a._id} onClose={() => setMenuOpenId(null)} triggerRef={rowMenuTriggerRef} align="right" className="w-40">
                    <button type="button" onClick={() => { setEditing(a); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-orange-50 flex items-center gap-2 text-gray-800"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                    <button type="button" onClick={() => { setDeleteConfirm(a); setMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {createOpen && <CreateAdminModal onClose={() => setCreateOpen(false)} onSaved={() => { load(); setCreateOpen(false); setToast({ message: "Admin account created" }); }} setToast={setToast} />}
      {editing && <EditAdminModal account={editing} onClose={() => setEditing(null)} onSaved={() => { load(); setEditing(null); setToast({ message: "Admin account updated" }); }} setToast={setToast} />}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-800">Delete platform admin</h2>
          <p className="text-sm text-gray-600 mt-1">Remove <strong>{deleteConfirm.email}</strong>? They will no longer be able to sign in. You cannot delete the last active admin.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">Cancel</button>
            <button onClick={async () => { try { await platformApi.deleteAdminAccount(deleteConfirm._id); setToast({ message: "Admin account deleted" }); load(); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to delete", error: true }); } setDeleteConfirm(null); }} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

function CreateAdminModal({ onClose, onSaved, setToast }: { onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [saving, setSaving] = useState(false);
  async function submit() { const trimmed = email.trim().toLowerCase(); if (!trimmed) { setToast({ message: "Email is required", error: true }); return; } if (password.length < 10) { setToast({ message: "Password: min 10 chars, upper, lower, number", error: true }); return; } setSaving(true); try { await platformApi.createAdminAccount({ email: trimmed, password, role: "platform_admin" }); onSaved(); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed", error: true }); } finally { setSaving(false); } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 className="text-lg font-semibold text-gray-900">Create platform admin</h2><p className="text-sm text-gray-500 mt-1">New account will have full access to the Platform Console.</p>
      <div className="mt-4 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="admin@inflix.co.uk" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-gray-400 font-normal">(min 10 chars, upper, lower, number)</span></label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Cancel</button><button onClick={submit} disabled={saving || !email.trim() || password.length < 10} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Creating..." : "Create"}</button></div>
    </div></div>
  );
}

function EditAdminModal({ account, onClose, onSaved, setToast }: { account: PlatformAdminAccount; onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [email, setEmail] = useState(account.email); const [isActive, setIsActive] = useState(account.isActive); const [newPassword, setNewPassword] = useState(""); const [saving, setSaving] = useState(false);
  async function submit() { const trimmed = email.trim().toLowerCase(); if (!trimmed) { setToast({ message: "Email is required", error: true }); return; } setSaving(true); try { await platformApi.updateAdminAccount(account._id, { email: trimmed, isActive, ...(newPassword.length >= 10 ? { newPassword } : {}) }); onSaved(); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed", error: true }); } finally { setSaving(false); } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 className="text-lg font-semibold text-gray-900">Edit platform admin</h2><p className="text-sm text-gray-500 mt-1">Update email, status, or set a new password.</p>
      <div className="mt-4 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" /><span className="text-sm font-medium text-gray-700">Active (can sign in)</span></label>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">New password <span className="text-gray-400 font-normal">(leave blank to keep)</span></label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Min 10 characters" /></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Cancel</button><button onClick={submit} disabled={saving || !email.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>
    </div></div>
  );
}
