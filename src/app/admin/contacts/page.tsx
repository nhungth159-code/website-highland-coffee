"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  getContacts,
  updateContactStatus,
  updateContactNote,
  addContactReply,
  addInboundContactReplies,
  markContactRepliesSeen,
  deleteContact,
} from "@/lib/contacts";
import type { ContactMessage, ContactStatus } from "@/lib/contacts";
import type { InboundReply } from "@/app/api/fetch-replies/route";

// ── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; color: string; bg: string; dot: string; next: ContactStatus | null; nextLabel: string | null }
> = {
  new:         { label: "New",         color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   dot: "bg-blue-500",   next: "in-progress", nextLabel: "Start Review" },
  "in-progress": { label: "In Progress", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500",  next: "resolved",    nextLabel: "Mark Resolved" },
  resolved:    { label: "Resolved",    color: "text-green-700",  bg: "bg-green-50 border-green-200", dot: "bg-green-500",  next: "closed",      nextLabel: "Close" },
  closed:      { label: "Closed",      color: "text-slate-500",  bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400",  next: null,          nextLabel: null },
};

const SUBJECT_COLORS: Record<string, string> = {
  "Order Issue":             "bg-red-50 text-red-700",
  "Customer Feedback":       "bg-purple-50 text-purple-700",
  "Franchise & Partnership": "bg-emerald-50 text-emerald-700",
  "Press & Media":           "bg-sky-50 text-sky-700",
  "Careers":                 "bg-indigo-50 text-indigo-700",
  "Sustainability":          "bg-lime-50 text-lime-700",
  "General Enquiry":         "bg-stone-100 text-stone-600",
  "Other":                   "bg-stone-100 text-stone-600",
};

const ALL_STATUSES = ["all", "new", "in-progress", "resolved", "closed"] as const;
type FilterTab = (typeof ALL_STATUSES)[number];

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Reply composer types ─────────────────────────────────────────────────────
type ReplySendState = "idle" | "sending" | "success" | "error";

interface ReplyDraft {
  msg: ContactMessage;
  subject: string;
  body: string;
  agentName: string;
  sendState: ReplySendState;
  errorMsg: string;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reply, setReply] = useState<ReplyDraft | null>(null);
  const [checkingReplies, setCheckingReplies] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const lastPolledRef = useRef<number>(0);

  useEffect(() => { setMessages(getContacts()); setMounted(true); }, []);

  // Total unseen inbound replies across all messages
  const unseenCount = useMemo(
    () => messages.flatMap((m) => m.replies ?? []).filter((r) => r.type === "inbound" && !r.seen).length,
    [messages]
  );

  // Silent background poll — only updates state when new replies arrive
  const silentPoll = useCallback(async () => {
    if (Date.now() - lastPolledRef.current < 50_000) return; // debounce: max once per 50s
    lastPolledRef.current = Date.now();
    try {
      const res = await fetch("/api/fetch-replies");
      const data: { replies?: InboundReply[]; skipped?: boolean } = await res.json();
      if (data.skipped || !data.replies) return;
      const contactReplies = data.replies.filter((r) => r.recordType === "contact");
      if (contactReplies.length === 0) return;
      const { messages: updated, added } = addInboundContactReplies(
        contactReplies.map((r) => ({
          refId: r.recordId,
          fromEmail: r.fromEmail,
          body: r.body,
          receivedAt: r.receivedAt,
          emailMessageId: r.emailMessageId,
        }))
      );
      if (added > 0) setMessages(updated);
    } catch { /* silent */ }
  }, []);

  // Auto-poll on mount (after 6s) then every 60s; also re-poll on window focus
  useEffect(() => {
    const t = setTimeout(() => silentPoll(), 6_000);
    const iv = setInterval(() => silentPoll(), 60_000);
    window.addEventListener("focus", silentPoll);
    return () => { clearTimeout(t); clearInterval(iv); window.removeEventListener("focus", silentPoll); };
  }, [silentPoll]);

  // Manual check — same as silent poll but with UI feedback
  const checkForReplies = async () => {
    setCheckingReplies(true);
    setCheckResult(null);
    lastPolledRef.current = 0; // reset debounce so manual always runs
    try {
      const res = await fetch("/api/fetch-replies");
      const data: { replies?: InboundReply[]; skipped?: boolean; error?: string } = await res.json();
      if (data.skipped) { setCheckResult("Email not configured."); return; }
      if (data.error) { setCheckResult(`Error: ${data.error}`); return; }
      lastPolledRef.current = Date.now();
      const contactReplies = (data.replies ?? []).filter((r) => r.recordType === "contact");
      const { messages: updated, added } = addInboundContactReplies(
        (contactReplies).map((r) => ({
          refId: r.recordId,
          fromEmail: r.fromEmail,
          body: r.body,
          receivedAt: r.receivedAt,
          emailMessageId: r.emailMessageId,
        }))
      );
      setMessages(updated);
      setCheckResult(added > 0 ? `${added} new reply${added > 1 ? "s" : ""} added.` : "All caught up.");
    } catch (err) {
      setCheckResult(`Failed: ${String(err)}`);
    } finally {
      setCheckingReplies(false);
      setTimeout(() => setCheckResult(null), 3_500);
    }
  };

  const openReply = (msg: ContactMessage) => {
    setReply({
      msg,
      subject: msg.subject,
      body: `Hi ${msg.name},\n\nThank you for contacting Highlands Coffee regarding "${msg.subject}".\n\n`,
      agentName: "Highlands Coffee Team",
      sendState: "idle",
      errorMsg: "",
    });
  };

  const sendReply = async () => {
    if (!reply) return;
    if (!reply.body.trim()) return;
    setReply((r) => r && { ...r, sendState: "sending", errorMsg: "" });
    try {
      const res = await fetch("/api/reply-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toName: reply.msg.name,
          toEmail: reply.msg.email,
          subject: reply.subject,
          body: reply.body,
          originalMessage: reply.msg.message,
          refId: reply.msg.refId,
          agentName: reply.agentName,
        }),
      });
      const data = await res.json();
      if (data.success || data.skipped) {
        setReply((r) => r && { ...r, sendState: "success" });
        // Save reply to the conversation log
        const updated = addContactReply(reply.msg.id, {
          sentAt: new Date().toISOString(),
          agentName: reply.agentName || "Highlands Coffee Team",
          body: reply.body,
        });
        setMessages(updated);
        // Auto-advance status to in-progress if still "new"
        if (reply.msg.status === "new") {
          setMessages(updateContactStatus(reply.msg.id, "in-progress"));
        }
      } else {
        throw new Error(data.error || "Send failed");
      }
    } catch (err) {
      setReply((r) => r && { ...r, sendState: "error", errorMsg: String(err) });
    }
  };

  const subjects = useMemo(() => {
    const s = new Set(messages.map((m) => m.subject));
    return ["all", ...Array.from(s)];
  }, [messages]);

  const filtered = useMemo(() => {
    let list = messages;
    if (filter !== "all") list = list.filter((m) => m.status === filter);
    if (subjectFilter !== "all") list = list.filter((m) => m.subject === subjectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.refId.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, filter, subjectFilter, search]);

  const counts = useMemo(() => ({
    all: messages.length,
    new: messages.filter((m) => m.status === "new").length,
    "in-progress": messages.filter((m) => m.status === "in-progress").length,
    resolved: messages.filter((m) => m.status === "resolved").length,
    closed: messages.filter((m) => m.status === "closed").length,
  }), [messages]);

  const advance = (id: string, next: ContactStatus) => {
    setMessages(updateContactStatus(id, next));
  };

  const handleDelete = (id: string) => {
    setMessages(deleteContact(id));
    setDeleteConfirm(null);
    if (expanded === id) setExpanded(null);
  };

  const saveNote = (id: string) => {
    setMessages(updateContactNote(id, noteValue));
    setEditingNote(null);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">

      {/* ── Header ── */}
      <header className="bg-[#3B1F0A] text-white px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white transition-colors" title="Back to site">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-lg font-bold tracking-widest" style={{ fontFamily: "var(--font-playfair), serif" }}>
            HIGHLANDS
          </p>
          <span className="text-white/20 text-lg">|</span>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-white/50 hover:text-white transition-colors">Orders</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/applications" className="text-white/50 hover:text-white transition-colors">Applications</Link>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold">Contacts</span>
            <span className="text-white/20">/</span>
            <Link href="/admin/gift-cards" className="text-white/50 hover:text-white transition-colors">Gift Cards</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/promotions" className="text-white/50 hover:text-white transition-colors">Promotions</Link>
            <span className="text-white/20">/</span>
            <Link href="/admin/loyalty" className="text-white/50 hover:text-white transition-colors">Loyalty</Link>
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
            className="relative flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            {checkingReplies ? (
              <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
          <button
            onClick={() => setMessages(getContacts())}
            className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">

        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#3B1F0A]" style={{ fontFamily: "var(--font-playfair), serif" }}>
            Contacts
          </h1>
          <p className="text-sm text-[#3B1F0A]/45 mt-0.5">
            View and respond to customer enquiries submitted through the contact form.
          </p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Messages", value: counts.all, color: "text-[#3B1F0A]" },
            { label: "New", value: counts.new, color: "text-blue-600" },
            { label: "In Progress", value: counts["in-progress"], color: "text-amber-600" },
            { label: "Resolved", value: counts.resolved, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#3B1F0A]/8 px-5 py-4">
              <p className={`text-2xl font-bold mb-1 ${s.color}`} style={{ fontFamily: "var(--font-playfair), serif" }}>
                {s.value}
              </p>
              <p className="text-[#3B1F0A]/45 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-[#3B1F0A]/8 mb-6">
          {/* Status tabs */}
          <div className="flex border-b border-[#3B1F0A]/8 overflow-x-auto">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  filter === s
                    ? "border-[#C8820A] text-[#C8820A]"
                    : "border-transparent text-[#3B1F0A]/45 hover:text-[#3B1F0A]"
                }`}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s as ContactStatus].label}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  filter === s ? "bg-[#C8820A]/15 text-[#C8820A]" : "bg-[#3B1F0A]/6 text-[#3B1F0A]/40"
                }`}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* Search + subject filter */}
          <div className="flex flex-col sm:flex-row gap-3 p-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/30" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search name, email, ref ID, message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-[#3B1F0A]/12 pl-9 pr-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors"
              />
            </div>
            <div className="relative sm:w-52">
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full appearance-none border border-[#3B1F0A]/12 px-4 py-2.5 text-sm text-[#3B1F0A] focus:outline-none focus:border-[#C8820A] bg-white pr-8 transition-colors"
              >
                <option value="all">All Subjects</option>
                {subjects.filter((s) => s !== "all").map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B1F0A]/40 pointer-events-none" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Message list ── */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#3B1F0A]/8 py-20 text-center">
            <p className="text-[#3B1F0A]/35 text-sm">No messages found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((msg) => {
              const sc = STATUS_CONFIG[msg.status];
              const isExpanded = expanded === msg.id;
              const isEditingThisNote = editingNote === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`bg-white border transition-all duration-150 ${
                    isExpanded ? "border-[#C8820A]/30 shadow-sm" : "border-[#3B1F0A]/8 hover:border-[#3B1F0A]/20"
                  }`}
                >
                  {/* ── Row header ── */}
                  <button
                    onClick={() => {
                      const next = isExpanded ? null : msg.id;
                      setExpanded(next);
                      if (next) {
                        const hasUnseen = msg.replies?.some((r) => r.type === "inbound" && !r.seen);
                        if (hasUnseen) setMessages(markContactRepliesSeen(next));
                      }
                    }}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left"
                  >
                    {/* Status dot */}
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-[#3B1F0A]">{msg.name}</span>
                        <span className="text-[#3B1F0A]/35 text-xs">{msg.email}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${SUBJECT_COLORS[msg.subject] ?? "bg-stone-100 text-stone-600"}`}>
                          {msg.subject}
                        </span>
                      </div>
                      <p className="text-[#3B1F0A]/55 text-xs truncate max-w-lg">{msg.message}</p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const n = (msg.replies ?? []).filter((r) => r.type === "inbound" && !r.seen).length;
                          return n > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                              {n} new
                            </span>
                          ) : null;
                        })()}
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <span className="text-[#3B1F0A]/30 text-[11px]">{timeAgo(msg.submittedAt)}</span>
                    </div>
                  </button>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div className="border-t border-[#3B1F0A]/8 px-5 py-5 space-y-5">
                      {/* Contact info + ref */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Reference", value: msg.refId },
                          { label: "Email", value: msg.email },
                          { label: "Submitted", value: new Date(msg.submittedAt).toLocaleString("vi-VN") },
                        ].map((f) => (
                          <div key={f.label} className="bg-[#FAF6EF] px-4 py-3">
                            <p className="text-[#3B1F0A]/40 text-[10px] font-semibold uppercase tracking-wider mb-1">{f.label}</p>
                            <p className="text-[#3B1F0A] text-sm font-medium font-mono">{f.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Full message */}
                      <div>
                        <p className="text-[#3B1F0A]/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Message</p>
                        <div className="bg-[#FAF6EF] border-l-4 border-[#C8820A]/40 px-4 py-3">
                          <p className="text-[#3B1F0A]/75 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>

                      {/* Internal note */}
                      <div>
                        <p className="text-[#3B1F0A]/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Internal Note</p>
                        {isEditingThisNote ? (
                          <div className="flex gap-2">
                            <textarea
                              value={noteValue}
                              onChange={(e) => setNoteValue(e.target.value)}
                              placeholder="Add a note for your team…"
                              rows={2}
                              className="flex-1 border border-[#3B1F0A]/15 px-3 py-2 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] resize-none transition-colors"
                            />
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => saveNote(msg.id)}
                                className="px-3 py-1.5 bg-[#3B1F0A] text-white text-xs font-semibold hover:bg-[#C8820A] transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNote(null)}
                                className="px-3 py-1.5 border border-[#3B1F0A]/15 text-[#3B1F0A]/50 text-xs hover:text-[#3B1F0A] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNote(msg.id); setNoteValue(msg.note ?? ""); }}
                            className="w-full text-left bg-[#FAF6EF] border border-dashed border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A]/45 hover:border-[#C8820A]/40 hover:text-[#3B1F0A]/70 transition-all"
                          >
                            {msg.note || "+ Add internal note…"}
                          </button>
                        )}
                      </div>

                      {/* ── Reply thread ── */}
                      {msg.replies && msg.replies.length > 0 && (
                        <div>
                          <p className="text-[#3B1F0A]/40 text-[10px] font-semibold uppercase tracking-wider mb-3">
                            Conversation Thread
                            <span className="ml-2 bg-[#C8820A]/15 text-[#C8820A] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {msg.replies.length}
                            </span>
                          </p>
                          <div className="space-y-2">
                            {msg.replies.map((r, i) => {
                              const isInbound = r.type === "inbound";
                              return (
                                <div
                                  key={i}
                                  className={`border ${isInbound ? "border-blue-200 bg-blue-50/60" : "border-[#3B1F0A]/8 bg-white"}`}
                                >
                                  <div className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${isInbound ? "bg-blue-100/50 border-blue-200/70" : "bg-[#3B1F0A]/3 border-[#3B1F0A]/6"}`}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isInbound ? "bg-blue-500" : "bg-[#C8820A]"}`}>
                                        {isInbound ? (
                                          <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                                            <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        ) : (
                                          <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                            <line x1="22" y1="2" x2="11" y2="13" />
                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                          </svg>
                                        )}
                                      </div>
                                      <div>
                                        {isInbound ? (
                                          <>
                                            <span className="text-blue-700 text-xs font-semibold">{msg.name}</span>
                                            <span className="text-[#3B1F0A]/35 text-xs ml-2">← replied via email</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="text-[#3B1F0A] text-xs font-semibold">{r.agentName}</span>
                                            <span className="text-[#3B1F0A]/35 text-xs ml-2">→ {msg.email}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-[#3B1F0A]/30 text-[11px] shrink-0">
                                      {new Date(r.sentAt).toLocaleString("vi-VN", {
                                        day: "2-digit", month: "2-digit", year: "numeric",
                                        hour: "2-digit", minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <div className="px-4 py-3">
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isInbound ? "text-blue-900/70" : "text-[#3B1F0A]/60"}`}>
                                      {r.body}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {sc.next && (
                          <button
                            onClick={() => advance(msg.id, sc.next!)}
                            className="flex items-center gap-1.5 bg-[#C8820A] text-white text-xs font-semibold px-4 py-2 hover:bg-[#e09a20] transition-colors"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {sc.nextLabel}
                          </button>
                        )}
                        {msg.status !== "closed" && (
                          <button
                            onClick={() => advance(msg.id, "closed")}
                            className="flex items-center gap-1.5 border border-[#3B1F0A]/15 text-[#3B1F0A]/55 text-xs font-semibold px-4 py-2 hover:border-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-all"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => openReply(msg)}
                          className="flex items-center gap-1.5 border border-[#3B1F0A]/15 text-[#3B1F0A]/55 text-xs font-semibold px-4 py-2 hover:border-[#C8820A] hover:text-[#C8820A] transition-all"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Reply via Email
                        </button>
                        {deleteConfirm === msg.id ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-[#3B1F0A]/50">Delete this message?</span>
                            <button onClick={() => handleDelete(msg.id)} className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 transition-colors">
                              Yes, Delete
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs text-[#3B1F0A]/45 hover:text-[#3B1F0A] transition-colors">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(msg.id)}
                            className="ml-auto flex items-center gap-1.5 text-[#3B1F0A]/30 text-xs hover:text-red-500 transition-colors"
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" />
                              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reply Composer Modal ─────────────────────────────────── */}
      {reply && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1A0D00]/70 backdrop-blur-sm"
            onClick={() => reply.sendState !== "sending" && setReply(null)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-2xl bg-white flex flex-col shadow-2xl max-h-[90vh] overflow-hidden">

            {/* Modal header */}
            <div className="bg-[#3B1F0A] px-6 py-4 flex items-start justify-between shrink-0">
              <div>
                <p className="text-[#C8820A] text-[10px] font-semibold tracking-widest uppercase mb-1">
                  Compose Reply
                </p>
                <p className="text-white font-semibold text-sm">
                  To: <span className="text-white/70">{reply.msg.name}</span>
                  <span className="text-white/35 ml-2 font-normal">&lt;{reply.msg.email}&gt;</span>
                </p>
              </div>
              {reply.sendState !== "sending" && (
                <button
                  onClick={() => setReply(null)}
                  className="text-white/40 hover:text-white transition-colors mt-0.5"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>

            {reply.sendState === "success" ? (
              /* ── Success screen ── */
              <div className="flex flex-col items-center justify-center text-center py-14 px-8 flex-1">
                <div className="w-14 h-14 bg-[#2D5016]/10 flex items-center justify-center mb-5">
                  <svg width="28" height="28" fill="none" stroke="#2D5016" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-[#3B1F0A] text-xl mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>
                  Reply Sent!
                </h3>
                <p className="text-[#3B1F0A]/50 text-sm mb-1">
                  Your email was delivered to
                </p>
                <p className="text-[#C8820A] font-semibold text-sm mb-7">{reply.msg.email}</p>
                <button
                  onClick={() => setReply(null)}
                  className="bg-[#3B1F0A] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#C8820A] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              /* ── Compose form ── */
              <div className="flex flex-col overflow-y-auto flex-1">

                {/* Original message quoted */}
                <div className="bg-[#FAF6EF] border-b border-[#3B1F0A]/8 px-6 py-3">
                  <p className="text-[#3B1F0A]/35 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Original message · {reply.msg.refId}
                  </p>
                  <p className="text-[#3B1F0A]/55 text-xs leading-relaxed line-clamp-3 border-l-2 border-[#C8820A]/40 pl-3">
                    {reply.msg.message}
                  </p>
                </div>

                <div className="px-6 py-5 space-y-4 flex-1">

                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={`Re: [${reply.msg.refId}] ${reply.subject}`}
                      readOnly
                      className="w-full border border-[#3B1F0A]/10 bg-[#FAF6EF] px-4 py-2.5 text-sm text-[#3B1F0A]/60 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Agent name */}
                  <div>
                    <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                      Sent by (your name / team)
                    </label>
                    <input
                      type="text"
                      value={reply.agentName}
                      onChange={(e) => setReply((r) => r && { ...r, agentName: e.target.value })}
                      placeholder="e.g. Minh Nguyễn — Customer Support"
                      className="w-full border border-[#3B1F0A]/12 px-4 py-2.5 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-[#3B1F0A]/40 uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={10}
                      value={reply.body}
                      onChange={(e) => setReply((r) => r && { ...r, body: e.target.value })}
                      placeholder="Write your reply…"
                      className="w-full border border-[#3B1F0A]/12 px-4 py-3 text-sm text-[#3B1F0A] placeholder-[#3B1F0A]/30 focus:outline-none focus:border-[#C8820A] transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {reply.sendState === "error" && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 border border-red-100">
                      {reply.errorMsg || "Failed to send. Please try again."}
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="border-t border-[#3B1F0A]/8 px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-white">
                  <p className="text-[#3B1F0A]/35 text-xs">
                    The original message will be quoted at the bottom of the email.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setReply(null)}
                      className="text-sm text-[#3B1F0A]/45 hover:text-[#3B1F0A] px-4 py-2 border border-[#3B1F0A]/12 hover:border-[#3B1F0A]/30 transition-all"
                    >
                      Discard
                    </button>
                    <button
                      onClick={sendReply}
                      disabled={reply.sendState === "sending" || !reply.body.trim()}
                      className="flex items-center gap-2 bg-[#3B1F0A] text-white text-sm font-semibold px-5 py-2 hover:bg-[#C8820A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reply.sendState === "sending" ? (
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
                          Send Reply
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
