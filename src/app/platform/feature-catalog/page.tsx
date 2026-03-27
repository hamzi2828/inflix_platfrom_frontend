"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Layers, Check, X as XIcon, Sparkles } from "lucide-react";
import { platformApi, type FeatureCatalogItem } from "../service/platformApi";

export default function FeatureCatalogPage() {
  const [items, setItems] = useState<FeatureCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformApi
      .getFeatureCatalog(false)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading feature catalog...
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

  const activeItems = items.filter((f) => f.isActive);
  const inactiveItems = items.filter((f) => !f.isActive);
  const categories = [...new Set(items.map((f) => f.category || "Uncategorized"))];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Feature Catalog</h1>
            <p className="text-sm text-gray-500">Features added here appear in plan matrix and tenant overrides.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            {activeItems.length} active
          </span>
          {inactiveItems.length > 0 && (
            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
              {inactiveItems.length} inactive
            </span>
          )}
        </div>
      </div>

      {/* Feature cards by category */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No features yet. Run the entitlements seed on the backend.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => {
            const catItems = items.filter((f) => (f.category || "Uncategorized") === category);
            return (
              <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/60 to-white">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
                    <h2 className="text-sm font-semibold text-indigo-900">{category}</h2>
                  </div>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {catItems.length} feature{catItems.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Feature rows */}
                <div className="divide-y divide-gray-100">
                  {catItems.map((f) => (
                    <div
                      key={f._id}
                      className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                        f.isActive ? "hover:bg-gray-50/50" : "bg-gray-50/30 opacity-60"
                      }`}
                    >
                      {/* Status icon */}
                      <span
                        className={`inline-flex w-7 h-7 items-center justify-center rounded-full shrink-0 ${
                          f.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {f.isActive ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                      </span>

                      {/* Name + key */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{f.name}</p>
                        <p className="text-xs font-mono text-gray-400">{f.key}</p>
                      </div>

                      {/* Description */}
                      {f.description && (
                        <p className="hidden sm:block text-xs text-gray-400 max-w-[200px] truncate">{f.description}</p>
                      )}

                      {/* Default badge */}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          f.defaultEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {f.defaultEnabled ? "On by default" : "Off by default"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
