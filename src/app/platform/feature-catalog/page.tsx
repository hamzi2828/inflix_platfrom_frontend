"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Layers, Check, X as XIcon, Sparkles, Plus, Save } from "lucide-react";
import { platformApi, type FeatureCatalogItem } from "../service/platformApi";

export default function FeatureCatalogPage() {
  const [items, setItems] = useState<FeatureCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ─── Add Feature form state ─── */
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Core");
  const [newDefaultEnabled, setNewDefaultEnabled] = useState(false);

  const loadFeatures = useCallback(() => {
    setLoading(true);
    platformApi
      .getFeatureCatalog(false)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFeatures();
  }, [loadFeatures]);

  const resetForm = () => {
    setNewKey("");
    setNewName("");
    setNewDescription("");
    setNewCategory("Core");
    setNewDefaultEnabled(false);
    setFormError(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newKey.trim()) {
      setFormError("Feature key is required");
      return;
    }
    if (!newName.trim()) {
      setFormError("Feature name is required");
      return;
    }
    setSaving(true);
    try {
      await platformApi.createFeature({
        key: newKey.trim().toLowerCase(),
        name: newName.trim(),
        description: newDescription.trim(),
        category: newCategory.trim() || "Core",
        defaultEnabled: newDefaultEnabled,
        isActive: true,
      });
      resetForm();
      setShowForm(false);
      loadFeatures();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create feature");
    } finally {
      setSaving(false);
    }
  };

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
          <button
            type="button"
            onClick={() => { setShowForm((v) => !v); setFormError(null); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium shadow-sm transition-all text-sm"
          >
            <Plus className="h-4 w-4" /> Add Feature
          </button>
        </div>
      </div>

      {/* ─── Add Feature Form ─── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-emerald-900">New Feature</h2>
          </div>

          {formError && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{formError}</div>
          )}

          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feature key <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="e.g. customer_invoicing"
                />
                <p className="text-xs text-gray-400 mt-1">Lowercase, unique identifier.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="e.g. Customer Invoicing"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="Core"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
                  placeholder="Optional — describe what this feature does"
                />
              </div>
            </div>
            <div>
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDefaultEnabled}
                  onChange={(e) => setNewDefaultEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-800">Enabled by default</span>
                  <p className="text-xs text-gray-400">When on, new plans will have this feature enabled by default.</p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium shadow-sm transition-all text-sm"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Feature
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feature cards by category */}
      {items.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No features yet. Add your first feature to get started.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Feature
          </button>
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
