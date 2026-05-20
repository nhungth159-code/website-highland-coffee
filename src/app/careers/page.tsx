"use client";

import { useState } from "react";
import Link from "next/link";
import { saveApplication } from "@/lib/applications";

// ── Data ──────────────────────────────────────────────────────
const PERKS = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Health & Wellness",
    desc: "Full medical, dental, and vision coverage for you and your dependents from day one.",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Growth & Learning",
    desc: "Structured career paths, barista certifications, and a 10,000₫/month learning stipend.",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Free Coffee",
    desc: "Unlimited drinks during your shift plus a monthly take-home bag of our single-origin beans.",
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Inclusive Culture",
    desc: "A diverse team of 5,000+ across Vietnam. We celebrate every background and story.",
  },
];

type Dept = "All" | "Store Ops" | "Corporate" | "Marketing" | "Technology";

interface Job {
  title: string;
  dept: Dept;
  type: "Full-time" | "Part-time";
  location: string;
  desc: string;
}

const JOBS: Job[] = [
  {
    title: "Barista",
    dept: "Store Ops",
    type: "Full-time",
    location: "Ho Chi Minh City · Multiple stores",
    desc: "Craft exceptional beverages, deliver warm hospitality, and be the face of Highlands in your community.",
  },
  {
    title: "Barista",
    dept: "Store Ops",
    type: "Part-time",
    location: "Hanoi · Da Nang · Ho Chi Minh City",
    desc: "Flexible shifts designed for students and part-timers who love coffee and great service.",
  },
  {
    title: "Shift Supervisor",
    dept: "Store Ops",
    type: "Full-time",
    location: "Nationwide",
    desc: "Lead a team of baristas, manage daily operations, and uphold our quality standards on every shift.",
  },
  {
    title: "Store Manager",
    dept: "Store Ops",
    type: "Full-time",
    location: "Hanoi · Ho Chi Minh City",
    desc: "Own your store's P&L, grow your team, and deliver an outstanding guest experience every day.",
  },
  {
    title: "Digital Marketing Specialist",
    dept: "Marketing",
    type: "Full-time",
    location: "Ho Chi Minh City (HQ)",
    desc: "Drive campaigns across social, search, and email that connect millions of coffee lovers to our brand.",
  },
  {
    title: "Brand & Content Creator",
    dept: "Marketing",
    type: "Full-time",
    location: "Ho Chi Minh City (HQ)",
    desc: "Tell the Highlands story through compelling visuals, copy, and video across all channels.",
  },
  {
    title: "Training & Development Specialist",
    dept: "Corporate",
    type: "Full-time",
    location: "Hanoi (HQ)",
    desc: "Design and deliver training programmes that turn new hires into Highlands brand ambassadors.",
  },
  {
    title: "Supply Chain Analyst",
    dept: "Corporate",
    type: "Full-time",
    location: "Ho Chi Minh City (HQ)",
    desc: "Optimise sourcing, logistics, and inventory across our 500+ store network.",
  },
  {
    title: "Frontend Developer",
    dept: "Technology",
    type: "Full-time",
    location: "Ho Chi Minh City · Remote",
    desc: "Build the digital experiences millions of customers use to order, track, and enjoy Highlands Coffee.",
  },
];

const DEPT_TABS: Dept[] = ["All", "Store Ops", "Corporate", "Marketing", "Technology"];

const DEPT_COLOR: Record<Dept, string> = {
  All:        "bg-[#3B1F0A]/8 text-[#3B1F0A]/60",
  "Store Ops":   "bg-amber-50 text-amber-700",
  Corporate:  "bg-blue-50 text-blue-700",
  Marketing:  "bg-purple-50 text-purple-700",
  Technology: "bg-green-50 text-green-700",
};

// ── Page ──────────────────────────────────────────────────────
const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ".pdf,.doc,.docx";

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState<Dept>("All");
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cover: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cvName, setCvName] = useState("");
  const [cvData, setCvData] = useState("");
  const [cvError, setCvError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const filtered = activeTab === "All" ? JOBS : JOBS.filter((j) => j.dept === activeTab);

  const openApply = (job: Job) => {
    setApplyJob(job);
    setForm({ name: "", email: "", phone: "", cover: "" });
    setErrors({});
    setSubmitted(false);
    setCvName("");
    setCvData("");
    setCvError("");
  };

  const handleFile = (file: File) => {
    setCvError("");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setCvError("Only PDF, DOC, or DOCX files are accepted.");
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setCvError(`File is too large (${fmtBytes(file.size)}). Maximum is 5 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCvData(reader.result as string);
      setCvName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const closeApply = () => {
    setApplyJob(null);
    setSubmitted(false);
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    saveApplication({
      id: `APP-${Math.floor(100000 + Math.random() * 900000)}`,
      jobTitle: applyJob!.title,
      dept: applyJob!.dept,
      location: applyJob!.location,
      name: form.name,
      email: form.email,
      phone: form.phone,
      cover: form.cover,
      ...(cvName && cvData ? { cvName, cvData } : {}),
      appliedAt: new Date().toISOString(),
      status: "new",
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen bg-[#FAF6EF]"
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-[#3B1F0A] px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-widest text-white"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          HIGHLANDS
        </Link>
        <Link href="/" className="text-white/50 hover:text-white text-sm transition-colors">
          ← Back to home
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-[#3B1F0A] px-6 pb-16 pt-14 text-center">
        <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-4">
          We&apos;re Hiring
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Build Your Career<br className="hidden sm:block" /> at Highlands
        </h1>
        <p className="text-white/60 text-base max-w-lg mx-auto leading-relaxed">
          Join a team that&apos;s passionate about great coffee, genuine hospitality, and growing together.
          Over 5,000 people call Highlands home.
        </p>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-12 gap-y-6">
          {[
            { value: "500+", label: "Stores nationwide" },
            { value: "5,000+", label: "Team members" },
            { value: "25 years", label: "Of Vietnamese coffee" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-3xl font-bold text-[#C8820A]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {s.value}
              </p>
              <p className="text-white/45 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">

        {/* Perks */}
        <section>
          <div className="text-center mb-10">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">Why Highlands</p>
            <h2
              className="text-3xl font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              More Than a Job
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERKS.map((p) => (
              <div key={p.title} className="bg-white border border-[#3B1F0A]/8 p-6">
                <div className="w-11 h-11 rounded-full bg-[#C8820A]/10 text-[#C8820A] flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3
                  className="font-bold text-[#3B1F0A] mb-2"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {p.title}
                </h3>
                <p className="text-sm text-[#3B1F0A]/55 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job listings */}
        <section>
          <div className="text-center mb-8">
            <p className="text-[#C8820A] text-[11px] font-semibold tracking-[0.35em] uppercase mb-3">Open Roles</p>
            <h2
              className="text-3xl font-bold text-[#3B1F0A]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Current Openings
            </h2>
          </div>

          {/* Department filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {DEPT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#3B1F0A] text-white"
                    : "bg-white border border-[#3B1F0A]/12 text-[#3B1F0A]/60 hover:text-[#3B1F0A]"
                }`}
              >
                {tab}
                {tab !== "All" && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({JOBS.filter((j) => j.dept === tab).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((job, i) => (
              <div
                key={`${job.title}-${i}`}
                className="bg-white border border-[#3B1F0A]/8 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#C8820A]/30 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3
                      className="font-bold text-[#3B1F0A] text-lg leading-tight"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {job.title}
                    </h3>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 ${DEPT_COLOR[job.dept]}`}>
                      {job.dept}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 ${
                      job.type === "Full-time"
                        ? "bg-[#3B1F0A]/6 text-[#3B1F0A]/60"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {job.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#C8820A] font-medium flex items-center gap-1.5 mb-2">
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.location}
                  </p>
                  <p className="text-sm text-[#3B1F0A]/55 leading-relaxed">{job.desc}</p>
                </div>
                <button
                  onClick={() => openApply(job)}
                  className="shrink-0 bg-[#C8820A] text-white px-6 py-2.5 text-sm font-bold tracking-wider hover:bg-[#3B1F0A] transition-colors"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#3B1F0A]/35">
              <p className="text-lg font-semibold">No openings in this department right now.</p>
              <p className="text-sm mt-1">Check back soon or view all departments.</p>
            </div>
          )}
        </section>

        {/* Catch-all CTA */}
        <section className="bg-[#3B1F0A] px-8 py-10 text-center">
          <p
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Don&apos;t see the right role?
          </p>
          <p className="text-white/55 text-sm mb-5">
            Send us your CV and we&apos;ll reach out when something matches your profile.
          </p>
          <a
            href="mailto:careers@highlandscoffee.vn"
            className="inline-flex items-center gap-2 bg-[#C8820A] text-white px-8 py-3 text-sm font-bold tracking-wider hover:bg-white hover:text-[#3B1F0A] transition-all"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" />
              <path d="M22 6l-10 7L2 6" strokeLinecap="round" />
            </svg>
            Send Open Application
          </a>
        </section>
      </div>

      {/* Apply modal */}
      {applyJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeApply} />
          <div className="relative bg-[#FAF6EF] w-full max-w-md shadow-2xl overflow-y-auto max-h-full">
            {/* Close */}
            <button
              onClick={closeApply}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#3B1F0A]/40 hover:text-[#3B1F0A] transition-colors"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            {!submitted ? (
              <>
                {/* Modal header */}
                <div className="bg-[#3B1F0A] px-6 py-5">
                  <p className="text-[#C8820A] text-[10px] font-semibold tracking-[0.3em] uppercase mb-1">
                    Apply for
                  </p>
                  <h3
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {applyJob.title}
                  </h3>
                  <p className="text-white/50 text-xs mt-0.5">{applyJob.location}</p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((er) => ({ ...er, name: "" })); }}
                      placeholder="Nguyễn Văn A"
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${errors.name ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((er) => ({ ...er, email: "" })); }}
                      placeholder="your@email.com"
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${errors.email ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value })); setErrors((er) => ({ ...er, phone: "" })); }}
                      placeholder="0901 234 567"
                      className={`w-full border px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] transition-colors ${errors.phone ? "border-red-400" : "border-[#3B1F0A]/15"}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Why Highlands?{" "}
                      <span className="text-[#3B1F0A]/35 font-normal text-xs">(optional)</span>
                    </label>
                    <textarea
                      value={form.cover}
                      onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
                      placeholder="Tell us a little about yourself and why you'd love to join the team..."
                      rows={4}
                      className="w-full border border-[#3B1F0A]/15 px-4 py-3 text-sm text-[#3B1F0A] bg-white placeholder-[#3B1F0A]/25 outline-none focus:border-[#C8820A] resize-none transition-colors"
                    />
                  </div>

                  {/* CV upload */}
                  <div>
                    <label className="block text-sm font-medium text-[#3B1F0A] mb-1.5">
                      Attach CV{" "}
                      <span className="text-[#3B1F0A]/35 font-normal text-xs">(optional)</span>
                    </label>

                    {cvName ? (
                      /* File selected */
                      <div className="flex items-center gap-3 border border-green-200 bg-green-50 px-4 py-3">
                        <svg width="18" height="18" fill="none" stroke="#16a34a" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2v6h6M9 13h6M9 17h4" strokeLinecap="round" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 truncate">{cvName}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCvName(""); setCvData(""); setCvError(""); }}
                          className="text-green-600 hover:text-red-500 transition-colors shrink-0"
                          aria-label="Remove file"
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      /* Drop zone */
                      <label
                        className={`flex flex-col items-center justify-center border-2 border-dashed px-4 py-6 cursor-pointer transition-all ${
                          dragOver
                            ? "border-[#C8820A] bg-[#C8820A]/5"
                            : "border-[#3B1F0A]/15 hover:border-[#C8820A]/40 hover:bg-[#C8820A]/3"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          const file = e.dataTransfer.files[0];
                          if (file) handleFile(file);
                        }}
                      >
                        <svg width="22" height="22" fill="none" stroke="#C8820A" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-2 opacity-70">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="text-sm text-[#3B1F0A]/60">
                          <span className="font-semibold text-[#C8820A]">Click to upload</span> or drag & drop
                        </p>
                        <p className="text-xs text-[#3B1F0A]/35 mt-1">PDF, DOC, DOCX · Max 5 MB</p>
                        <input
                          type="file"
                          accept={ACCEPTED}
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                      </label>
                    )}
                    {cvError && <p className="text-red-500 text-xs mt-1.5">{cvError}</p>}
                  </div>

                  <p className="text-xs text-[#3B1F0A]/35">
                    Our team will reach out within 3–5 business days.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C8820A] text-white py-3.5 font-bold tracking-wider text-sm hover:bg-[#3B1F0A] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success state */
              <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
                  <svg width="28" height="28" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3
                  className="text-2xl font-bold text-[#3B1F0A] mb-2"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Application Sent!
                </h3>
                <p className="text-sm text-[#3B1F0A]/55 mb-2 leading-relaxed">
                  Thanks for applying for <strong className="text-[#3B1F0A]">{applyJob.title}</strong>.
                </p>
                <p className="text-sm text-[#3B1F0A]/55 mb-8 leading-relaxed">
                  Our team will review your application and get back to you within 3–5 business days.
                </p>
                <button
                  onClick={closeApply}
                  className="bg-[#3B1F0A] text-white px-8 py-3 font-bold text-sm tracking-wider hover:bg-[#C8820A] transition-colors"
                >
                  Back to Openings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
