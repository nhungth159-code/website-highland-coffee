"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  getApplications,
  updateApplicationStatus,
  addApplicationReply,
  addInboundApplicationReplies,
  markApplicationRepliesSeen,
  deleteApplication,
} from "@/lib/applications";
import type { Application, ApplicationStatus, AppReplyLog } from "@/lib/applications";
import type { InboundReply } from "@/app/api/fetch-replies/route";

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

type AppReplySendState = "idle" | "sending" | "success" | "error";

interface AppReplyDraft {
  app: Application;
  body: string;
  agentName: string;
  sendState: AppReplySendState;
  errorMsg: string;
}

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
  const [replyDraft, setReplyDraft] = useState<AppReplyDraft | null>(null);
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const lastPolledRef = useRef<number>(0);

  const load = () => setApps(getApplications());

  useEffect(() => {
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Total unseen inbound replies across all applications
  const unseenCount = useMemo(
    () => apps.flatMap((a) => a.replies ?? []).filter((r) => r.type === "inbound" && !r.seen).length,
    [apps]
  );

  const silentPoll = useCallback(async () => {
    if (Date.now() - lastPolledRef.current < 50_000) return;
    lastPolledRef.current = Date.now();
    try {
      const res = await fetch("/api/fetch-replies");
      const data: { replies?: InboundReply[]; skipped?: boolean } = await res.json();
      if (data.skipped || !data.replies) return;
      const appReplies = data.replies.filter((r) => r.recordType === "application");
      if (appReplies.length === 0) return;
      const { apps: updated, added } = addInboundApplicationReplies(
        appReplies.map((r) => ({
          appId: r.recordId,
          fromEmail: r.fromEmail,
          body: r.body,
          receivedAt: r.receivedAt,
          emailMessageId: r.emailMessageId,
        }))
      );
      if (added > 0) setApps(updated);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => silentPoll(), 6_000);
    const iv = setInterval(() => silentPoll(), 60_000);
    window.addEventListener("focus", silentPoll);
    return () => { clearTimeout(t); clearInterval(iv); window.removeEventListener("focus", silentPoll); };
  }, [silentPoll]);

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

  const fireStatusEmail = (app: Application, status: ApplicationStatus) => {
    fetch("/api/application-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: app.name,
        email: app.email,
        jobTitle: app.jobTitle,
        appId: app.id,
        status,
      }),
    }).catch(() => {});
  };

  const advance = (id: string, next: ApplicationStatus) => {
    const app = apps.find((a) => a.id === id);
    setApps(updateApplicationStatus(id, next));
    if (app) fireStatusEmail(app, next);
  };

  const reject = (id: string) => {
    const app = apps.find((a) => a.id === id);
    setApps(updateApplicationStatus(id, "rejected"));
    if (app) fireStatusEmail(app, "rejected");
  };

  const handleDelete = (id: string) => {
    setApps(deleteApplication(id));
    setConfirmDelete(null);
    if (expanded === id) setExpanded(null);
  };

  const openReply = (app: Application) => {
    setReplyDraft({
      app,
      body: `Hi ${app.name},\n\nThank you for applying for the ${app.jobTitle} position at Highlands Coffee.\n\n`,
      agentName: "Highlands Coffee Team",
      sendState: "idle",
      errorMsg: "",
    });
  };

  const sendReply = async () => {
    if (!replyDraft) return;
    if (!replyDraft.body.trim()) return;
    setReplyDraft((d) => d && { ...d, sendState: "sending", errorMsg: "" });
    try {
      const res = await fetch("/api/reply-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toName: replyDraft.app.name,
          toEmail: replyDraft.app.email,
          body: replyDraft.body,
          jobTitle: replyDraft.app.jobTitle,
          appId: replyDraft.app.id,
          agentName: replyDraft.agentName,
        }),
      });
      const data = await res.json();
      if (data.success || data.skipped) {
        setReplyDraft((d) => d && { ...d, sendState: "success" });
        const outbound: AppReplyLog = {
          sentAt: new Date().toISOString(),
          body: replyDraft.body,
          type: "outbound",
          agentName: replyDraft.agentName || "Highlands Coffee Team",
        };
        setApps(addApplicationReply(replyDraft.app.id, outbound));
      } else {
        throw new Error(data.error || "Send failed");
      }
    } catch (err) {
      setReplyDraft((d) => d && { ...d, sendState: "error", errorMsg: String(err) });
    }
  };

  const checkForReplies = async () => {
    setCheckingReplies(true);
    setCheckResult(null);
    lastPolledRef.current = 0; // bypass debounce for manual check
    try {
      const res = await fetch("/api/fetch-replies");
      const data: { replies?: InboundReply[]; skipped?: boolean; error?: string } = await res.json();
      if (data.skipped) { setCheckResult("Email not configured."); return; }
      if (data.error) { setCheckResult(`Error: ${data.error}`); return; }
      lastPolledRef.current = Date.now();
      const appReplies = (data.replies ?? []).filter((r) => r.recordType === "application");
      const { apps: updated, added } = addInboundApplicationReplies(
        appReplies.map((r) => ({
          appId: r.recordId,
          fromEmail: r.fromEmail,
          body: r.body,
          receivedAt: r.receivedAt,
          emailMessageId: r.emailMessageId,
        }))
      );
      setApps(updated);
      setCheckResult(added > 0 ? `${added} new reply${added > 1 ? "s" : ""} added.` : "All caught up.");
    } catch (err) {
      setCheckResult(`Failed: ${String(err)}`);
    } finally {
      setCheckingReplies(false);
      setTimeout(() => setCheckResult(null), 3_500);
    }
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
            <span className="text-white/20">/</span>
            <Link href="/admin/contacts" className="text-white/50 hover:text-white transition-colors">
              Contacts
            </Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors">
              Gift Cards
            </Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors">
              Promotions
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {checkResult && (
            <span className={`text-xs px-2.5 py-1 ${checkResult.startsWith("Error") || checkResult.startsWith("Failed") ? "bg-red-900/50 text-red-300" : checkResult.includes("new repl") ? "bg-[#2D5016]/60 text-green-300" : "bg-white/10 text-white/60"}`}>
              {checkResult}
            </span>
          )}
          <button
            onClick={checkForReplies}
            disabled={checkingReplies}
            className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {checkingReplies ? (
              <svg className="animate-spin" width="13" height="13" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            )}
            {checkingReplies ? "Checking…" : "Replies"}
            {!checkingReplies && unseenCount > 0 && (
              <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 leading-none animate-pulse">
                {unseenCount > 99 ? "99+" : unseenCount}
              </span>
            )}
          </button>
          <Link href="/careers" className="text-white/50 hover:text-white text-sm transition-colors">
            View Careers Page →
          </Link>
        </div>
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
                    onClick={() => {
                      const next = isExpanded ? null : app.id;
                      setExpanded(next);
                      if (next) {
                        const hasUnseen = app.replies?.some((r) => r.type === "inbound" && !r.seen);
                        if (hasUnseen) setApps(markApplicationRepliesSeen(next));
                      }
                    }}
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
                        {(() => {
                          const n = (app.replies ?? []).filter((r) => r.type === "inbound" && !r.seen).length;
                          return n > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                              {n} new
                            </span>
                          ) : null;
                        })()}
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
                          {app.cvName && app.cvData && (
                            <div>
                              <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-1">CV / Resume</p>
                              <a
                                href={app.cvData}
                                download={app.cvName}
                                className="inline-flex items-center gap-2 bg-[#3B1F0A] text-white text-xs font-semibold px-4 py-2 hover:bg-[#C8820A] transition-colors"
                              >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {app.cvName}
                              </a>
                            </div>
                          )}
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

                      {/* ── Conversation Thread ── */}
                      {app.replies && app.replies.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[10px] font-semibold text-[#3B1F0A]/35 tracking-widest uppercase mb-2">
                            Conversation Thread
                            <span className="ml-2 bg-[#C8820A]/15 text-[#C8820A] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {app.replies.length}
                            </span>
                          </p>
                          <div className="space-y-2">
                            {app.replies.map((r, i) => {
                              const isInbound = r.type === "inbound";
                              return (
                                <div key={i} className={`border ${isInbound ? "border-blue-200 bg-blue-50/60" : "border-[#3B1F0A]/8 bg-white"}`}>
                                  <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b ${isInbound ? "bg-blue-100/50 border-blue-200/70" : "bg-[#3B1F0A]/3 border-[#3B1F0A]/6"}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isInbound ? "bg-blue-500" : "bg-[#C8820A]"}`}>
                                        {isInbound ? (
                                          <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        ) : (
                                          <svg width="9" height="9" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className={`text-xs font-semibold ${isInbound ? "text-blue-700" : "text-[#3B1F0A]"}`}>
                                        {isInbound ? `${app.name} ← replied` : `${r.agentName ?? "Team"} → ${app.email}`}
                                      </span>
                                    </div>
                                    <span className="text-[#3B1F0A]/30 text-[11px] shrink-0">
                                      {new Date(r.sentAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <div className="px-4 py-2.5">
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isInbound ? "text-blue-900/70" : "text-[#3B1F0A]/60"}`}>{r.body}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Message Applicant button */}
                      <div className="mb-4">
                        <button
                          onClick={() => openReply(app)}
                          className="flex items-center gap-1.5 border border-[#3B1F0A]/15 text-[#3B1F0A]/55 text-xs font-semibold px-4 py-2 hover:border-[#C8820A] hover:text-[#C8820A] transition-all"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Message Applicant
                        </button>
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

      {/* ── Reply Composer Modal ── */}
      {replyDraft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div
            className="absolute inset-0 bg-[#1A0D00]/70 backdrop-blur-sm"
            onClick={() => replyDraft.sendState !== "sending" && setReplyDraft(null)}
          />
          <div className="relative w-full sm:max-w-2xl bg-white flex flex-col shadow-2xl max-h-[90vh] overflow-hidden">

            <div className="bg-[#3B1F0A] px-6 py-4 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[#C8820A] text-[10px] font-semibold tracking-widest uppercase mb-1">Message Applicant</p>
                <p className="text-white font-semibold text-sm">
                  To: <span className="text-white/70">{replyDraft.app.name}</span>
                  <span className="text-white/35 ml-2 font-normal">&lt;{replyDraft.app.email}&gt;</span>
                </p>
                <p className="text-white/40 text-xs mt-0.5">{replyDraft.app.jobTitle}</p>
              </div>
              {replyDraft.sendState !== "sending" && (
                <button onClick={() => setReplyDraft(null)} className="text-white/40 hover:text-white transition-colors mt-0.5">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {replyDraft.sendState === "success" ? (
              <div className="flex flex-col items-center justify-center text-center py-14 px-8 flex-1">
                <div className="w-14 h-14 bg-[#2D5016]/10 flex items-center justify-center mb-5">
                  <svg width="28" height="28" fill="none" stroke="#2D5016" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#3B1F0A] text-xl mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>Message Sent!</h3>
                <p className="text-[#C8820A] font-semibold text-sm mb-7">{replyDraft.app.email}</p>
                <button onClick={() => setReplyDraft(null)} className="bg-[#3B1F0A] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#C8820A] transition-colors">
                  Close
                </button>
              </div>
            ) : (
              <div className="flex flex-col overflow-y-auto flex-1">
                <div className="px-6 py-5 space-y-4 flex-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">Sent by (your name / team)</label>
                    <input
                      type="text"
                      value={replyDraft.agentName}
                      onChange={(e) => setReplyDraft((d) => d && { ...d, agentName: e.target.value })}
                      placeholder="e.g. Lan Phương — Talent Team"
                      className="w-full border border-[#3B1F0A]/12 px-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea
                      rows={10}
                      value={replyDraft.body}
                      onChange={(e) => setReplyDraft((d) => d && { ...d, body: e.target.value })}
                      placeholder="Write your message…"
                      className="w-full border border-[#3B1F0A]/12 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors resize-none leading-relaxed"
                    />
                  </div>
                  {replyDraft.sendState === "error" && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 border border-red-100">{replyDraft.errorMsg || "Failed to send."}</p>
                  )}
                </div>
                <div className="border-t border-[#3B1F0A]/8 px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-white">
                  <p className="text-[#3B1F0A]/35 text-xs">Email will include application reference [{replyDraft.app.id}].</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setReplyDraft(null)} className="text-sm text-[#3B1F0A]/45 hover:text-[#3B1F0A] px-4 py-2 border border-[#3B1F0A]/12 hover:border-[#3B1F0A]/30 transition-all">
                      Discard
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={replyDraft.sendState === "sending" || !replyDraft.body.trim()}
                      className="flex items-center gap-2 bg-[#3B1F0A] text-white text-sm font-semibold px-5 py-2 hover:bg-[#C8820A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replyDraft.sendState === "sending" ? (
                        <>
                          <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
