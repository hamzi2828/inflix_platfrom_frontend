"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5" /> Settings
        </h2>
        <p className="text-gray-800 mt-1">Platform configuration and preferences.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        <p>Settings coming soon.</p>
      </div>
    </div>
  );
}
