"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, UserPlus, Building2, DollarSign, ShieldCheck, Check, Globe, Database } from "lucide-react";
import { platformApi, type PlanCatalogItem, type CreateTenantResult } from "../../service/platformApi";

const PASSWORD_MIN_LEN = 10;
function isValidFirstAdminPassword(pwd: string): boolean {
  return pwd.length >= PASSWORD_MIN_LEN && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);
}
const SUBDOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
function isValidSubdomain(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t.length >= 3 && t.length <= 30 && SUBDOMAIN_REGEX.test(t);
}
const PREVIEW_DOMAIN = process.env.NEXT_PUBLIC_TENANT_PREVIEW_DOMAIN || "inflix.uk";
const PLATFORM_BASE_URL = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001") : "http://localhost:5001";

export default function AddTenantPage() {
  const router = useRouter();
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
  const [plansLoading, setPlansLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [createFirstAdmin, setCreateFirstAdmin] = useState(false);
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const [firstAdminPassword, setFirstAdminPassword] = useState("");
  const [firstAdminName, setFirstAdminName] = useState("");
  const [createdResult, setCreatedResult] = useState<CreateTenantResult | null>(null);

  const subdomainNormalized = tenantSubdomain.trim().toLowerCase();

  useEffect(() => {
    setSubdomainAvailable(null);
    if (!subdomainNormalized || !isValidSubdomain(subdomainNormalized)) return;
    setCheckingSubdomain(true);
    const timer = setTimeout(() => {
      platformApi.checkSubdomain(subdomainNormalized)
        .then((r) => setSubdomainAvailable(r.available))
        .catch(() => setSubdomainAvailable(null))
        .finally(() => setCheckingSubdomain(false));
    }, 400);
    return () => { clearTimeout(timer); setCheckingSubdomain(false); };
  }, [subdomainNormalized]);

  const loadPlans = useCallback(() => {
    setPlansLoading(true);
    platformApi.getPlanCatalog(true).then(setPlans).catch(() => setPlans([])).finally(() => setPlansLoading(false));
  }, []);
  useEffect(() => { loadPlans(); }, [loadPlans]);

  useEffect(() => {
    if (plans.length > 0 && pricingSource === "catalog" && !selectedCatalogPlanKey) setSelectedCatalogPlanKey(plans[0].planKey);
  }, [plans, pricingSource, selectedCatalogPlanKey]);

  useEffect(() => {
    if (pricingSource !== "catalog" || !selectedCatalogPlanKey) return;
    const plan = plans.find((p) => p.planKey === selectedCatalogPlanKey);
    if (!plan) return;
    setPlanKey(plan.planKey);
    const pm = plan.priceMetadata && typeof plan.priceMetadata === "object" ? (plan.priceMetadata as { monthly?: number; yearly?: number; currency?: string }) : null;
    if (pm) {
      setCurrency(pm.currency ?? "GBP");
      if (pm.monthly != null) { setBillingCycle("monthly"); setBillingAmount(String(pm.monthly)); }
      else if (pm.yearly != null) { setBillingCycle("yearly"); setBillingAmount(String(pm.yearly)); }
    }
  }, [pricingSource, selectedCatalogPlanKey, plans]);

  const effectivePlanKey = pricingSource === "catalog" ? (selectedCatalogPlanKey || planKey) : planKey;
  const subdomainPreview = subdomainNormalized ? `https://${subdomainNormalized}.${PREVIEW_DOMAIN}` : "";
  const dbNamePreview = subdomainNormalized ? `tenant_${subdomainNormalized}` : "";
  const subdomainError = tenantSubdomain.trim() !== "" && !isValidSubdomain(tenantSubdomain)
    ? "3-30 chars, lowercase letters, numbers, hyphens (no leading/trailing hyphen)"
    : subdomainAvailable === false ? "This subdomain is already taken" : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const sub = tenantSubdomain.trim().toLowerCase();
    if (!sub) { setError("Subdomain is required."); return; }
    if (!isValidSubdomain(sub)) { setError("Invalid subdomain format."); return; }
    if (subdomainAvailable === false) { setError("Subdomain is already taken."); return; }
    if (createFirstAdmin) {
      if (!firstAdminEmail.trim()) { setError("First admin email is required."); return; }
      if (!isValidFirstAdminPassword(firstAdminPassword)) { setError("Password: min 10 chars, 1 upper, 1 lower, 1 number."); return; }
    }
    setSaving(true);
    try {
      const body: Parameters<typeof platformApi.createTenant>[0] = {
        tenantSubdomain: sub,
        name: (name || companyName || "").trim() || "New Tenant",
        companyName: companyName.trim() || undefined,
        contactEmail: email.trim() || undefined,
        contactPhone: phone.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        billingEmail: billingEmail.trim() || undefined,
        billingAmount: billingAmount === "" ? undefined : Number(billingAmount),
        billingCycle,
        currency: currency.trim() || "GBP",
        planKey: effectivePlanKey.trim() || "starter",
      };
      if (createFirstAdmin) {
        body.createFirstAdmin = true;
        body.firstAdmin = { email: firstAdminEmail.trim().toLowerCase(), password: firstAdminPassword, name: firstAdminName.trim() || undefined };
      }
      const result = await platformApi.createTenant(body);
      setCreatedResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  const sym = currency === "EUR" ? "\u20AC" : currency === "USD" ? "$" : "\u00A3";

  if (createdResult) {
    const snippet = [
      `PLATFORM_BASE_URL=${PLATFORM_BASE_URL}`,
      `TENANT_ID=${createdResult.tenantId}`,
      `TENANT_DB_NAME=${createdResult.tenantDbName}`,
    ].join("\n");
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-green-100 bg-gradient-to-r from-green-50/80 to-white">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-green-100 text-green-600"><Check className="h-4 w-4" /></span>
              <h2 className="text-lg font-semibold text-green-900">Tenant Created</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-xs font-medium text-gray-500">Tenant ID</p><p className="font-mono text-sm font-medium text-gray-900">{createdResult.tenantId}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Status</p><p className="text-sm font-medium text-green-700">{createdResult.status}</p></div>
              {createdResult.tenantUrl && <div className="sm:col-span-2"><p className="text-xs font-medium text-gray-500">URL</p><p className="font-mono text-sm text-gray-900">{createdResult.tenantUrl}</p></div>}
              <div><p className="text-xs font-medium text-gray-500">Database</p><p className="font-mono text-sm text-gray-900">{createdResult.tenantDbName}</p></div>
              <div><p className="text-xs font-medium text-gray-500">Plan</p><p className="text-sm font-medium text-gray-900 capitalize">{createdResult.planKey}</p></div>
            </div>
            {createdResult.createdFirstAdmin && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">First admin user created in tenant DB.</p>}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Environment snippet</p>
              <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-800 overflow-x-auto">{snippet}</pre>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Link href={`/platform/tenants/${encodeURIComponent(createdResult.tenantId)}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium shadow-sm text-sm">
                Manage Tenant
              </Link>
              <Link href="/platform/tenants" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium">
                Back to Tenants
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <Link href="/platform/tenants" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tenants
        </Link>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
          <UserPlus className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add Tenant</h1>
          <p className="text-sm text-gray-500">Create a new tenant with subdomain, contact details, plan, and optional first admin.</p>
        </div>
      </div>

      {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subdomain & Identity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Subdomain & Identity</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain <span className="text-red-500">*</span></label>
              <div className="relative">
                <input value={tenantSubdomain} onChange={(e) => setTenantSubdomain(e.target.value.replace(/\s/g, ""))}
                  className={`border rounded-lg px-3 py-2 w-full font-mono text-sm pr-8 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow ${subdomainError ? "border-red-400 bg-red-50/50" : subdomainAvailable === true ? "border-green-400" : "border-gray-300"}`}
                  placeholder="acme" />
                {subdomainNormalized && isValidSubdomain(subdomainNormalized) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingSubdomain ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : subdomainAvailable === true ? <Check className="h-4 w-4 text-green-600" /> : subdomainAvailable === false ? <span className="text-red-500 text-xs font-medium">Taken</span> : null}
                  </span>
                )}
              </div>
              {subdomainError && <p className="mt-1 text-xs text-red-600">{subdomainError}</p>}
              {subdomainPreview && !subdomainError && (
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>URL: <span className="font-mono text-gray-700">{subdomainPreview}</span></span>
                  <span>ID: <span className="font-mono text-gray-700">{subdomainNormalized}</span></span>
                  <span><Database className="h-3 w-3 inline mr-0.5" /><span className="font-mono text-gray-700">{dbNamePreview}</span></span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="Acme Ltd" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company name</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="Acme Ltd" /></div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-sky-500" />
            <h2 className="text-sm font-semibold text-sky-900 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Contact</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="billing@acme.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="+44 ..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing email</label><input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="invoices@acme.com" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Billing address</label><input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="Street, city, postcode" /></div>
            </div>
          </div>
        </div>

        {/* Plan & Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-semibold text-orange-900 flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Plan & Pricing</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pricingSource" checked={pricingSource === "catalog"} onChange={() => setPricingSource("catalog")} className="text-orange-600" /><span className="text-sm font-medium text-gray-800">From plan catalog</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="pricingSource" checked={pricingSource === "custom"} onChange={() => { setPricingSource("custom"); if (plans.length > 0 && !plans.some((p) => p.planKey === planKey)) setPlanKey(plans[0].planKey); }} className="text-orange-600" /><span className="text-sm font-medium text-gray-800">Custom pricing</span></label>
            </div>
            {pricingSource === "catalog" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select value={selectedCatalogPlanKey} onChange={(e) => setSelectedCatalogPlanKey(e.target.value)} disabled={plansLoading} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50">
                    {plansLoading ? <option>Loading...</option> : plans.length === 0 ? <option value="">No plans</option> : plans.map((p) => {
                      const pm = p.priceMetadata && typeof p.priceMetadata === "object" ? (p.priceMetadata as { monthly?: number; yearly?: number; currency?: string }) : null;
                      const priceStr = pm ? [pm.monthly != null && `${pm.monthly} ${pm.currency ?? ""}/mo`, pm.yearly != null && `${pm.yearly} ${pm.currency ?? ""}/yr`].filter(Boolean).join(" · ") || "—" : "—";
                      return <option key={p.planKey} value={p.planKey}>{p.name} ({p.planKey}) — {priceStr}</option>;
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><div className="relative"><input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="0" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="GBP">GBP ({"\u00A3"})</option><option value="USD">USD ($)</option><option value="EUR">EUR ({"\u20AC"})</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing cycle</label><select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan (for features & limits)</label><select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500">{plans.map((p) => <option key={p.planKey} value={p.planKey}>{p.name} ({p.planKey})</option>)}{plans.length === 0 && <option value="starter">starter</option>}</select></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><div className="relative"><input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="0" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="GBP">GBP ({"\u00A3"})</option><option value="USD">USD ($)</option><option value="EUR">EUR ({"\u20AC"})</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing cycle</label><select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* First Admin */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-violet-500" />
            <h2 className="text-sm font-semibold text-violet-900 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> First Admin User</h2>
          </div>
          <div className="p-5 space-y-4">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={createFirstAdmin} onChange={(e) => setCreateFirstAdmin(e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4" />
              <div><span className="text-sm font-medium text-gray-800">Create first admin user in tenant DB</span><p className="text-xs text-gray-400">Optional. You can create users later from the tenant management page.</p></div>
            </label>
            {createFirstAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Admin email <span className="text-red-500">*</span></label><input type="email" value={firstAdminEmail} onChange={(e) => setFirstAdminEmail(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="admin@tenant.com" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Admin name</label><input value={firstAdminName} onChange={(e) => setFirstAdminName(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="Admin" /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(min 10 chars, 1 upper, 1 lower, 1 number)</span></label><input type="password" value={firstAdminPassword} onChange={(e) => setFirstAdminPassword(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" placeholder="••••••••••" /></div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <Link href="/platform/tenants" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors text-sm font-medium">Cancel</Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium shadow-sm transition-all text-sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Tenant
          </button>
        </div>
      </form>
    </div>
  );
}
