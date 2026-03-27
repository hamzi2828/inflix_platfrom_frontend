"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, PackagePlus, DollarSign, ToggleLeft, Gauge, Sparkles } from "lucide-react";
import {
  platformApi,
  type FeatureCatalogItem,
  type LimitCatalogItem,
} from "../../service/platformApi";

export default function AddPlanPage() {
  const router = useRouter();
  const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>([]);
  const [limitCatalog, setLimitCatalog] = useState<LimitCatalogItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthly, setMonthly] = useState<number | "">("");
  const [yearly, setYearly] = useState<number | "">("");
  const [currency, setCurrency] = useState("GBP");
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [limits, setLimits] = useState<Record<string, number | null>>({});
  const [isActive, setIsActive] = useState(true);

  const loadCatalogs = useCallback(() => {
    Promise.all([
      platformApi.getFeatureCatalog(false),
      platformApi.getLimitCatalog(false),
    ])
      .then(([f, l]) => {
        setFeatureCatalog(f);
        setLimitCatalog(l);
      })
      .catch(() => {})
      .finally(() => setLoadingCatalogs(false));
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  const setFeature = (key: string, value: boolean) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };
  const setLimit = (key: string, value: number | null) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
  };

  const enabledCount = Object.values(features).filter(Boolean).length;
  const limitsSetCount = Object.values(limits).filter((v) => v != null).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!planKey.trim()) {
      setError("Plan key is required");
      return;
    }
    setSaving(true);
    try {
      const priceMetadata =
        monthly !== "" || yearly !== ""
          ? {
              ...(monthly !== "" ? { monthly: Number(monthly) } : {}),
              ...(yearly !== "" ? { yearly: Number(yearly) } : {}),
              currency: currency || "GBP",
            }
          : null;
      await platformApi.createPlan({
        planKey: planKey.trim().toLowerCase(),
        name: name || planKey.trim(),
        description,
        priceMetadata,
        features,
        limits,
        isActive,
      });
      router.push("/platform/plan-catalog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading catalogs...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <div className="mb-5">
        <Link href="/platform/plan-catalog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Plan Catalog
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
          <PackagePlus className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add Plan</h1>
          <p className="text-sm text-gray-500">Create a new subscription plan with pricing, features, and limits.</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ─── Section: Plan Identity ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-emerald-900">Plan Identity</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan key <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="e.g. pro"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, unique. Cannot be changed later.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="e.g. Pro"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow resize-none"
                placeholder="Optional — describe what this plan is for"
              />
            </div>
          </div>
        </div>

        {/* ─── Section: Pricing ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-semibold text-orange-900 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> Pricing
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={monthly}
                    onChange={(e) => setMonthly(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency === "GBP" ? "\u00A3" : currency === "EUR" ? "\u20AC" : "$"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yearly</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={yearly}
                    onChange={(e) => setYearly(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                    placeholder="0"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency === "GBP" ? "\u00A3" : currency === "EUR" ? "\u20AC" : "$"}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                >
                  <option value="GBP">GBP (\u00A3)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (\u20AC)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section: Features ─── */}
        {featureCatalog.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-white">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
                <h2 className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Features
                </h2>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                {enabledCount} / {featureCatalog.length} enabled
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {featureCatalog.map((f) => {
                  const checked = features[f.key] ?? false;
                  return (
                    <label
                      key={f.key}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? "border-indigo-300 bg-indigo-50/60 ring-1 ring-indigo-200/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setFeature(f.key, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-800">{f.name}</span>
                        {f.description && <p className="text-xs text-gray-400 mt-0.5 leading-tight">{f.description}</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Section: Limits ─── */}
        {limitCatalog.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" /> Limits
                </h2>
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {limitsSetCount} / {limitCatalog.length} set
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {limitCatalog.map((l) => {
                  const hasValue = limits[l.key] != null;
                  return (
                    <div
                      key={l.key}
                      className={`p-3 rounded-lg border transition-all ${
                        hasValue
                          ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200/50"
                          : "border-gray-200"
                      }`}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{l.name}</label>
                      <input
                        type="number"
                        min={0}
                        value={limits[l.key] ?? ""}
                        onChange={(e) => setLimit(l.key, e.target.value === "" ? null : parseInt(e.target.value, 10))}
                        className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                        placeholder="Unlimited"
                      />
                      {l.description && <p className="text-xs text-gray-400 mt-1.5">{l.description}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Section: Status ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-slate-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <ToggleLeft className="h-4 w-4" /> Status
            </h2>
          </div>
          <div className="p-5">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Active</span>
                <p className="text-xs text-gray-400">Inactive plans cannot be assigned to new tenants.</p>
              </div>
            </label>
          </div>
        </div>

        {/* ─── Actions ─── */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <Link href="/platform/plan-catalog" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors text-sm font-medium">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium shadow-sm transition-all text-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Plan
          </button>
        </div>
      </form>
    </div>
  );
}
