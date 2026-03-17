"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import {
  platformApi,
  type PlanCatalogItem,
  type FeatureCatalogItem,
  type LimitCatalogItem,
} from "../service/platformApi";

function PlanFormModal({
  plan,
  featureCatalog,
  limitCatalog,
  onClose,
  onSaved,
}: {
  plan: PlanCatalogItem | null;
  featureCatalog: FeatureCatalogItem[];
  limitCatalog: LimitCatalogItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!plan;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState(plan?.planKey ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [monthly, setMonthly] = useState<number | "">(
    plan?.priceMetadata && typeof plan.priceMetadata === "object" && "monthly" in plan.priceMetadata
      ? (plan.priceMetadata as { monthly?: number }).monthly ?? ""
      : ""
  );
  const [yearly, setYearly] = useState<number | "">(
    plan?.priceMetadata && typeof plan.priceMetadata === "object" && "yearly" in plan.priceMetadata
      ? (plan.priceMetadata as { yearly?: number }).yearly ?? ""
      : ""
  );
  const [currency, setCurrency] = useState(
    plan?.priceMetadata && typeof plan.priceMetadata === "object" && "currency" in plan.priceMetadata
      ? (plan.priceMetadata as { currency?: string }).currency ?? "GBP"
      : "GBP"
  );
  const [features, setFeatures] = useState<Record<string, boolean>>(plan?.features ?? {});
  const [limits, setLimits] = useState<Record<string, number | null>>(plan?.limits ?? {});
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);

  const setFeature = (key: string, value: boolean) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };
  const setLimit = (key: string, value: number | null) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      if (isEdit) {
        await platformApi.updatePlan(plan.planKey, { name, description, priceMetadata, features, limits, isActive });
      } else {
        if (!planKey.trim()) {
          setError("Plan key is required");
          setSaving(false);
          return;
        }
        await platformApi.createPlan({
          planKey: planKey.trim().toLowerCase(),
          name: name || planKey.trim(),
          description,
          priceMetadata,
          features,
          limits,
          isActive,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{isEdit ? "Edit plan" : "Add plan"}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan key</label>
              <input
                type="text"
                value={planKey}
                onChange={(e) => setPlanKey(e.target.value)}
                disabled={isEdit}
                className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono text-sm disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="e.g. pro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. Pro" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Optional" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly price</label>
              <input type="number" min={0} step={1} value={monthly} onChange={(e) => setMonthly(e.target.value === "" ? "" : Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yearly price</label>
              <input type="number" min={0} step={1} value={yearly} onChange={(e) => setYearly(e.target.value === "" ? "" : Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="GBP" />
            </div>
          </div>
          {featureCatalog.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="flex flex-wrap gap-3">
                {featureCatalog.map((f) => (
                  <label key={f.key} className="flex items-center gap-2">
                    <input type="checkbox" checked={features[f.key] ?? false} onChange={(e) => setFeature(f.key, e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm text-gray-700">{f.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {limitCatalog.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Limits</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {limitCatalog.map((l) => (
                  <div key={l.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{l.name}</label>
                    <input
                      type="number"
                      min={0}
                      value={limits[l.key] ?? ""}
                      onChange={(e) => setLimit(l.key, e.target.value === "" ? null : parseInt(e.target.value, 10))}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 w-full text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Default"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlanCatalogPage() {
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>([]);
  const [limitCatalog, setLimitCatalog] = useState<LimitCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPlan, setModalPlan] = useState<PlanCatalogItem | null | "add">(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      platformApi.getPlanCatalog(false),
      platformApi.getFeatureCatalog(false),
      platformApi.getLimitCatalog(false),
    ])
      .then(([p, f, l]) => {
        setPlans(p);
        setFeatureCatalog(f);
        setLimitCatalog(l);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (planKey: string) => {
    if (!confirm(`Delete plan "${planKey}"? Tenants using this plan may need to be reassigned.`)) return;
    setDeletingKey(planKey);
    try {
      await platformApi.deletePlan(planKey);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeletingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-800">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
        <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">← Back to Platform</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/platform" className="inline-flex items-center gap-1 text-gray-800 hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button type="button" onClick={() => setModalPlan("add")} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          <Plus className="h-4 w-4" /> Add plan
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Plan Catalog</h2>
          <p className="text-sm text-gray-800">Plans define default features and limits; tenants can override.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Plan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Price</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Features (on)</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Limits</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{p.planKey}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-800">
                    {p.priceMetadata && typeof p.priceMetadata === "object"
                      ? (() => {
                          const pm = p.priceMetadata as { monthly?: number; yearly?: number; currency?: string };
                          const cur = pm.currency ?? "";
                          const parts: string[] = [];
                          if (pm.monthly != null && pm.monthly !== "") parts.push(`${pm.monthly} ${cur}/mo`);
                          if (pm.yearly != null && pm.yearly !== "") parts.push(`${pm.yearly} ${cur}/yr`);
                          return parts.length ? parts.join(" · ") : "—";
                        })()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {Object.entries(p.features || {}).filter(([, v]) => v).map(([k]) => k).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {Object.entries(p.limits || {}).map(([k, v]) => (v != null ? `${k}: ${v}` : `${k}: —`)).join("; ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" onClick={() => setModalPlan(p)} className="p-2 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-600" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(p.planKey)} disabled={deletingKey === p.planKey} className="p-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Delete">
                        {deletingKey === p.planKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {plans.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-800">No plans. Run the entitlements seed on the backend or add a plan above.</div>
        )}
      </div>
      {modalPlan !== null && (
        <PlanFormModal
          plan={modalPlan === "add" ? null : modalPlan}
          featureCatalog={featureCatalog}
          limitCatalog={limitCatalog}
          onClose={() => setModalPlan(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
