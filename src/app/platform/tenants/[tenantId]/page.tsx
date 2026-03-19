"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DropdownMenu } from "@/components/DropdownMenu";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Plus, MoreHorizontal, Pencil, Trash2, Key } from "lucide-react";
import {
  platformApi,
  type TenantSubscriptionDetail,
  type TenantDetail,
  type TenantUser,
  type FeatureCatalogItem,
  type LimitCatalogItem,
  type PlanCatalogItem,
} from "../../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [detail, setDetail] = useState<TenantSubscriptionDetail | null>(null);
  const [features, setFeatures] = useState<FeatureCatalogItem[]>([]);
  const [limits, setLimits] = useState<LimitCatalogItem[]>([]);
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [subscriptionMode, setSubscriptionMode] = useState<"plan" | "custom">("plan");
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [planKey, setPlanKey] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionExpireDate, setSubscriptionExpireDate] = useState("");
  const [overrides, setOverrides] = useState<{ features: Record<string, boolean>; limits: Record<string, number | null> }>({ features: {}, limits: {} });
  const [userMenuOpenId, setUserMenuOpenId] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<TenantUser | null>(null);
  const [deleteTenantConfirm, setDeleteTenantConfirm] = useState(false);
  const [openingTenant, setOpeningTenant] = useState(false);
  const rowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAmount, setBillingAmount] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("GBP");
  const [status, setStatus] = useState("active");

  function loadUsers() {
    if (!tenantId) return;
    platformApi.listTenantUsers(tenantId).then(setUsers).catch(() => setUsers([]));
  }

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      platformApi.getTenant(tenantId).catch(() => null),
      platformApi.getTenantSubscription(tenantId),
      platformApi.getFeatureCatalog(false),
      platformApi.getLimitCatalog(false),
      platformApi.listTenantUsers(tenantId).catch(() => []),
      platformApi.getPlanCatalog(true).catch(() => []),
    ])
      .then(([t, sub, feats, lims, userList, planList]) => {
        if (t) {
          setTenant(t);
          setName(t.name || "");
          setCompanyName(t.companyName || "");
          setEmail(t.email || "");
          setPhone(t.phone || "");
          setBillingAddress(t.billingAddress || "");
          setBillingEmail(t.billingEmail || "");
          setBillingAmount(t.billingAmount != null ? String(t.billingAmount) : "");
          setBillingCycle(t.billingCycle || "monthly");
          setCurrency(t.currency || "GBP");
          setStatus(t.status || "active");
        }
        setDetail(sub);
        setFeatures(feats);
        setLimits(lims);
        setUsers(Array.isArray(userList) ? userList : []);
        setPlans(Array.isArray(planList) ? planList : []);
        setPlanKey(sub.planKey || "");
        setSubscriptionStartDate(sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : "");
        setSubscriptionExpireDate(sub.expireDate ? new Date(sub.expireDate).toISOString().slice(0, 10) : "");
        setOverrides({ features: sub.overrides?.features || {}, limits: sub.overrides?.limits || {} });
        // Use subscriptionType from API response
        setSubscriptionMode(sub.subscriptionType === "custom" ? "custom" : "plan");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  const handleSaveSubscription = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const updated = await platformApi.updateTenantSubscription(tenantId, { subscriptionType: "plan", planKey, overrides, startDate: subscriptionStartDate || null, expireDate: subscriptionExpireDate || null });
      setDetail(updated);
      setOverrides({ features: updated.overrides.features, limits: updated.overrides.limits });
      setSubscriptionStartDate(updated.startDate ? new Date(updated.startDate).toISOString().slice(0, 10) : "");
      setSubscriptionExpireDate(updated.expireDate ? new Date(updated.expireDate).toISOString().slice(0, 10) : "");
      setSubscriptionMode("plan");
      setToast({ message: "Subscription saved" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTenantDetails = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      await platformApi.updateTenant(tenantId, { name: name.trim(), companyName: companyName.trim(), email: email.trim(), phone: phone.trim(), billingAddress: billingAddress.trim() });
      setToast({ message: "Tenant details saved" });
      const t = await platformApi.getTenant(tenantId);
      setTenant(t);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomBilling = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      // Save custom billing to tenant
      await platformApi.updateTenant(tenantId, { billingEmail: billingEmail.trim(), billingAmount: billingAmount === "" ? null : Number(billingAmount), billingCycle, currency: currency.trim() || "GBP", status });
      // Set subscriptionType to custom and clear planKey
      const updated = await platformApi.updateTenantSubscription(tenantId, { subscriptionType: "custom", planKey: "", overrides, startDate: subscriptionStartDate || null, expireDate: subscriptionExpireDate || null });
      setDetail(updated);
      setPlanKey("");
      setSubscriptionMode("custom");
      setToast({ message: "Custom billing saved" });
      const t = await platformApi.getTenant(tenantId);
      setTenant(t);
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true });
    } finally {
      setSaving(false);
    }
  };

  const setFeatureOverride = (key: string, value: boolean | undefined) => {
    setOverrides((prev) => {
      const next = { ...prev, features: { ...prev.features } };
      if (value === undefined) delete next.features[key];
      else next.features[key] = value;
      return next;
    });
  };
  const setLimitOverride = (key: string, value: number | null) => {
    setOverrides((prev) => ({ ...prev, limits: { ...prev.limits, [key]: value } }));
  };

  const handleConfirmDeleteTenant = async () => {
    if (!tenantId) return;
    try {
      await platformApi.deleteTenant(tenantId);
      setToast({ message: "Tenant deleted" });
      router.push("/platform/tenants");
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to delete tenant", error: true });
      setDeleteTenantConfirm(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!tenantId || !deleteUserConfirm) return;
    try {
      await platformApi.deleteTenantUser(tenantId, deleteUserConfirm._id);
      setToast({ message: "User deleted" });
      loadUsers();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to delete", error: true });
    }
    setDeleteUserConfirm(null);
  };

  if (loading || !tenantId) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
        <Link href="/platform/tenants" className="block mt-2 text-orange-600 hover:underline">← Back to Tenants</Link>
      </div>
    );
  }

  const effectiveFeatures = detail?.effective?.enabledFeatures || {};
  const effectiveLimits = detail?.effective?.limits || {};
  const usage = detail?.usage || {};

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}
          <button className="ml-2" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      <Link href="/platform/tenants" className="inline-flex items-center gap-1 text-gray-600 hover:text-orange-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Tenants
      </Link>
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Tenant details</h2>
              <p className="text-sm text-gray-800 mt-1">Name, contact, and billing.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-800">Account: <strong className={status === "active" ? "text-green-700" : "text-amber-700"}>{status === "active" ? "Active" : "Suspended"}</strong></span>
              <button
                type="button"
                onClick={async () => {
                  const newStatus = status === "active" ? "suspended" : "active";
                  setSaving(true);
                  try {
                    await platformApi.updateTenant(tenantId, { status: newStatus });
                    setStatus(newStatus);
                    setToast({ message: newStatus === "suspended" ? "Tenant account disabled" : "Tenant account enabled" });
                    const t = await platformApi.getTenant(tenantId);
                    setTenant(t);
                  } catch (e) {
                    setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className={`px-4 py-2 rounded-lg font-medium disabled:opacity-50 ${status === "active" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300" : "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"}`}
              >
                {status === "active" ? "Disable account" : "Enable account"}
              </button>
            </div>
          </div>
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-1">Subdomain &amp; URL</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {tenant?.tenantSubdomain ? (
                <span className="text-gray-800 font-mono">{tenant.tenantSubdomain}</span>
              ) : (
                <span className="text-gray-500">—</span>
              )}
              {tenant?.tenantUrl ? (
                <a href={tenant.tenantUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline font-mono truncate max-w-[280px]" title={tenant.tenantUrl}>
                  {tenant.tenantUrl}
                </a>
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!tenant?.tenantUrl || !tenantId) return;
                  const firstUser = users.find((u) => u.email);
                  if (!firstUser?.email) {
                    setToast({ message: "Create an admin account first, then open the tenant.", error: true });
                    return;
                  }
                  setOpeningTenant(true);
                  try {
                    const { token } = await platformApi.createTenantLoginToken(tenantId, firstUser.email);
                    const base = tenant.tenantUrl.replace(/\/$/, "");
                    const url = `${base}/auth/platform-callback?token=${encodeURIComponent(token)}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                    setToast({ message: "Opening tenant app…" });
                  } catch (e) {
                    setToast({ message: e instanceof Error ? e.message : "Failed to open tenant", error: true });
                  } finally {
                    setOpeningTenant(false);
                  }
                }}
                disabled={openingTenant || !tenant?.tenantUrl || users.length === 0}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none"
              >
                {openingTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Open tenant (sign in as {users[0]?.email ? `${users[0].email.split("@")[0]}…` : "user"})
              </button>
              {users.length === 0 && (
                <span className="text-xs text-gray-600">Create an admin to open the tenant app.</span>
              )}
            </div>
            <p className="text-xs text-gray-700 mt-1">Subdomain is set when the tenant is created (Add tenant). It cannot be changed from this page.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="block text-xs font-medium text-gray-700">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-xs font-medium text-gray-700">Company name</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-xs font-medium text-gray-700">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div><label className="block text-xs font-medium text-gray-700">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-700">Billing address</label><input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
          </div>
          <div className="mt-4">
            <button onClick={handleSaveTenantDetails} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save tenant details
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Tenant account management</h2>
          <p className="text-sm text-gray-800 mb-4">Create admin, edit password, or delete accounts.</p>
          <div className="flex justify-end mb-3">
            <button onClick={() => setCreateUserOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Create admin account
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-800">Name</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-800">Email</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-800">Roles</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-800">Status</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-gray-800">Last login</th>
                  <th className="text-right py-2 px-3 text-sm font-semibold text-gray-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2 px-3 text-sm text-gray-800">{u.email}</td>
                    <td className="py-2 px-3">{(u.roles && (u.roles as { name: string }[]).length) ? (u.roles as { name: string }[]).map((r) => r.name).join(", ") : (u.role ? String(u.role).charAt(0).toUpperCase() + String(u.role).slice(1) : "—")}</td>
                    <td className="py-2 px-3">{u.isActive ? <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Active</span> : <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">Disabled</span>}</td>
                    <td className="py-2 px-3 text-sm text-gray-700">{u.lastLogin ? formatDateTimeLondon(u.lastLogin) : "—"}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          rowMenuTriggerRef.current = e.currentTarget;
                          setUserMenuOpenId(userMenuOpenId === u._id ? null : u._id);
                        }}
                        className="p-1.5 rounded hover:bg-gray-200"
                        aria-label="Open actions menu"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-700" />
                      </button>
                      <DropdownMenu
                        open={userMenuOpenId === u._id}
                        onClose={() => setUserMenuOpenId(null)}
                        triggerRef={rowMenuTriggerRef}
                        align="right"
                        className="w-44"
                      >
                        {tenant?.tenantUrl && (
                          <button
                            type="button"
                            onClick={async () => {
                              setUserMenuOpenId(null);
                              if (!tenant?.tenantUrl || !u.email) return;
                              setOpeningTenant(true);
                              try {
                                const { token } = await platformApi.createTenantLoginToken(tenantId, u.email);
                                const base = tenant.tenantUrl.replace(/\/$/, "");
                                window.open(`${base}/auth/platform-callback?token=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
                                setToast({ message: "Opening tenant as " + u.email });
                              } catch (e) {
                                setToast({ message: e instanceof Error ? e.message : "Failed to open tenant", error: true });
                              } finally {
                                setOpeningTenant(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            Open tenant as this user
                          </button>
                        )}
                        <button type="button" onClick={() => { setEditingUser(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button type="button" onClick={() => { setUserMenuOpenId(null); const pwd = window.prompt("New password (min 8 chars, upper, lower, number, special):"); if (pwd) platformApi.resetTenantUserPassword(tenantId, u._id, pwd).then(() => { setToast({ message: "Password reset" }); loadUsers(); }).catch((e) => setToast({ message: e instanceof Error ? e.message : "Failed", error: true })); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Key className="h-3.5 w-3.5" /> Reset password</button>
                        <button type="button" onClick={() => { setDeleteUserConfirm(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="py-4 text-center text-gray-700 text-sm">No users. Create an admin account for this tenant.</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="subscriptionMode"
                checked={subscriptionMode === "plan"}
                onChange={() => setSubscriptionMode("plan")}
                className="w-4 h-4 text-orange-500"
              />
              <span className="text-sm font-medium text-gray-800">Select Plan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="subscriptionMode"
                checked={subscriptionMode === "custom"}
                onChange={() => { setSubscriptionMode("custom"); setPlanKey(""); }}
                className="w-4 h-4 text-orange-500"
              />
              <span className="text-sm font-medium text-gray-800">Custom Billing</span>
            </label>
          </div>
          {subscriptionMode === "plan" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.planKey} value={p.planKey}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start date</label><input type="date" value={subscriptionStartDate} onChange={(e) => setSubscriptionStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expire date</label><input type="date" value={subscriptionExpireDate} onChange={(e) => setSubscriptionExpireDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing email</label><input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing amount</label><input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing cycle</label><select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="GBP">GBP</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2"><option value="active">Active</option><option value="suspended">Suspended</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Start date</label><input type="date" value={subscriptionStartDate} onChange={(e) => setSubscriptionStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expire date</label><input type="date" value={subscriptionExpireDate} onChange={(e) => setSubscriptionExpireDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" /></div>
            </div>
          )}
          <div className="mt-4">
            <button onClick={subscriptionMode === "plan" ? handleSaveSubscription : handleSaveCustomBilling} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {subscriptionMode === "plan" ? "Save subscription" : "Save custom billing"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Feature overrides</h2>
          {features.length === 0 ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">No features in catalog. Run seed:entitlements on the backend.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><span className="font-medium text-gray-900">{f.name}</span><span className="ml-2 text-xs text-gray-700">({f.key})</span><p className="text-xs text-gray-700 mt-0.5">Effective: {effectiveFeatures[f.key] ? "On" : "Off"}</p></div>
                  <select value={overrides.features[f.key] === undefined ? "" : overrides.features[f.key] ? "true" : "false"} onChange={(e) => { const v = e.target.value; setFeatureOverride(f.key, v === "" ? undefined : v === "true"); }} className="border border-gray-300 rounded px-2 py-1 text-sm">
                    <option value="">Plan default</option><option value="true">On</option><option value="false">Off</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSaveSubscription} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save feature overrides
            </button>
            <span className="text-xs text-gray-700">Saves plan, feature & limit overrides, and dates.</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Limit overrides</h2>
          {limits.length === 0 ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">No limits in catalog.</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {limits.map((l) => (
                <div key={l.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div><span className="font-medium text-gray-900">{l.name}</span><span className="ml-2 text-xs text-gray-700">({l.key})</span><p className="text-xs text-gray-700 mt-0.5">Effective: {effectiveLimits[l.key] ?? "—"} · Usage: {usage[l.key] ?? 0}</p></div>
                  <input type="number" min={0} placeholder="Plan default" value={overrides.limits[l.key] ?? ""} onChange={(e) => setLimitOverride(l.key, e.target.value === "" ? null : parseInt(e.target.value, 10))} className="border border-gray-300 rounded px-2 py-1 w-24 text-sm" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSaveSubscription} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save limit overrides
            </button>
            <span className="text-xs text-gray-700">Saves plan, feature & limit overrides, and dates.</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <h2 className="font-semibold text-red-800 mb-2">Danger zone</h2>
          <p className="text-sm text-gray-800 mb-4">Permanently remove this tenant and its subscription from the platform.</p>
          <button type="button" onClick={() => setDeleteTenantConfirm(true)} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">Delete tenant</button>
        </div>
      </div>

      {deleteTenantConfirm && tenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2>
            <p className="text-sm text-gray-800 mt-1">Remove <strong>{name || tenantId}</strong>? This removes the tenant and its subscription. This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteTenantConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
              <button onClick={handleConfirmDeleteTenant} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}

      {createUserOpen && tenantId && (
        <CreateTenantUserModal tenantId={tenantId} onClose={() => setCreateUserOpen(false)} onCreated={() => { loadUsers(); setCreateUserOpen(false); setToast({ message: "Admin account created" }); }} setToast={setToast} />
      )}
      {editingUser && tenantId && (
        <EditTenantUserModal tenantId={tenantId} user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { loadUsers(); setEditingUser(null); setToast({ message: "User updated" }); }} setToast={setToast} />
      )}
      {deleteUserConfirm && tenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800">Delete user</h2>
            <p className="text-sm text-gray-800 mt-1">Remove <strong>{deleteUserConfirm.email}</strong>? They will no longer be able to sign in.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteUserConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
              <button onClick={handleConfirmDeleteUser} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTenantUserModal({ tenantId, onClose, onCreated, setToast }: { tenantId: string; onClose: () => void; onCreated: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [assignAllRoles, setAssignAllRoles] = useState(true);
  const [saving, setSaving] = useState(false);
  async function submit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setToast({ message: "Email is required", error: true }); return; }
    if (password.length < 10) { setToast({ message: "Password must be at least 10 characters (upper, lower, number)", error: true }); return; }
    setSaving(true);
    try {
      await platformApi.createTenantUser(tenantId, { name: name.trim() || trimmedEmail.split("@")[0], email: trimmedEmail, password, assignAllRoles, isActive: true });
      onCreated();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to create user", error: true });
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create admin account</h2>
        <p className="text-sm text-gray-800 mt-1">Create a user for this tenant with all roles (admin).</p>
        <div className="mt-4 space-y-4">
          <div><label className="block text-xs font-medium text-gray-800">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Admin" /></div>
          <div><label className="block text-xs font-medium text-gray-800">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="admin@tenant.com" /></div>
          <div><label className="block text-xs font-medium text-gray-800">Password (min 10 chars, upper, lower, number)</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={assignAllRoles} onChange={(e) => setAssignAllRoles(e.target.checked)} /><span className="text-sm font-medium text-gray-800">Assign all roles (admin)</span></label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
          <button onClick={submit} disabled={saving || !email.trim() || password.length < 10} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Creating…" : "Create"}</button>
        </div>
      </div>
    </div>
  );
}

type TenantRole = { _id: string; name: string; description?: string };

function EditTenantUserModal({ tenantId, user, onClose, onSaved, setToast }: { tenantId: string; user: TenantUser; onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isActive, setIsActive] = useState(user.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>(() => {
    const r = user.roles ?? [];
    return r.map((role: { _id?: string } | string) => (typeof role === "object" && role && "_id" in role ? (role._id ?? "") : String(role))).filter(Boolean);
  });
  const [assignAllRoles, setAssignAllRoles] = useState(false);
  const [roles, setRoles] = useState<TenantRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformApi.listRoles(tenantId).then((list) => { setRoles(list); setRolesLoading(false); }).catch(() => setRolesLoading(false));
  }, [tenantId]);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setIsActive(user.isActive);
    const r = user.roles ?? [];
    const ids = r.map((role: { _id?: string } | string) => (typeof role === "object" && role && "_id" in role ? (role._id ?? "") : String(role))).filter(Boolean);
    setRoleIds(ids);
  }, [user]);

  useEffect(() => {
    if (roles.length > 0 && roleIds.length === roles.length) setAssignAllRoles(true);
  }, [roles.length, roleIds.length]);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setAssignAllRoles(false);
  }

  function toggleAssignAllRoles() {
    if (assignAllRoles) { setRoleIds([]); setAssignAllRoles(false); } else { setRoleIds(roles.map((r) => r._id)); setAssignAllRoles(true); }
  }

  async function submit() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) { setToast({ message: "Email is required", error: true }); return; }
    setSaving(true);
    try {
      const finalRoleIds = assignAllRoles ? roles.map((r) => r._id) : roleIds;
      await platformApi.updateTenantUser(tenantId, user._id, { name: name.trim(), email: trimmedEmail, isActive, roleIds: finalRoleIds });
      if (newPassword.length >= 10) await platformApi.resetTenantUserPassword(tenantId, user._id, newPassword);
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
        <h2 className="text-lg font-semibold text-gray-800">Edit user</h2>
        <p className="text-sm text-gray-800 mt-1">Update name, email, roles, status, or set a new password.</p>
        <div className="mt-4 space-y-4">
          <div><label className="block text-xs font-medium text-gray-800">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
          <div><label className="block text-xs font-medium text-gray-800">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /><span className="text-sm font-medium text-gray-800">Active (can sign in)</span></label>
          {!rolesLoading && roles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Roles</label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input type="checkbox" checked={assignAllRoles} onChange={toggleAssignAllRoles} />
                <span className="text-sm font-medium text-gray-800">Assign all roles (admin)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <label key={r._id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={roleIds.includes(r._id)} onChange={() => toggleRole(r._id)} />
                    <span className="text-sm">{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div><label className="block text-xs font-medium text-gray-800">New password (leave blank to keep)</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Min 10 characters" /></div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">Cancel</button>
          <button onClick={submit} disabled={saving || !email.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
