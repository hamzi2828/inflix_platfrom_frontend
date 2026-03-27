"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Pencil, Trash2, Package, Check, X as XIcon, Infinity } from "lucide-react";
import {
  platformApi,
  type PlanCatalogItem,
  type FeatureCatalogItem,
  type LimitCatalogItem,
} from "../service/platformApi";

export default function PlanCatalogPage() {
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [featureCatalog, setFeatureCatalog] = useState<FeatureCatalogItem[]>([]);
  const [limitCatalog, setLimitCatalog] = useState<LimitCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading plans...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        {error}
        <Link href="/platform" className="block mt-2 text-orange-600 hover:underline">Back to Platform</Link>
      </div>
    );
  }

  const formatPrice = (p: PlanCatalogItem) => {
    if (!p.priceMetadata || typeof p.priceMetadata !== "object") return null;
    const pm = p.priceMetadata as { monthly?: number; yearly?: number; currency?: string };
    const sym = pm.currency === "EUR" ? "\u20AC" : pm.currency === "USD" ? "$" : "\u00A3";
    return { monthly: pm.monthly, yearly: pm.yearly, sym, currency: pm.currency ?? "GBP" };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-sm">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Plan Catalog</h1>
            <p className="text-sm text-gray-500">Plans define default features and limits; tenants can override.</p>
          </div>
        </div>
        <Link
          href="/platform/plan-catalog/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium shadow-sm transition-all text-sm"
        >
          <Plus className="h-4 w-4" /> Add Plan
        </Link>
      </div>

      {/* Plan cards */}
      {plans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No plans yet. Create your first plan to get started.</p>
          <Link
            href="/platform/plan-catalog/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Plan
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const price = formatPrice(p);
            const enabledFeatures = Object.entries(p.features || {}).filter(([, v]) => v);
            const disabledFeatures = Object.entries(p.features || {}).filter(([, v]) => !v);
            const planLimits = Object.entries(p.limits || {});
            const isInactive = !p.isActive;

            return (
              <div
                key={p._id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${
                  isInactive ? "border-gray-300 opacity-75" : "border-gray-200"
                }`}
              >
                {/* Card header */}
                <div className={`px-5 py-4 border-b border-gray-100 ${isInactive ? "bg-gray-50" : "bg-gradient-to-r from-indigo-50/60 to-white"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{p.name}</h3>
                      <span className="text-xs font-mono text-gray-400">{p.planKey}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isInactive && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full mr-1">Inactive</span>
                      )}
                      <Link
                        href={`/platform/plan-catalog/${encodeURIComponent(p.planKey)}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.planKey)}
                        disabled={deletingKey === p.planKey}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Delete"
                      >
                        {deletingKey === p.planKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                </div>

                {/* Pricing */}
                <div className="px-5 py-3 border-b border-gray-100">
                  {price ? (
                    <div className="flex items-baseline gap-3">
                      {price.monthly != null && (
                        <div>
                          <span className="text-2xl font-bold text-gray-900">{price.sym}{price.monthly}</span>
                          <span className="text-sm text-gray-400"> /mo</span>
                        </div>
                      )}
                      {price.yearly != null && (
                        <div className="text-sm text-gray-500">
                          {price.sym}{price.yearly}<span className="text-gray-400"> /yr</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No pricing set</span>
                  )}
                </div>

                {/* Features */}
                <div className="px-5 py-3 border-b border-gray-100 flex-1">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Features</h4>
                  {enabledFeatures.length === 0 && disabledFeatures.length === 0 ? (
                    <p className="text-sm text-gray-400">None configured</p>
                  ) : (
                    <ul className="space-y-1">
                      {enabledFeatures.map(([k]) => (
                        <li key={k} className="flex items-center gap-2 text-sm">
                          <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="text-gray-700">{k.replace(/_/g, " ")}</span>
                        </li>
                      ))}
                      {disabledFeatures.map(([k]) => (
                        <li key={k} className="flex items-center gap-2 text-sm">
                          <XIcon className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                          <span className="text-gray-400">{k.replace(/_/g, " ")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Limits */}
                <div className="px-5 py-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Limits</h4>
                  {planLimits.length === 0 ? (
                    <p className="text-sm text-gray-400">None configured</p>
                  ) : (
                    <div className="space-y-1.5">
                      {planLimits.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()}</span>
                          {v != null ? (
                            <span className="font-medium text-gray-800">{v.toLocaleString()}</span>
                          ) : (
                            <Infinity className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
