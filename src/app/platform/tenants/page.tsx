"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ChevronRight, Plus, Trash2, Copy, Check } from "lucide-react";
import { platformApi, type TenantListItem, type CreateTenantResult, type PlanCatalogItem } from "../service/platformApi";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreateTenantResult | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TenantListItem | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  function load() {
    setLoading(true);
    platformApi
      .getTenants()
      .then(setTenants)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading tenants...
      </div>
    );
  }

  if (error && tenants.length === 0) {
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Tenants</h2>
            <p className="text-sm text-gray-800">Add tenants, set details and billing, then manage plan and accounts.</p>
          </div>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Plus className="h-4 w-4" /> Add tenant
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-300">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Subdomain / URL</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Contact</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Billing</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-800">Start date</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-800"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.tenantId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{t.name || t.tenantId}</div>
                    <div className="text-xs text-gray-600 font-mono">{t.tenantId}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {t.tenantSubdomain ? (
                      <>
                        <span className="font-mono">{t.tenantSubdomain}</span>
                        {t.tenantUrl && <span className="block text-xs text-gray-600 truncate max-w-[200px]" title={t.tenantUrl}>{t.tenantUrl}</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {t.email || "—"}
                    {t.phone && <span className="block text-xs text-gray-700">{t.phone}</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {t.billingAmount != null ? `${t.currency || "GBP"} ${t.billingAmount} / ${t.billingCycle || "monthly"}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">{t.planKey ?? "No plan"}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    {t.startDate ? new Date(t.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/platform/tenants/${encodeURIComponent(t.tenantId)}`} className="text-orange-600 hover:underline inline-flex items-center gap-1">
                        Manage <ChevronRight className="h-4 w-4" />
                      </Link>
                      <button type="button" onClick={() => setDeleteConfirm(t)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete tenant" aria-label="Delete tenant">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tenants.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-800">No tenants yet. Click &quot;Add tenant&quot; to create one.</div>
        )}
      </div>

      {addOpen && (
        <AddTenantModal
          onClose={() => {
            setAddOpen(false);
            setCreatedResult(null);
          }}
          onCreated={(result) => {
            setCreatedResult(result);
            setAddOpen(false);
          }}
        />
      )}

      {createdResult && (
        <TenantCreatedSuccessModal
          result={createdResult}
          onClose={() => {
            setCreatedResult(null);
            load();
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2>
            <p className="text-sm text-gray-600 mt-1">
              Remove <strong>{deleteConfirm.name || deleteConfirm.tenantId}</strong>? This removes the tenant and its subscription. Users and data for this tenant remain in the database but will no longer have an active subscription.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await platformApi.deleteTenant(deleteConfirm.tenantId);
                    setToast({ message: "Tenant deleted" });
                    load();
                    setDeleteConfirm(null);
                  } catch (e) {
                    setToast({ message: e instanceof Error ? e.message : "Failed to delete tenant", error: true });
                  }
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

const PASSWORD_MIN_LEN = 10;
function isValidFirstAdminPassword(pwd: string): boolean {
  if (pwd.length < PASSWORD_MIN_LEN) return false;
  if (!/[A-Z]/.test(pwd)) return false;
  if (!/[a-z]/.test(pwd)) return false;
  if (!/\d/.test(pwd)) return false;
  return true;
}

const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
function isValidSubdomain(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t.length >= 3 && t.length <= 30 && SUBDOMAIN_REGEX.test(t);
}
const PREVIEW_DOMAIN = process.env.NEXT_PUBLIC_TENANT_PREVIEW_DOMAIN || "inflix.uk";

function AddTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: (result: CreateTenantResult) => void }) {
  const [tenantSubdomain, setTenantSubdomain] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAmount, setBillingAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("GBP");
  const [planKey, setPlanKey] = useState("starter");
  const [pricingSource, setPricingSource] = useState<"catalog" | "custom">("catalog");
  const [selectedCatalogPlanKey, setSelectedCatalogPlanKey] = useState("");
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createFirstAdmin, setCreateFirstAdmin] = useState(false);
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const [firstAdminPassword, setFirstAdminPassword] = useState("");
  const [firstAdminName, setFirstAdminName] = useState("");
  const subdomainNormalized = tenantSubdomain.trim().toLowerCase();

  const loadPlans = useCallback(() => {
    setPlansLoading(true);
    platformApi
      .getPlanCatalog(false)
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (plans.length > 0 && pricingSource === "catalog" && !selectedCatalogPlanKey) {
      setSelectedCatalogPlanKey(plans[0].planKey);
    }
  }, [plans, pricingSource, selectedCatalogPlanKey]);

  const effectivePlanKey = pricingSource === "catalog" ? (selectedCatalogPlanKey || planKey) : planKey;

  useEffect(() => {
    if (pricingSource !== "catalog" || !selectedCatalogPlanKey) return;
    const plan = plans.find((p) => p.planKey === selectedCatalogPlanKey);
    if (!plan) return;
    setPlanKey(plan.planKey);
    const pm = plan.priceMetadata && typeof plan.priceMetadata === "object" ? (plan.priceMetadata as { monthly?: number; yearly?: number; currency?: string }) : null;
    if (pm) {
      setCurrency(pm.currency ?? "GBP");
      if (pm.monthly != null) {
        setBillingCycle("monthly");
        setBillingAmount(String(pm.monthly));
      } else if (pm.yearly != null) {
        setBillingCycle("yearly");
        setBillingAmount(String(pm.yearly));
      }
    }
  }, [pricingSource, selectedCatalogPlanKey, plans]);
  const subdomainPreview = subdomainNormalized
    ? `https://${subdomainNormalized}.${PREVIEW_DOMAIN}`
    : "";
  const subdomainError =
    tenantSubdomain.trim() !== "" && !isValidSubdomain(tenantSubdomain)
      ? "3–30 characters, lowercase letters, numbers, hyphens only (no leading/trailing hyphen)"
      : "";

  async function submit() {
    const displayName = (name || companyName || "").trim() || "New Tenant";
    setError("");
    const sub = tenantSubdomain.trim().toLowerCase();
    if (!sub) {
      setError("Subdomain is required.");
      return;
    }
    if (!isValidSubdomain(tenantSubdomain)) {
      setError("Subdomain must be 3–30 characters, lowercase letters, numbers, and hyphens only (cannot start or end with hyphen).");
      return;
    }
    if (createFirstAdmin) {
      const em = firstAdminEmail.trim();
      if (!em) {
        setError("First admin email is required when creating first admin user.");
        return;
      }
      if (!firstAdminPassword) {
        setError("First admin password is required when creating first admin user.");
        return;
      }
      if (!isValidFirstAdminPassword(firstAdminPassword)) {
        setError("Password must be at least 10 characters with 1 uppercase, 1 lowercase, and 1 number.");
        return;
      }
    }
    setSaving(true);
    try {
      const body: Parameters<typeof platformApi.createTenant>[0] = {
        tenantSubdomain: sub,
        name: displayName,
        companyName: companyName.trim() || undefined,
        contactEmail: email.trim() || undefined,
        contactPhone: phone.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        billingEmail: billingEmail.trim() || undefined,
        billingAmount: billingAmount === "" ? undefined : Number(billingAmount),
        billingCycle,
        currency: currency.trim() || "GBP",
        planKey: (pricingSource === "catalog" ? effectivePlanKey : planKey).trim() || "starter",
      };
      if (createFirstAdmin) {
        body.createFirstAdmin = true;
        body.firstAdmin = {
          email: firstAdminEmail.trim().toLowerCase(),
          password: firstAdminPassword,
          name: firstAdminName.trim() || undefined,
        };
      }
      const result = await platformApi.createTenant(body);
      onCreated(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-gray-900">Add tenant</h2>
        <p className="text-sm text-gray-800 mt-1">Name, contact, and billing. Optionally create first admin user in tenant DB.</p>
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-800">Subdomain (tenant name)</label>
            <input
              value={tenantSubdomain}
              onChange={(e) => setTenantSubdomain(e.target.value.replace(/\s/g, ""))}
              className={`w-full mt-1 px-3 py-2 border rounded-lg ${subdomainError ? "border-red-400 bg-red-50/50" : "border-gray-300"}`}
              placeholder="acme"
              aria-invalid={!!subdomainError}
              aria-describedby={subdomainError ? "subdomain-error" : undefined}
            />
            {subdomainError && (
              <p id="subdomain-error" className="mt-1 text-xs text-red-600">{subdomainError}</p>
            )}
            {subdomainPreview && (
              <p className="mt-1 text-xs text-gray-700">Preview: <span className="font-mono text-gray-800">{subdomainPreview}</span></p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-800">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Acme Ltd" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800">Company name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Acme Ltd" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-800">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="billing@acme.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="+44 …" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800">Billing address</label>
            <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Street, city, postcode" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800">Billing email</label>
            <input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="invoices@acme.com" />
          </div>
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Plan & pricing</h3>
            <p className="text-xs text-gray-600 mb-3">Choose a plan from the catalog (with optional pricing) or set custom pricing. Plans define features and limits.</p>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pricingSource" checked={pricingSource === "catalog"} onChange={() => setPricingSource("catalog")} className="text-orange-600 border-gray-300 focus:ring-orange-500" />
                <span className="text-sm font-medium text-gray-800">From plan catalog</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pricingSource"
                  checked={pricingSource === "custom"}
                  onChange={() => {
                    setPricingSource("custom");
                    if (plans.length > 0 && !plans.some((p) => p.planKey === planKey)) setPlanKey(plans[0].planKey);
                  }}
                  className="text-orange-600 border-gray-300 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-800">Custom pricing</span>
              </label>
            </div>
            {pricingSource === "catalog" ? (
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">Plan</label>
                <select
                  value={selectedCatalogPlanKey}
                  onChange={(e) => setSelectedCatalogPlanKey(e.target.value)}
                  disabled={plansLoading}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                >
                  {plansLoading ? (
                    <option>Loading plans…</option>
                  ) : plans.length === 0 ? (
                    <option value="">No plans — add plans in Plan catalog</option>
                  ) : (
                    plans.map((p) => {
                      const pm = p.priceMetadata && typeof p.priceMetadata === "object" ? (p.priceMetadata as { monthly?: number; yearly?: number; currency?: string }) : null;
                      const priceStr = pm ? [pm.monthly != null && `${pm.monthly} ${pm.currency ?? ""}/mo`, pm.yearly != null && `${pm.yearly} ${pm.currency ?? ""}/yr`].filter(Boolean).join(" · ") || "—" : "—";
                      return (
                        <option key={p.planKey} value={p.planKey}>
                          {p.name} ({p.planKey}) — {priceStr}
                        </option>
                      );
                    })
                  )}
                </select>
                {plans.length === 0 && !plansLoading && (
                  <p className="mt-1 text-xs text-amber-700">
                    <Link href="/platform/plan-catalog" className="underline" target="_blank" rel="noopener noreferrer">Add plans in Plan catalog</Link> first.
                  </p>
                )}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Amount</label>
                    <input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Currency</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Billing cycle</label>
                    <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">Plan (for features & limits)</label>
                <select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
                  {plans.map((p) => (
                    <option key={p.planKey} value={p.planKey}>{p.name} ({p.planKey})</option>
                  ))}
                  {plans.length === 0 && <option value="starter">starter</option>}
                </select>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Amount</label>
                    <input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Currency</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-800">Billing cycle</label>
                    <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={createFirstAdmin} onChange={(e) => setCreateFirstAdmin(e.target.checked)} />
              <span className="text-sm font-medium text-gray-800">Create first admin user in tenant DB</span>
            </label>
            {createFirstAdmin && (
              <div className="mt-3 space-y-2 pl-6">
                <div>
                  <label className="block text-xs font-medium text-gray-800">Admin email</label>
                  <input type="email" value={firstAdminEmail} onChange={(e) => setFirstAdminEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="admin@tenant.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-800">Admin password <span className="text-gray-700 font-normal">(min 10 chars, 1 upper, 1 lower, 1 number)</span></label>
                  <input type="password" value={firstAdminPassword} onChange={(e) => setFirstAdminPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-800">Admin name (optional)</label>
                  <input value={firstAdminName} onChange={(e) => setFirstAdminName(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Admin" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-800 font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
            {saving ? "Creating…" : "Create tenant"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PLATFORM_BASE_URL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001") : "http://localhost:5001";

function TenantCreatedSuccessModal({ result, onClose }: { result: CreateTenantResult; onClose: () => void }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const snippet = [
    "# One POS instance per tenant — set in your tenant app environment",
    `PLATFORM_BASE_URL=${PLATFORM_BASE_URL}`,
    `TENANT_ID=${result.tenantId}`,
    `TENANT_DB_NAME=${result.tenantDbName}`,
    "# TENANT_URL (optional): " + (result.tenantUrl || ""),
    "# PLATFORM_SHARED_SECRET=... (from platform console; do not commit)",
  ].join("\n");

  async function copyTenantId() {
    await navigator.clipboard.writeText(result.tenantId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }
  async function copyTenantUrl() {
    await navigator.clipboard.writeText(result.tenantUrl || "");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }
  async function copySnippet() {
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 id="success-modal-title" className="text-lg font-semibold text-gray-800">Tenant created</h2>
        <p className="text-sm text-gray-800 mt-1">Use the values below to configure your tenant POS deployment.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-gray-800">Tenant ID</span>
              <p className="font-mono text-sm text-gray-900">{result.tenantId}</p>
            </div>
            <button type="button" onClick={copyTenantId} className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-gray-800 font-medium">
              {copiedId ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-700" />}
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>
          {result.tenantUrl && (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-medium text-gray-800">Tenant URL</span>
                <p className="font-mono text-sm text-gray-900 truncate">{result.tenantUrl}</p>
              </div>
              <button type="button" onClick={copyTenantUrl} className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-gray-800 font-medium">
                {copiedUrl ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-700" />}
                {copiedUrl ? "Copied" : "Copy"}
              </button>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-gray-800">Tenant DB name</span>
            <p className="font-mono text-sm text-gray-900">{result.tenantDbName}</p>
          </div>
          <div className="text-sm text-gray-800">
            Plan: <strong>{result.planKey}</strong> · Status: <strong>{result.status}</strong>
            {result.createdFirstAdmin && <span className="block mt-1 text-green-600">First admin user created in tenant DB.</span>}
          </div>
          <div>
            <span className="text-xs font-medium text-gray-800 block mb-1">Recommended env snippet for deployment (includes TENANT_ID)</span>
            <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 overflow-x-auto whitespace-pre-wrap">{snippet}</pre>
            <button type="button" onClick={copySnippet} className="mt-2 inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm text-gray-800 font-medium">
              {copiedSnippet ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-700" />}
              {copiedSnippet ? "Copied" : "Copy snippet"}
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Close</button>
        </div>
      </div>
    </div>
  );
}
