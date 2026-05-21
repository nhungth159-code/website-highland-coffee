"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { MapStore } from "@/components/StoreMap";

const StoreMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

interface Store extends MapStore {
  district: string;
  tags: string[];
}

const STORES: Store[] = [
  // ── Hà Nội ──────────────────────────────────────────────────
  {
    id: "hn-01", name: "Highlands Hoàn Kiếm",
    address: "30 Lý Thái Tổ, Hoàn Kiếm", city: "Hà Nội", district: "Hoàn Kiếm",
    phone: "024 3825 6789", hours: "06:30 – 22:30",
    tags: ["Drive-thru", "WiFi", "Parking"], lat: 21.0285, lng: 105.8542,
  },
  {
    id: "hn-02", name: "Highlands Vincom Bà Triệu",
    address: "191 Bà Triệu, Hai Bà Trưng", city: "Hà Nội", district: "Hai Bà Trưng",
    phone: "024 3974 5566", hours: "07:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 21.0155, lng: 105.8490,
  },
  {
    id: "hn-03", name: "Highlands Cầu Giấy",
    address: "109 Trần Duy Hưng, Cầu Giấy", city: "Hà Nội", district: "Cầu Giấy",
    phone: "024 3556 8800", hours: "06:30 – 23:00",
    tags: ["24h", "WiFi", "Parking"], lat: 21.0070, lng: 105.7990,
  },
  {
    id: "hn-04", name: "Highlands Nguyễn Chí Thanh",
    address: "7 Nguyễn Chí Thanh, Đống Đa", city: "Hà Nội", district: "Đống Đa",
    phone: "024 3772 4411", hours: "07:00 – 22:00",
    tags: ["WiFi"], lat: 21.0295, lng: 105.8330,
  },
  {
    id: "hn-05", name: "Highlands Times City",
    address: "458 Minh Khai, Hai Bà Trưng", city: "Hà Nội", district: "Hai Bà Trưng",
    phone: "024 3626 9988", hours: "07:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 20.9968, lng: 105.8608,
  },
  {
    id: "hn-06", name: "Highlands Long Biên",
    address: "1 Phúc Lợi, Long Biên", city: "Hà Nội", district: "Long Biên",
    phone: "024 3872 3344", hours: "06:30 – 22:30",
    tags: ["Drive-thru", "WiFi", "Parking"], lat: 21.0480, lng: 105.8930,
  },

  // ── TP. Hồ Chí Minh ─────────────────────────────────────────
  {
    id: "hcm-01", name: "Highlands Nguyễn Huệ",
    address: "45 Nguyễn Huệ, Quận 1", city: "TP. Hồ Chí Minh", district: "Quận 1",
    phone: "028 3821 5566", hours: "06:00 – 23:30",
    tags: ["WiFi", "Outdoor Seating"], lat: 10.7769, lng: 106.7030,
  },
  {
    id: "hcm-02", name: "Highlands Vincom Đồng Khởi",
    address: "72 Lê Thánh Tôn, Quận 1", city: "TP. Hồ Chí Minh", district: "Quận 1",
    phone: "028 3829 4477", hours: "07:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 10.7750, lng: 106.7025,
  },
  {
    id: "hcm-03", name: "Highlands Gò Vấp",
    address: "202 Quang Trung, Gò Vấp", city: "TP. Hồ Chí Minh", district: "Gò Vấp",
    phone: "028 3894 5533", hours: "06:30 – 23:00",
    tags: ["Drive-thru", "WiFi", "Parking"], lat: 10.8380, lng: 106.6650,
  },
  {
    id: "hcm-04", name: "Highlands Thủ Đức",
    address: "39 Võ Văn Ngân, Thủ Đức", city: "TP. Hồ Chí Minh", district: "Thủ Đức",
    phone: "028 3722 6611", hours: "06:30 – 22:30",
    tags: ["WiFi", "Parking"], lat: 10.8530, lng: 106.7720,
  },
  {
    id: "hcm-05", name: "Highlands Aeon Mall Bình Tân",
    address: "1 Cô Giang, Bình Tân", city: "TP. Hồ Chí Minh", district: "Bình Tân",
    phone: "028 3620 7799", hours: "08:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 10.7530, lng: 106.6140,
  },
  {
    id: "hcm-06", name: "Highlands Nguyễn Văn Linh",
    address: "600 Nguyễn Văn Linh, Quận 7", city: "TP. Hồ Chí Minh", district: "Quận 7",
    phone: "028 3775 8822", hours: "06:30 – 23:00",
    tags: ["Drive-thru", "WiFi", "Parking"], lat: 10.7345, lng: 106.7060,
  },
  {
    id: "hcm-07", name: "Highlands Bình Thạnh",
    address: "88 Đinh Bộ Lĩnh, Bình Thạnh", city: "TP. Hồ Chí Minh", district: "Bình Thạnh",
    phone: "028 3898 4400", hours: "06:30 – 22:30",
    tags: ["WiFi"], lat: 10.8030, lng: 106.7120,
  },

  // ── Đà Nẵng ─────────────────────────────────────────────────
  {
    id: "dn-01", name: "Highlands Bạch Đằng",
    address: "100 Bạch Đằng, Hải Châu", city: "Đà Nẵng", district: "Hải Châu",
    phone: "0236 3821 5566", hours: "06:30 – 23:00",
    tags: ["River View", "WiFi", "Outdoor Seating"], lat: 16.0680, lng: 108.2240,
  },
  {
    id: "dn-02", name: "Highlands Vincom Đà Nẵng",
    address: "910A Ngô Quyền, Sơn Trà", city: "Đà Nẵng", district: "Sơn Trà",
    phone: "0236 3612 9988", hours: "07:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 16.0600, lng: 108.2360,
  },
  {
    id: "dn-03", name: "Highlands Nguyễn Văn Linh",
    address: "46 Nguyễn Văn Linh, Thanh Khê", city: "Đà Nẵng", district: "Thanh Khê",
    phone: "0236 3568 7711", hours: "07:00 – 22:30",
    tags: ["WiFi", "Parking"], lat: 16.0720, lng: 108.2100,
  },
  {
    id: "dn-04", name: "Highlands Hòa Vang",
    address: "17 Trần Phú, Hòa Vang", city: "Đà Nẵng", district: "Hòa Vang",
    phone: "0236 3877 6655", hours: "06:30 – 22:00",
    tags: ["Drive-thru", "Parking"], lat: 16.0540, lng: 108.1980,
  },

  // ── Cần Thơ ─────────────────────────────────────────────────
  {
    id: "ct-01", name: "Highlands Ninh Kiều",
    address: "12 Trần Phú, Ninh Kiều", city: "Cần Thơ", district: "Ninh Kiều",
    phone: "0292 3821 4400", hours: "06:30 – 22:30",
    tags: ["Waterfront", "WiFi"], lat: 10.0342, lng: 105.7898,
  },
  {
    id: "ct-02", name: "Highlands Vincom Cần Thơ",
    address: "209 Trần Văn Hoài, Ninh Kiều", city: "Cần Thơ", district: "Ninh Kiều",
    phone: "0292 3612 5533", hours: "07:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 10.0370, lng: 105.7870,
  },
  {
    id: "ct-03", name: "Highlands Bình Thủy",
    address: "55 Cách Mạng Tháng Tám, Bình Thủy", city: "Cần Thơ", district: "Bình Thủy",
    phone: "0292 3877 2211", hours: "07:00 – 22:00",
    tags: ["WiFi", "Parking"], lat: 10.0600, lng: 105.7780,
  },

  // ── Hải Phòng ────────────────────────────────────────────────
  {
    id: "hp-01", name: "Highlands Lê Hồng Phong",
    address: "98 Lê Hồng Phong, Hồng Bàng", city: "Hải Phòng", district: "Hồng Bàng",
    phone: "0225 3821 7788", hours: "06:30 – 22:30",
    tags: ["WiFi"], lat: 20.8650, lng: 106.6830,
  },
  {
    id: "hp-02", name: "Highlands Aeon Mall Hải Phòng",
    address: "10 Võ Nguyên Giáp, Lê Chân", city: "Hải Phòng", district: "Lê Chân",
    phone: "0225 3612 9977", hours: "08:00 – 22:00",
    tags: ["In-Mall", "WiFi"], lat: 20.8520, lng: 106.7020,
  },
  {
    id: "hp-03", name: "Highlands Ngô Quyền",
    address: "32 Lê Lai, Ngô Quyền", city: "Hải Phòng", district: "Ngô Quyền",
    phone: "0225 3568 4422", hours: "07:00 – 22:00",
    tags: ["WiFi", "Parking"], lat: 20.8590, lng: 106.6960,
  },

  // ── Nha Trang ────────────────────────────────────────────────
  {
    id: "nt-01", name: "Highlands Trần Phú",
    address: "72 Trần Phú, Lộc Thọ", city: "Nha Trang", district: "Lộc Thọ",
    phone: "0258 3821 5566", hours: "06:30 – 23:00",
    tags: ["Ocean View", "WiFi", "Outdoor Seating"], lat: 12.2466, lng: 109.1943,
  },
  {
    id: "nt-02", name: "Highlands Vinpearl Plaza",
    address: "44 Nguyễn Thiện Thuật, Phước Hòa", city: "Nha Trang", district: "Phước Hòa",
    phone: "0258 3612 8833", hours: "07:00 – 22:30",
    tags: ["WiFi"], lat: 12.2510, lng: 109.1890,
  },
  {
    id: "nt-03", name: "Highlands Nguyễn Văn Trỗi",
    address: "86 Nguyễn Văn Trỗi, Tân Lập", city: "Nha Trang", district: "Tân Lập",
    phone: "0258 3877 1100", hours: "07:00 – 22:00",
    tags: ["Drive-thru", "Parking"], lat: 12.2380, lng: 109.1870,
  },
];

const CITIES = ["All", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Nha Trang"];

const TAG_COLORS: Record<string, string> = {
  "Drive-thru": "bg-amber-50 text-amber-700",
  "In-Mall": "bg-stone-100 text-stone-600",
  "WiFi": "bg-emerald-50 text-emerald-700",
  "Parking": "bg-sky-50 text-sky-700",
  "24h": "bg-purple-50 text-purple-700",
  "Outdoor Seating": "bg-lime-50 text-lime-700",
  "Ocean View": "bg-cyan-50 text-cyan-700",
  "River View": "bg-teal-50 text-teal-700",
  "Waterfront": "bg-teal-50 text-teal-700",
};

export default function StoresPage() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = STORES;
    if (selectedCity !== "All") list = list.filter((s) => s.city === selectedCity);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCity, search]);

  const mapStores: MapStore[] = filtered.map(({ id, name, address, city, phone, hours, lat, lng }) => ({
    id, name, address, city, phone, hours, lat, lng,
  }));

  const handleSelect = (id: string) => {
    setActiveId(id);
    document.getElementById(`store-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <div className="h-screen bg-[#FAF6EF] flex flex-col overflow-hidden">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-[#3B1F0A] shadow-lg shrink-0">
        <div className="max-w-full px-6 lg:px-8 h-16 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 mr-auto">
            <span
              className="text-white font-bold tracking-[0.25em] text-lg"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              HIGHLANDS
            </span>
            <span className="text-white/35 text-[11px] tracking-[0.2em] uppercase">Coffee</span>
          </Link>
          <Link href="/" className="text-white/60 hover:text-white text-sm font-medium transition-colors hidden sm:block">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* ── Search + Filter bar ── */}
      <div className="bg-[#3B1F0A] px-6 lg:px-8 pt-8 pb-5 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="shrink-0">
            <p className="text-[#C8820A] text-[10px] font-semibold tracking-[0.35em] uppercase mb-1">
              Store Locator
            </p>
            <h1
              className="text-white font-bold text-2xl leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Find Your Highlands
            </h1>
          </div>
          <div className="sm:ml-auto relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search name, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/15 text-white placeholder-white/35 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C8820A] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── City Tabs ── */}
      <div className="bg-[#1A0D00] px-6 lg:px-8 shrink-0 border-b border-white/5">
        <div className="overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {CITIES.map((city) => {
              const count = city === "All" ? STORES.length : STORES.filter((s) => s.city === city).length;
              return (
                <button
                  key={city}
                  onClick={() => { setSelectedCity(city); setActiveId(null); }}
                  className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150 ${
                    selectedCity === city
                      ? "border-[#C8820A] text-[#C8820A]"
                      : "border-transparent text-white/40 hover:text-white/70"
                  }`}
                >
                  {city}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    selectedCity === city ? "bg-[#C8820A]/20 text-[#C8820A]" : "bg-white/8 text-white/30"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Split layout: List | Map ── */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">

        {/* List panel */}
        <div className="lg:w-[420px] shrink-0 overflow-y-auto bg-[#FAF6EF]">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="text-4xl mb-3">☕</div>
              <p className="text-[#3B1F0A]/50 text-sm">No stores found.</p>
              <button onClick={() => { setSearch(""); setSelectedCity("All"); }} className="mt-3 text-[#C8820A] text-sm underline underline-offset-4">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#3B1F0A]/6">
              {filtered.map((store) => (
                <button
                  key={store.id}
                  id={`store-${store.id}`}
                  onClick={() => setActiveId(store.id === activeId ? null : store.id)}
                  className={`w-full text-left px-5 py-4 transition-all duration-150 group ${
                    activeId === store.id
                      ? "bg-[#3B1F0A] text-white"
                      : "hover:bg-[#3B1F0A]/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                      className={`font-semibold text-[14px] leading-snug ${activeId === store.id ? "text-white" : "text-[#3B1F0A]"}`}
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      {store.name}
                    </h3>
                    <svg
                      className={`shrink-0 mt-0.5 transition-colors ${activeId === store.id ? "text-[#C8820A]" : "text-[#C8820A]/60"}`}
                      width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    >
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  <p className={`text-xs mb-1 ${activeId === store.id ? "text-white/70" : "text-[#3B1F0A]/55"}`}>
                    {store.address}
                  </p>
                  <div className={`flex items-center gap-3 text-xs mb-3 ${activeId === store.id ? "text-white/60" : "text-[#3B1F0A]/45"}`}>
                    <span>{store.hours}</span>
                    <span>·</span>
                    <a
                      href={`tel:${store.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`hover:underline ${activeId === store.id ? "text-[#C8820A]" : "text-[#C8820A]/80"}`}
                    >
                      {store.phone}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {store.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-sm ${
                          activeId === store.id
                            ? "bg-white/15 text-white/80"
                            : TAG_COLORS[tag] ?? "bg-[#3B1F0A]/8 text-[#3B1F0A]/60"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map panel */}
        <div className="flex-1 relative">
          <StoreMap
            stores={mapStores}
            activeId={activeId}
            onSelect={handleSelect}
          />
          {/* count badge */}
          <div className="absolute top-3 right-3 z-[1000] bg-[#3B1F0A]/90 text-white text-xs px-3 py-1.5 font-medium">
            {filtered.length} store{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
