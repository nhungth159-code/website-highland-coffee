"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getApplications,
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/applications";
import type { Application, ApplicationStatus } from "@/lib/applications";

// ── Config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
    next?: ApplicationStatus;
    nextLabel?: string;
  }
> = {
  new:        { label: "New",        bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400",  next: "reviewing",  nextLabel: "Start Review"      },
  reviewing:  { label: "Reviewing",  bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400",   next: "interviewed",nextLabel: "Move to Interview"  },
  interviewed:{ label: "Interviewed",bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400", next: "hired",      nextLabel: "Mark as Hired"     },
  hired:      { label: "Hired",      bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"                                                       },
  rejected:   { label: "Rejected",   bg: "bg-slate-100", text: "text-slate-500",  dot: "bg-slate-400"                                                       },
};

const DEPT_COLOR: Record<string, string> = {
  "Store Ops":  "bg-amber-50 text-amber-700",
  Corporate:    "bg-blue-50 text-blue-700",
  Marketing:    "bg-purple-50 text-purple-700",
  Technology:   "bg-green-50 text-green-700",
};

type FilterTab = "All" | ApplicationStatus;
const TABS: FilterTab[] = ["All", "new", "reviewing", "interviewed", "hired", "rejected"];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Page ──────────────────────────────────────────────────────
export default function ApplicationsAdminPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = () => setApps(getApplications());

  useEffect(() => {
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stats = useMemo(() => ({
    total:       apps.length,
    new:         apps.filter((a) => a.status === "new").length,
    active:      apps.filter((a) => a.status === "reviewing" || a.status === "interviewed").length,
    hired:       apps.filter((a) => a.status === "hired").length,
    rejected:    apps.filter((a) => a.status === "rejected").length,
  }), [apps]);

  const filtered = useMemo(() => {
    let list = filter === "All" ? apps : apps.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, filter, search]);

  const advance = (id: string, next: ApplicationStatus) => {
    setApps(updateApplicationStatus(id, next));
  };

  const reject = (id: string) => {
    setApps(updateApplicationStatus(id, "rejected"));
  };

  const handleDelete = (id: string) => {
    setApps(deleteApplication(id));
    setConfirmDelete(null);
    if (expanded === id) setExpanded(null);
  };

  return (
    <div
      className="min-h-screen bg-[#F5F0E8]"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-[#3B1F0A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-bold text-xl tracking-widest text-white"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            HIGHLANDS
          </Link>
          <span className="text-white/20 text-lg">|</span>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-white/50 hover:text-white transition-colors">
              Orders
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold">Applications</span>
          </div>
        </div>
        <Link href="/careers" className="text-white/50 hover:text-white text-sm transition-colors">
          View Careers Page →
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Title */}
        <div>
          <h1
            className="text-2xl font-bold text-[#3B1F0A]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Job Applications
          </h1>
          <p className="text-sm text-[#3B1F0A]/45 mt-0.5">
            Review and manage candidates who applied through the careers page.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total",     value: stats.total,    color: "text-[#3B1F0A]" },
            { label: "New",       value: stats.new,      color: "text-amber-600" },
            { label: "Active",    value: stats.active,   color: "text-blue-600"  },
            { label: "Hired",     value: stats.hired,    color: "text-green-600" },
            { label: "Rejected",  value: stats.rejected, color: "text-slate-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 px-4 py-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                {s.value}
              </p>
              <p className="text-[11px] text-[#3B1F0A]/40 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tab filters */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const cfg = tab !== "All" ? STATUS_CONFIG[tab] : null;
              const count = tab === "All" ? apps.length : apps.filter((a) => a.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    filter === tab
                      ? "bg-[#3B1F0A] text-white"
                      : cfg
                      ? `${cfg.bg} ${cfg.text} hover:opacity-80`
                      : "bg-white border border-[#3B1F0A]/12 text-[#3B1F0A]/60 hover:text-[#3B1F0A]"
                  }`}
                >
                  {tab === "All" ? "All" : cfg!.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="sm:ml-auto relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role…"
              className="pl-9 pr-4 py-2 text-sm border border-[#3B1F0A]/12 bg-white text-[#3B1F0A] outline-none focus:border-[#C8820A] transition-colors w-full sm:w-64"
            />
          </div>
        </div>

        {/* Application list */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
            <p className="text-[#3B1F0A]/35 text-sm">
              {apps.length === 0
                ? "No applications yet. They will appear here once candidates apply."
                : "No applications match your current filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => {
              const cfg = STATUS_CONFIG[app.status];
              const isExpanded = expanded === app.id;
              return (
                <div
                  key={app.id}
                  className="bg-white border border-[#3B1F0A]/8 overflow-hidden"
                >
                  {/* Card header */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#3B1F0A]/2 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : app.id)}
                  >
                    {/* Avatar initials */}
                    <div className="w-10 h-10 rounded-full bg-[#C8820A]/12 text-[#C8820A] font-bold text-sm flex items-center justify-center shrink-0">
                      {app.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#3B1F0A] text-sm">{app.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 ${DEPT_COLOR[app.dept] ?? "bg-gray-50 text-gray-600"}`}>
                          {app.dept}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 ${cfg.bg} ${cfg.text} flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#3B1F0A]/50 mt-0.5">
                        {app.jobTitle} · {timeAgo(app.appliedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {cfg.next && cfg.nextLabel && app.status !== "hired" && (
                        <button
                          onClick={() => advance(app.id, cfg.next!)}
                          className="text-xs bg-[#C8820A] text-white px-3 py-1.5 font-semibold hover:bg-[#3B1F0A] transition-colors hidden sm:block"
                        >
                          {cfg.nextLabel}
                        </button>
                      )}
                      {app.status !== "rejected" && app.status !== "hired" && (
                        <button
                          onClick={() => reject(app.id)}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 transition-colors hidden sm:block"
                        >
                          Reject
                        </button>
                      )}
                      <svg
                        className={`text-[#3B1F0A]/25 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-[#3B1F0A]/6 px-5 py-5 bg-[#FAF6EF]/60">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-0.5">Application ID</p>
                            <p className="text-sm font-mono font-bold text-[#3B1F0A]">{app.id}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-0.5">Role Applied For</p>
                            <p className="text-sm text-[#3B1F0A]">{app.jobTitle}</p>
                            <p className="text-xs text-[#3B1F0A]/40">{app.location}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-0.5">Applied</p>
                            <p className="text-sm text-[#3B1F0A]">
                              {new Date(app.appliedAt).toLocaleString("vi-VN", {
                                year: "numeric", month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-0.5">Contact</p>
                            <p className="text-sm text-[#3B1F0A]">{app.email}</p>
                            <p className="text-sm text-[#3B1F0A]">{app.phone}</p>
                          </div>
                          {app.cover && (
                            <div>
                              <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-1">Cover Note</p>
                              <p className="text-sm text-[#3B1F0A]/70 leading-relaxed bg-white border border-[#3B1F0A]/8 px-3 py-2.5 italic">
                                &ldquo;{app.cover}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile actions */}
                      <div className="flex flex-wrap gap-2 sm:hidden mb-4">
                        {cfg.next && cfg.nextLabel && app.status !== "hired" && (
                          <button
                            onClick={() => advance(app.id, cfg.next!)}
                            className="text-xs bg-[#C8820A] text-white px-4 py-2 font-semibold hover:bg-[#3B1F0A] transition-colors"
                          >
                            {cfg.nextLabel}
                          </button>
                        )}
                        {app.status !== "rejected" && app.status !== "hired" && (
                          <button
                            onClick={() => reject(app.id)}
                            className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>

                      {/* Status pipeline */}
                      <div className="flex items-center gap-1.5 mb-4">
                        {(["new", "reviewing", "interviewed", "hired"] as ApplicationStatus[]).map((s, i) => {
                          const done = ["new","reviewing","interviewed","hired"].indexOf(app.status) >= i;
                          const active = app.status === s;
                          return (
                            <div key={s} className="flex items-center gap-1.5">
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold transition-all ${
                                active
                                  ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} ring-1 ring-current/30`
                                  : done
                                  ? "bg-[#3B1F0A]/8 text-[#3B1F0A]/50"
                                  : "bg-white border border-[#3B1F0A]/8 text-[#3B1F0A]/20"
                              }`}>
                                {STATUS_CONFIG[s].label}
                              </div>
                              {i < 3 && (
                                <svg className="text-[#3B1F0A]/20 shrink-0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M9 18l6-6-6-6" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                        {app.status === "rejected" && (
                          <div className="ml-2 px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Rejected
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      {confirmDelete === app.id ? (
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-red-600 font-medium">Delete this application permanently?</p>
                          <button onClick={() => handleDelete(app.id)} className="text-xs bg-red-500 text-white px-3 py-1.5 hover:bg-red-600 transition-colors">
                            Yes, delete
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-[#3B1F0A]/45 hover:text-[#3B1F0A] transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(app.id)}
                          className="text-xs text-[#3B1F0A]/30 hover:text-red-500 transition-colors"
                        >
                          Delete application
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
