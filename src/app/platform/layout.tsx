"use client";

import { useRouter, usePathname } from "next/navigation";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Sidebar } from "../components/Sidebar";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { platformUser, loading } = usePlatformAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!platformUser) {
      router.replace("/login");
    }
  }, [loading, platformUser, router]);

  if (loading || !platformUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" data-platform>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Breadcrumb header */}
        <div className="border-b border-gray-200 bg-white shrink-0">
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-800">
              <Link href="/platform" className="text-orange-600 hover:underline">Platform</Link>
              {pathname && pathname !== "/platform" && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-gray-700 capitalize">
                    {pathname.replace("/platform/", "").split("/")[0]?.replace(/-/g, " ") || "Console"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
