"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DropdownMenu } from "@/components/DropdownMenu";
import { ArrowLeft, Loader2, Plus, MoreHorizontal, Pencil, Trash2, RefreshCw } from "lucide-react";
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
    platformApi
      .listAdminAccounts()
      .then(setAccounts)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading admin accounts...
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
        <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">← Back to Platform</Link>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}
          <button className="ml-2" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      <Link href="/platform" className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Platform Admin Accounts</h2>
            <p className="text-sm text-gray-600">Create and manage accounts that can sign in to the Platform Console.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setError(null); load(); }} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Create admin
            </button>
          </div>
        </div>
        <div className="overflow-x-auto -mx-px min-h-[420px]">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Updated</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-800 w-24 min-w-[6rem]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate" title={a.email}>{a.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">{a.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    {a.isActive ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">Disabled</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 whitespace-nowrap">{a.updatedAtUtc ? formatDateTimeLondon(a.updatedAtUtc) : "—"}</td>
                  <td className="py-3 px-4 text-right w-24 min-w-[6rem] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        rowMenuTriggerRef.current = e.currentTarget;
                        setMenuOpenId(menuOpenId === a._id ? null : a._id);
                      }}
                      className="p-2 rounded-md hover:bg-gray-200 text-gray-700 border border-transparent hover:border-gray-300"
                      aria-label="Open actions menu"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    <DropdownMenu
                      open={menuOpenId === a._id}
                      onClose={() => setMenuOpenId(null)}
                      triggerRef={rowMenuTriggerRef}
                      align="right"
                      className="w-40"
                    >
                      <button type="button" onClick={() => { setEditing(a); setMenuOpenId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex items-center gap-2 text-gray-800">
                        <Pencil className="h-3.5 w-3.5 shrink-0" /> Edit
                      </button>
                      <button type="button" onClick={() => { setDeleteConfirm(a); setMenuOpenId(null); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
                        <Trash2 className="h-3.5 w-3.5 shrink-0" /> Delete
                      </button>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {accounts.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-600">No platform admin accounts. Create one below or run: <code className="bg-gray-100 px-1 rounded text-sm">npm run seed:platform-admin -- --email you@example.com --password &quot;YourPass1!&quot;</code></p>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateAdminModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => { load(); setCreateOpen(false); setToast({ message: "Admin account created" }); }}
          setToast={setToast}
        />
      )}
      {editing && (
        <EditAdminModal
          account={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { load(); setEditing(null); setToast({ message: "Admin account updated" }); }}
          setToast={setToast}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800">Delete platform admin</h2>
            <p className="text-sm text-gray-800 mt-1">Remove <strong>{deleteConfirm.email}</strong>? They will no longer be able to sign in. You cannot delete the last active admin.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await platformApi.deleteAdminAccount(deleteConfirm._id);
                    setToast({ message: "Admin account deleted" });
                    load();
                  } catch (e) {
                    setToast({ message: e instanceof Error ? e.message : "Failed to delete", error: true });
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAdminModal({ onClose, onSaved, setToast }: { onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setToast({ message: "Email is required", error: true }); return; }
    if (password.length < 10) { setToast({ message: "Password must be at least 10 characters (upper, lower, number)", error: true }); return; }
    setSaving(true);
    try {
      await platformApi.createAdminAccount({ email: trimmed, password, role: "platform_admin" });
      onSaved();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to create", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-800">Create platform admin</h2>
        <p className="text-sm text-gray-800 mt-1">New account will have full access to the Platform Console.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-800">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="admin@inflix.co.uk" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800">Password (min 10 chars, upper, lower, number)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
          <button onClick={submit} disabled={saving || !email.trim() || password.length < 10} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAdminModal({ account, onClose, onSaved, setToast }: { account: PlatformAdminAccount; onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [email, setEmail] = useState(account.email);
  const [isActive, setIsActive] = useState(account.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setToast({ message: "Email is required", error: true }); return; }
    setSaving(true);
    try {
      await platformApi.updateAdminAccount(account._id, { email: trimmed, isActive, ...(newPassword.length >= 10 ? { newPassword } : {}) });
      onSaved();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-800">Edit platform admin</h2>
        <p className="text-sm text-gray-800 mt-1">Update email, status, or set a new password.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-800">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="edit-active" className="text-gray-800 font-medium">Active (can sign in)</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800">New password (leave blank to keep current)</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Min 10 characters" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
          <button onClick={submit} disabled={saving || !email.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
