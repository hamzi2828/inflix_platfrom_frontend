"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Package, Users, Shield, ArrowRight, LayoutDashboard, UserPlus, PackagePlus, Loader2 } from "lucide-react";
import { platformApi } from "./service/platformApi";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";

export default function PlatformPage() {
  const { platformUser } = usePlatformAuth();
  const [stats, setStats] = useState<{ tenants: number; plans: number; features: number; admins: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      platformApi.getTenants().then((t) => t.length).catch(() => 0),
      platformApi.getPlanCatalog(false).then((p) => p.length).catch(() => 0),
      platformApi.getFeatureCatalog(false).then((f) => f.length).catch(() => 0),
      platformApi.listAdminAccounts().then((a) => a.length).catch(() => 0),
    ]).then(([tenants, plans, features, admins]) => {
      setStats({ tenants, plans, features, admins });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {platformUser?.email ? `Welcome back, ${platformUser.email.split("@")[0]}` : "Manage platform settings, catalogs, and tenants"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 mb-8"><Loader2 className="h-4 w-4 animate-spin" /> Loading stats...</div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tenants</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.tenants}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Plans</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.plans}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Features</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.features}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Admins</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.admins}</p>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Management</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/platform/tenants" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Tenants <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Manage tenants, subscriptions, and billing</p>
          </div>
        </Link>
        <Link href="/platform/tenants/add" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Add Tenant <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Create a new tenant with subdomain and plan</p>
          </div>
        </Link>
        <Link href="/platform/admin-accounts" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Admin Accounts <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Platform console access management</p>
          </div>
        </Link>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Catalogs</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/platform/feature-catalog" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Feature Catalog <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Repairs, reports, inventory, and more</p>
          </div>
        </Link>
        <Link href="/platform/plan-catalog" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <Package className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Plan Catalog <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Starter, Pro, Enterprise plans and pricing</p>
          </div>
        </Link>
        <Link href="/platform/plan-catalog/add" className="group flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-white shrink-0 group-hover:scale-105 transition-transform">
            <PackagePlus className="h-5 w-5" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">Add Plan <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" /></h3>
            <p className="text-sm text-gray-500 mt-0.5">Create a new subscription plan</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
