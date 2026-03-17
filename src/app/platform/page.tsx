"use client";

import Link from "next/link";
import { Layers, Package, Users, Shield, ArrowRight } from "lucide-react";

export default function PlatformPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-gray-800 mt-1">Manage platform settings, catalogs, and tenants.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/platform/admin-accounts"
          className="group flex flex-col p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
        >
          <span className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4 group-hover:bg-orange-200 transition-colors">
            <Shield className="h-6 w-6" />
          </span>
          <h3 className="font-semibold text-gray-900">Admin Accounts</h3>
          <p className="text-sm text-gray-800 mt-1 flex-1">Create, edit, or delete platform admin accounts</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 mt-3 group-hover:gap-2 transition-all">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/platform/feature-catalog"
          className="group flex flex-col p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
        >
          <span className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4 group-hover:bg-orange-200 transition-colors">
            <Layers className="h-6 w-6" />
          </span>
          <h3 className="font-semibold text-gray-900">Feature Catalog</h3>
          <p className="text-sm text-gray-800 mt-1 flex-1">Manage features (repairs, reports, etc.)</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 mt-3 group-hover:gap-2 transition-all">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/platform/plan-catalog"
          className="group flex flex-col p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
        >
          <span className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4 group-hover:bg-orange-200 transition-colors">
            <Package className="h-6 w-6" />
          </span>
          <h3 className="font-semibold text-gray-900">Plan Catalog</h3>
          <p className="text-sm text-gray-800 mt-1 flex-1">Starter, Pro, Enterprise plans</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 mt-3 group-hover:gap-2 transition-all">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <Link
          href="/platform/tenants"
          className="group flex flex-col p-6 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all duration-200"
        >
          <span className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 mb-4 group-hover:bg-orange-200 transition-colors">
            <Users className="h-6 w-6" />
          </span>
          <h3 className="font-semibold text-gray-900">Tenants</h3>
          <p className="text-sm text-gray-800 mt-1 flex-1">Tenant list and subscriptions</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 mt-3 group-hover:gap-2 transition-all">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
