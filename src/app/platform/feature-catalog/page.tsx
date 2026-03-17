"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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
      <div className="flex items-center gap-2 text-gray-800">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading feature catalog...
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
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Feature Catalog</h2>
          <p className="text-sm text-gray-800">New features added here appear in plan matrix and tenant overrides.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Key</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Category</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Default</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-800">Active</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{f.key}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                  <td className="px-4 py-3 text-gray-700">{f.category}</td>
                  <td className="px-4 py-3 text-gray-800">{f.defaultEnabled ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-gray-800">{f.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-800">No features. Run the entitlements seed on the backend.</div>
        )}
      </div>
    </div>
  );
}
