"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Activity,
  RefreshCw,
  Loader2,
  Clock,
  Zap,
  AlertTriangle,
  Users,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Search,
  Timer,
  User,
  TrendingUp,
  Database,
  X as XIcon,
  Check,
} from "lucide-react";
import {
  platformApi,
  type TenantListItem,
  type HealthCheckerSummary,
  type HealthCheckerEndpoint,
  type HealthCheckerSlowRequest,
  type HealthCheckerUser,
  type HealthCheckerRecentRequest,
} from "../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

/* ─── Period presets ─── */
const PERIODS = [
  { label: "Last 1h", value: "1h", ms: 60 * 60 * 1000 },
  { label: "Last 6h", value: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "Last 24h", value: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "Last 7d", value: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "Last 30d", value: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "All time", value: "all", ms: 0 },
] as const;

type SortField = "hits" | "avgDuration" | "maxDuration" | "errorCount" | "errorRate" | "url";
type SortDir = "asc" | "desc";

/* ─── Method badge colors ─── */
function methodColor(m: string) {
  switch (m) {
    case "GET": return "bg-emerald-100 text-emerald-800";
    case "POST": return "bg-blue-100 text-blue-800";
    case "PUT": return "bg-amber-100 text-amber-800";
    case "PATCH": return "bg-purple-100 text-purple-800";
    case "DELETE": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

/* ─── Status badge ─── */
function statusBadge(s: number) {
  if (s < 300) return "bg-emerald-100 text-emerald-800";
  if (s < 400) return "bg-amber-100 text-amber-800";
  if (s < 500) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

/* ─── Duration color ─── */
function durationColor(ms: number) {
  if (ms < 100) return "text-emerald-700";
  if (ms < 500) return "text-amber-700";
  if (ms < 1000) return "text-orange-700";
  return "text-red-700 font-semibold";
}

/* ─── Level badge ─── */
function levelBadge(level: string) {
  switch (level) {
    case "ERROR": return "bg-red-100 text-red-800";
    case "WARN": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function HealthCheckerPage() {
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [summary, setSummary] = useState<HealthCheckerSummary | null>(null);
  const [endpoints, setEndpoints] = useState<HealthCheckerEndpoint[]>([]);
  const [slowRequests, setSlowRequests] = useState<HealthCheckerSlowRequest[]>([]);
  const [users, setUsers] = useState<HealthCheckerUser[]>([]);
  const [recentRequests, setRecentRequests] = useState<HealthCheckerRecentRequest[]>([]);

  // UI state
  const [endpointSearch, setEndpointSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("hits");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [recentFilter, setRecentFilter] = useState<"ALL" | "ERROR" | "WARN">("ALL");
  const [activeTab, setActiveTab] = useState<"endpoints" | "slow" | "users" | "recent">("endpoints");
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load tenants on mount — same API the Tenants page uses
  useEffect(() => {
    platformApi.getTenants()
      .then((t) => {
        setTenants(t);
        if (t.length > 0 && !selectedTenant) setSelectedTenant(t[0].tenantId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getDateRange = useCallback(() => {
    const p = PERIODS.find((x) => x.value === period);
    if (!p || p.ms === 0) return { from: undefined, to: undefined };
    const now = new Date();
    return { from: new Date(now.getTime() - p.ms).toISOString(), to: now.toISOString() };
  }, [period]);

  const loadData = useCallback(async (showRefresh = false) => {
    if (!selectedTenant) return;
    if (showRefresh) setRefreshing(true); else setLoading(true);
    const { from, to } = getDateRange();
    try {
      const [s, e, sl, u, r] = await Promise.all([
        platformApi.getHealthCheckerSummary(selectedTenant, from, to),
        platformApi.getHealthCheckerEndpoints(selectedTenant, from, to),
        platformApi.getHealthCheckerSlow(selectedTenant, from, to, 20),
        platformApi.getHealthCheckerUsers(selectedTenant, from, to),
        platformApi.getHealthCheckerRecent(selectedTenant, 200, recentFilter === "ALL" ? undefined : recentFilter),
      ]);
      setSummary(s);
      setEndpoints(e);
      setSlowRequests(sl);
      setUsers(u);
      setRecentRequests(r);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTenant, getDateRange, recentFilter]);

  useEffect(() => {
    if (selectedTenant) loadData();
  }, [selectedTenant, period, loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    if (selectedTenant) {
      autoRefreshRef.current = setInterval(() => loadData(true), 30000);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [selectedTenant, loadData]);

  /* ─── Sort endpoints ─── */
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const filteredEndpoints = endpoints
    .filter((e) => !endpointSearch || e.url.toLowerCase().includes(endpointSearch.toLowerCase()) || e.method.toLowerCase().includes(endpointSearch.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField as keyof HealthCheckerEndpoint];
      const bv = b[sortField as keyof HealthCheckerEndpoint];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const filteredRecent = recentRequests.filter(
    (r) => recentFilter === "ALL" || r.level === recentFilter
  );

  if (loading && tenants.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading health checker...
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Health Checker</h1>
            <p className="text-sm text-gray-500">API monitoring and performance insights for POS</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tenant selector (Select2-style) */}
          <TenantSelect
            tenants={tenants}
            value={selectedTenant}
            onChange={setSelectedTenant}
          />

          {/* Period selector */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <SummaryCard
            icon={<Globe className="h-4 w-4" />}
            label="Total Requests"
            value={summary.totalRequests.toLocaleString()}
            color="cyan"
          />
          <SummaryCard
            icon={<Clock className="h-4 w-4" />}
            label="Avg Response"
            value={`${summary.avgDuration}ms`}
            sub={`Max: ${summary.maxDuration}ms`}
            color={summary.avgDuration > 500 ? "red" : summary.avgDuration > 200 ? "amber" : "emerald"}
          />
          <SummaryCard
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Error Rate"
            value={`${summary.errorRate}%`}
            sub={`${summary.errorCount} errors`}
            color={summary.errorRate > 5 ? "red" : summary.errorRate > 1 ? "amber" : "emerald"}
          />
          <SummaryCard
            icon={<Users className="h-4 w-4" />}
            label="Active Users"
            value={String(summary.uniqueUsers)}
            color="blue"
          />
          <SummaryCard
            icon={<Zap className="h-4 w-4" />}
            label="Unique APIs"
            value={String(summary.uniqueEndpoints)}
            color="indigo"
          />
        </div>
      )}

      {/* ─── Tab Navigation ─── */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
        {([
          { key: "endpoints" as const, label: "API Endpoints", icon: Globe },
          { key: "slow" as const, label: "Slowest", icon: Timer },
          { key: "users" as const, label: "Users", icon: User },
          { key: "recent" as const, label: "Recent Requests", icon: TrendingUp },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-cyan-500 text-cyan-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.key === "endpoints" && <span className="ml-1 text-xs text-gray-400">({endpoints.length})</span>}
            {tab.key === "slow" && <span className="ml-1 text-xs text-gray-400">({slowRequests.length})</span>}
            {tab.key === "users" && <span className="ml-1 text-xs text-gray-400">({users.length})</span>}
            {tab.key === "recent" && <span className="ml-1 text-xs text-gray-400">({filteredRecent.length})</span>}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      {loading && !refreshing ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading data...
        </div>
      ) : (
        <>
          {/* ─── Endpoints Tab ─── */}
          {activeTab === "endpoints" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Search bar */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={endpointSearch}
                  onChange={(e) => setEndpointSearch(e.target.value)}
                  className="flex-1 text-sm outline-none placeholder-gray-400"
                />
                {endpointSearch && (
                  <button onClick={() => setEndpointSearch("")} className="text-gray-400 hover:text-gray-600 text-xs">Clear</button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Method</th>
                      <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("url")}>
                        <span className="flex items-center gap-1">Endpoint {sortIcon("url")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("hits")}>
                        <span className="flex items-center justify-end gap-1">Hits {sortIcon("hits")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("avgDuration")}>
                        <span className="flex items-center justify-end gap-1">Avg ms {sortIcon("avgDuration")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("maxDuration")}>
                        <span className="flex items-center justify-end gap-1">Max ms {sortIcon("maxDuration")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("errorCount")}>
                        <span className="flex items-center justify-end gap-1">Errors {sortIcon("errorCount")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("errorRate")}>
                        <span className="flex items-center justify-end gap-1">Err% {sortIcon("errorRate")}</span>
                      </th>
                      <th className="text-right px-4 py-3 font-medium">Users</th>
                      <th className="text-right px-4 py-3 font-medium">Last Hit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEndpoints.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                          {endpointSearch ? "No endpoints match your search" : "No API data recorded yet. Use the POS system to generate traffic."}
                        </td>
                      </tr>
                    ) : (
                      filteredEndpoints.map((ep, i) => (
                        <tr key={`${ep.method}-${ep.url}-${i}`} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${methodColor(ep.method)}`}>
                              {ep.method}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-800 max-w-[400px] truncate" title={ep.url}>{ep.url}</td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{ep.hits.toLocaleString()}</td>
                          <td className={`px-4 py-2.5 text-right font-medium ${durationColor(ep.avgDuration)}`}>{ep.avgDuration}</td>
                          <td className={`px-4 py-2.5 text-right font-medium ${durationColor(ep.maxDuration)}`}>{ep.maxDuration}</td>
                          <td className="px-4 py-2.5 text-right">
                            {ep.errorCount > 0 ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{ep.errorCount}</span>
                            ) : (
                              <span className="text-gray-300">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {ep.errorRate > 0 ? (
                              <span className={`text-xs font-medium ${ep.errorRate > 10 ? "text-red-600" : ep.errorRate > 3 ? "text-amber-600" : "text-gray-500"}`}>
                                {ep.errorRate}%
                              </span>
                            ) : (
                              <span className="text-gray-300">0%</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-500">{ep.uniqueUsers}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">{formatDateTimeLondon(ep.lastHit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Slow Tab ─── */}
          {activeTab === "slow" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-red-500" /> Slowest API Requests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Method</th>
                      <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                      <th className="text-right px-4 py-3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 font-medium">Duration</th>
                      <th className="text-left px-4 py-3 font-medium">User</th>
                      <th className="text-right px-4 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slowRequests.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No data yet</td></tr>
                    ) : (
                      slowRequests.map((r, i) => (
                        <tr key={r._id || i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${methodColor(r.method)}`}>{r.method}</span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-800 max-w-[400px] truncate" title={r.url}>{r.url}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${statusBadge(r.status)}`}>{r.status}</span>
                          </td>
                          <td className={`px-4 py-2.5 text-right font-bold ${durationColor(r.duration)}`}>{r.duration}ms</td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{r.user === "-" ? <span className="text-gray-300">anonymous</span> : r.user}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">{formatDateTimeLondon(r.timestamp)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Users Tab ─── */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> User Activity
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">User</th>
                      <th className="text-right px-4 py-3 font-medium">Requests</th>
                      <th className="text-right px-4 py-3 font-medium">Avg ms</th>
                      <th className="text-right px-4 py-3 font-medium">Errors</th>
                      <th className="text-right px-4 py-3 font-medium">Err%</th>
                      <th className="text-right px-4 py-3 font-medium">APIs Used</th>
                      <th className="text-right px-4 py-3 font-medium">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No user data yet</td></tr>
                    ) : (
                      users.map((u, i) => (
                        <tr key={u.user + i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">
                                {u.user === "-" ? "?" : u.user.charAt(0).toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-900 truncate max-w-[200px]">{u.user === "-" ? "Anonymous" : u.user}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900">{u.totalRequests.toLocaleString()}</td>
                          <td className={`px-4 py-2.5 text-right font-medium ${durationColor(u.avgDuration)}`}>{u.avgDuration}</td>
                          <td className="px-4 py-2.5 text-right">
                            {u.errorCount > 0 ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{u.errorCount}</span>
                            ) : (
                              <span className="text-gray-300">0</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`text-xs font-medium ${u.errorRate > 10 ? "text-red-600" : u.errorRate > 3 ? "text-amber-600" : "text-gray-500"}`}>
                              {u.errorRate}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-500">{u.endpointCount}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">{formatDateTimeLondon(u.lastActive)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── Recent Tab ─── */}
          {activeTab === "recent" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-500" /> Recent Requests
                  <span className="text-xs text-gray-400 font-normal">(auto-refreshes every 30s)</span>
                </h3>
                <div className="flex items-center gap-1">
                  {(["ALL", "WARN", "ERROR"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setRecentFilter(f)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        recentFilter === f
                          ? f === "ERROR" ? "bg-red-100 text-red-700" : f === "WARN" ? "bg-amber-100 text-amber-700" : "bg-cyan-100 text-cyan-700"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {f === "ALL" ? "All" : f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="text-gray-600 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-2.5 font-medium">Time</th>
                      <th className="text-left px-4 py-2.5 font-medium">Level</th>
                      <th className="text-left px-4 py-2.5 font-medium">Method</th>
                      <th className="text-left px-4 py-2.5 font-medium">Endpoint</th>
                      <th className="text-right px-4 py-2.5 font-medium">Status</th>
                      <th className="text-right px-4 py-2.5 font-medium">Duration</th>
                      <th className="text-left px-4 py-2.5 font-medium">User</th>
                      <th className="text-left px-4 py-2.5 font-medium">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecent.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No recent requests</td></tr>
                    ) : (
                      filteredRecent.map((r, i) => (
                        <tr key={r._id || i} className={`hover:bg-gray-50/60 transition-colors ${r.level === "ERROR" ? "bg-red-50/30" : r.level === "WARN" ? "bg-amber-50/30" : ""}`}>
                          <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDateTimeLondon(r.timestamp)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${levelBadge(r.level)}`}>{r.level}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${methodColor(r.method)}`}>{r.method}</span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-800 max-w-[350px] truncate" title={r.url}>{r.url}</td>
                          <td className="px-4 py-2 text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold ${statusBadge(r.status)}`}>{r.status}</span>
                          </td>
                          <td className={`px-4 py-2 text-right text-xs font-medium ${durationColor(r.duration)}`}>{r.duration}ms</td>
                          <td className="px-4 py-2 text-xs text-gray-600 truncate max-w-[150px]" title={r.user}>{r.user === "-" ? <span className="text-gray-300">-</span> : r.user}</td>
                          <td className="px-4 py-2 text-xs text-gray-400">{r.ip}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Select2-style Tenant Dropdown ─── */
function TenantSelect({
  tenants,
  value,
  onChange,
}: {
  tenants: TenantListItem[];
  value: string;
  onChange: (tenantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = tenants.find((t) => t.tenantId === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) =>
        t.tenantId.toLowerCase().includes(q) ||
        (t.name || "").toLowerCase().includes(q) ||
        (t.companyName || "").toLowerCase().includes(q) ||
        `tenant_${t.tenantId}`.includes(q)
    );
  }, [tenants, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative min-w-[280px]" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center gap-2 pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-cyan-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none cursor-pointer transition-colors text-left"
      >
        <Database className="h-4 w-4 text-cyan-600 shrink-0" />
        <span className="flex-1 truncate text-gray-800">
          {selected
            ? <>{selected.name || selected.tenantId}{selected.companyName && selected.companyName !== selected.name ? <span className="text-gray-400"> ({selected.companyName})</span> : ""}</>
            : <span className="text-gray-400">Select tenant...</span>
          }
        </span>
        {selected && (
          <span className="text-xs font-mono text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded shrink-0">
            tenant_{selected.tenantId}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant, company, DB..."
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No tenants match &ldquo;{search}&rdquo;</div>
            ) : (
              filtered.map((t) => {
                const isSelected = t.tenantId === value;
                const isSuspended = t.status === "suspended";
                return (
                  <button
                    key={t.tenantId}
                    type="button"
                    onClick={() => { onChange(t.tenantId); setOpen(false); setSearch(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected ? "bg-cyan-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isSuspended ? "bg-red-400" : "bg-emerald-400"}`} />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${isSelected ? "text-cyan-800" : "text-gray-800"}`}>
                          {t.name || t.tenantId}
                        </span>
                        {t.companyName && t.companyName !== t.name && (
                          <span className="text-gray-400 text-xs truncate">({t.companyName})</span>
                        )}
                        {isSuspended && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">Suspended</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        DB: tenant_{t.tenantId}
                        {t.planKey && <span className="ml-2 text-indigo-500">Plan: {t.planKey}</span>}
                      </div>
                    </div>

                    {/* Check mark */}
                    {isSelected && <Check className="h-4 w-4 text-cyan-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Card Component ─── */
function SummaryCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan-50 to-cyan-100/50 border-cyan-200 text-cyan-700",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700",
    red: "from-red-50 to-red-100/50 border-red-200 text-red-700",
    amber: "from-amber-50 to-amber-100/50 border-amber-200 text-amber-700",
    blue: "from-blue-50 to-blue-100/50 border-blue-200 text-blue-700",
    indigo: "from-indigo-50 to-indigo-100/50 border-indigo-200 text-indigo-700",
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${c}`}>
      <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-medium">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}
