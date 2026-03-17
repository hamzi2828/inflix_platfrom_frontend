"use client";

import { useRouter, usePathname } from "next/navigation";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50" data-platform>
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
            <h1 className="text-xl font-semibold text-gray-900">Platform Owner Console</h1>
            <a
              href={process.env.NEXT_PUBLIC_TENANT_APP_URL || "http://localhost:3000"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:underline"
            >
              Open Tenant App →
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
}
