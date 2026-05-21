"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Scroll-reveal ─────────────────────────────────────────────
function FadeIn({
  children, delay = 0, className = "", direction = "up",
}: {
  children: React.ReactNode; delay?: number; className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  const translate = direction === "left" ? "translateX(-32px)" : direction === "right" ? "translateX(32px)" : direction === "none" ? "none" : "translateY(28px)";
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : translate, transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Download helper ───────────────────────────────────────────
function triggerDownload(filename: string, content: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Article type ──────────────────────────────────────────────
interface Article {
  publication: string;
  category: string;
  headline: string;
  date: string;
  excerpt: string;
  byline: string;
  content: string[];
}

// ── Data ──────────────────────────────────────────────────────
const TICKER_ITEMS = [
  `Bloomberg: "Vietnam's Coffee Kings — How Highlands Built a Billion-Cup Empire"`,
  `CNN Travel: "The Best Coffee Experiences in Vietnam You Need to Try"`,
  `Forbes Asia: "Inside Vietnam's Most Beloved Coffee Chain and Its 500-Store Journey"`,
  `Financial Times: "Highlands Coffee Eyes Southeast Asia Expansion After Record Revenue"`,
  `Reuters: "How Local Vietnamese Coffee Brands Are Outpacing International Giants"`,
  `TIME Magazine: "The Vietnamese Coffee Ritual That Conquered a Nation"`,
];

const FEATURED_COVERAGE: Article = {
  publication: "Bloomberg",
  category: "Business",
  headline: "Vietnam's Coffee Kings: How Highlands Built a Billion-Cup Empire",
  date: "April 2026",
  byline: "By Sophie Nguyen · Bloomberg Business",
  excerpt: "From a single café in Hà Nội in 1999 to over 500 stores across Vietnam, Highlands Coffee has quietly become one of Southeast Asia's most formidable food-and-beverage brands — serving more than 50 million cups annually while staying fiercely, unapologetically Vietnamese.",
  content: [
    "It is 7:30 on a Tuesday morning in Hà Nội's Old Quarter, and the queue outside Highlands Coffee snakes past two doors. This is not unusual. In the twenty-six years since its founding, Highlands Coffee has made itself as essential to Vietnamese mornings as the phin drip itself — that small aluminium filter that balances atop a glass and asks you to wait, patiently, for something worth waiting for.",
    "The numbers are staggering for a brand that most Western markets have never heard of. More than 500 stores across every province of Vietnam. Annual revenue crossing VND 15 trillion for the first time in fiscal 2025. A same-store sales growth rate of 12% — in a year when global consumer spending on discretionary items contracted. When international chains spent billions trying to crack the Vietnamese market and largely retreated, Highlands Coffee quietly doubled its footprint.",
    "The secret, according to CEO Trần Việt Trung, is deceptively simple: trust the Vietnamese palate. 'We never asked ourselves how to make Vietnamese coffee appeal to the world,' he told Bloomberg in a rare interview at the company's Hồ Chí Minh City headquarters. 'We asked how to make the world's best expression of what Vietnamese coffee already is. The answer was always here, in the highlands, in the land itself.'",
    "Now, with its domestic position unassailable, Highlands Coffee is turning outward. The company has confirmed plans for its first international stores in Bangkok, Singapore, and Manila — all cities with large Vietnamese diaspora communities and growing appetite for authentic South-east Asian coffee culture. Analysts at Maybank are bullish: 'Highlands has the brand equity, the supply chain, and the unit economics to build a genuine regional powerhouse,' wrote senior analyst Lim Choon Keat in a February note. 'The question is not whether they can expand, but how fast.'",
  ],
};

const COVERAGE: Article[] = [
  {
    publication: "CNN Travel",
    category: "Lifestyle",
    headline: "The Best Coffee Experiences in Vietnam You Absolutely Must Try",
    date: "March 2026",
    byline: "By Emma Walsh · CNN Travel",
    excerpt: "For travellers arriving in Hà Nội or Hồ Chí Minh City, the hunt for the perfect cup ends at Highlands Coffee — where tradition meets a modern sensibility.",
    content: [
      "There is a moment, somewhere between your first sip of cà phê sữa đá and the second, when Vietnam stops being a destination and starts being a feeling. That moment, for many travellers, happens at a Highlands Coffee. Not because it is the most authentic café in the country — Hà Nội's curbside coffee stools will always hold that crown — but because it is where Vietnamese coffee culture, in all its complexity, is presented with enough comfort for a visitor to sit, linger, and understand.",
      "Highlands Coffee's stores are a masterclass in balancing tradition and accessibility. The menu still centres the classics: phin-brewed black coffee, cà phê trứng (egg coffee) during Tết season, and the iconic cà phê sữa đá — iced coffee with sweetened condensed milk — that has made Vietnamese coffee a global obsession. But the company has added cold brews, fruit teas, and seasonal specials that keep regulars returning and first-timers from feeling overwhelmed.",
      "For the traveller with limited time, the Highlands Coffee on Đinh Tiên Hoàng in Hà Nội — overlooking Hoan Kiem Lake — is the single best seat in the city for watching Vietnamese life unfold over coffee. Come before 8am. Order the original cà phê sữa đá. Watch the city wake up. You will understand, very quickly, why fifty million cups are served here every year.",
    ],
  },
  {
    publication: "Forbes Asia",
    category: "Business",
    headline: "Inside Vietnam's Most Beloved Coffee Chain and Its Quiet Empire",
    date: "February 2026",
    byline: "By David Park · Forbes Asia",
    excerpt: "What started as a passion project for Vietnamese coffee culture has grown into a national institution generating billions in annual revenue, with no signs of slowing.",
    content: [
      "When Highlands Coffee opened its first store in Hà Nội in 1999, Starbucks had not yet entered Asia in any meaningful way. McDonald's was still five years from opening in Vietnam. The idea that a homegrown Vietnamese coffee chain could become a billion-dollar enterprise — while the country's GDP per capita was under $400 — seemed, at best, optimistic.",
      "Twenty-six years later, it is Starbucks that is playing catch-up. Vietnam currently has approximately 90 Starbucks locations. Highlands Coffee has more than 500. The gulf is not closing. If anything, the pandemic years widened it: while international brands shuttered stores and renegotiated leases, Highlands leaned into delivery, redesigned its app, and opened 47 new locations in 2025 alone.",
      "The company's financial performance reflects a brand that has found the rare intersection of cultural authenticity and commercial acuity. Forbes Asia estimates Highlands Coffee's enterprise value at between $1.2 billion and $1.5 billion, placing it firmly among Vietnam's most valuable consumer brands. Private equity interest has been substantial, with at least three major funds understood to have approached major shareholders in the past 18 months. So far, the answer has been the same: not for sale.",
    ],
  },
  {
    publication: "Financial Times",
    category: "Markets",
    headline: "Highlands Coffee Eyes Southeast Asia After Record Revenue Year",
    date: "January 2026",
    byline: "By Minh Tran · Financial Times",
    excerpt: "Following a record-breaking fiscal year, Highlands Coffee is preparing for its first international store openings across Thailand, Singapore, and the Philippines.",
    content: [
      "Highlands Coffee, Vietnam's dominant domestic coffee chain, is preparing to take its first steps beyond Vietnamese borders after recording its strongest annual result in a 26-year history. The company confirmed to the Financial Times that it has signed leases in Bangkok's Siam Paragon district and Singapore's Orchard Road, with a Manila opening planned for the second half of the year.",
      "The expansion comes after FY2025 revenues crossed VND 15 trillion — roughly $600 million at current exchange rates — for the first time, driven by a combination of new store openings, strong same-store sales growth, and a successful push into delivery channels. EBITDA margins have expanded to approximately 18%, according to sources familiar with the company's finances, well ahead of regional peers.",
      "Industry analysts see the international expansion as well-timed. 'Vietnamese coffee has become a genuine global trend,' said Priya Mehta, consumer sector analyst at DBS. 'There is meaningful demand from Vietnamese diaspora communities in all three target markets, and there is growing curiosity from local consumers. Highlands has the brand story and the product to convert that curiosity into loyalty.' The company is understood to be targeting 15 international stores by the end of 2027.",
    ],
  },
  {
    publication: "Reuters",
    category: "Industry",
    headline: "Vietnamese Coffee Brands Are Beating the Global Giants at Their Own Game",
    date: "December 2025",
    byline: "By James Liu · Reuters",
    excerpt: "In a market crowded with international chains, Highlands Coffee has carved out an unassailable lead by doubling down on Vietnamese identity and local sourcing.",
    content: [
      "When Starbucks entered Vietnam in 2013 with its characteristic fanfare — long queues, social media frenzy, premium pricing — it was expected to reshape the country's café culture. More than a decade later, the Seattle giant has fewer than 100 stores in a country of 98 million people. Highlands Coffee, its domestic rival, has more than 500. The outcome was not inevitable. It was a strategic choice.",
      "Highlands Coffee's dominance rests on three pillars that international chains have consistently struggled to replicate: direct relationships with Vietnamese coffee farmers in Đắk Lắk and Lâm Đồng provinces, a menu rooted in Vietnamese taste preferences rather than adapted from Western formats, and a price point accessible to the Vietnamese middle class — not just the urban elite who patronise international brands.",
      "The gap is structural, not cyclical. A large iced coffee at Highlands costs approximately 45,000 VND (roughly $1.80). The equivalent at Starbucks Vietnam runs to 95,000 VND. In a country where the median monthly salary in major cities is around $600, that difference compounds over time into brand loyalty. 'The Vietnamese consumer is sophisticated and proud,' said one retail analyst in Hồ Chí Minh City. 'They want quality, and they want it to feel like theirs. Highlands gives them both.'",
    ],
  },
  {
    publication: "TIME Magazine",
    category: "Culture",
    headline: "The Vietnamese Coffee Ritual That Conquered an Entire Nation",
    date: "November 2025",
    byline: "By Lan Phuong · TIME",
    excerpt: "Phin-brewed, condensed-milk sweet, served slow — the Vietnamese coffee ritual is more than a drink. Highlands Coffee has made it a daily ceremony for millions.",
    content: [
      "In Vietnam, coffee is not a beverage. It is a posture. The act of sitting with a phin-brewed coffee — watching the dark liquid drip slowly through the filter into a glass of ice, the condensed milk swirling as you stir — is an exercise in the distinctly Vietnamese art of chờ đợi: the patience of waiting for something that will be worth it. Highlands Coffee has built a billion-dollar business on understanding this.",
      "The chain's stores are designed not merely as places to buy coffee but as stages for the ritual. Tables are positioned for lingering. The soundtrack is warm but unobtrusive. The menu is anchored by drinks that require time — the iced coffee, the egg coffee, the slow-drip black — rather than the espresso-based shots that reward impatience. Even the cup design, with its coffee-brown palettes and Playfair Display typography, communicates something about heritage and care.",
      "Culturally, the timing of Highlands Coffee's rise has been significant. The brand grew up alongside a generation of Vietnamese who came of age in the 1990s and 2000s — a generation that was simultaneously globalising and intensely proud of Vietnamese identity. For this generation, Highlands was never a consolation prize for not being able to afford Starbucks. It was the chosen brand: the one that understood them, used Vietnamese ingredients, employed Vietnamese people, and told a Vietnamese story. That loyalty has proven remarkably durable.",
    ],
  },
  {
    publication: "The Economist",
    category: "Analysis",
    headline: "A Latte Ambition: Vietnam's Coffee Industry Eyes the World",
    date: "October 2025",
    byline: "By The Economist Staff",
    excerpt: "Vietnam produces the world's second-largest coffee crop. Now its domestic champions are asking: why should the global story be told by anyone else?",
    content: [
      "Vietnam is the world's second-largest coffee producer, trailing only Brazil. It grows approximately 1.8 million tonnes of coffee annually, the majority of it Robusta — a bean prized for its intensity and caffeine content but historically dismissed by specialty-coffee culture as inferior to Arabica. For decades, Vietnamese coffee was an invisible ingredient: ground into the blends of European roasters and sold under their labels, its origins unmarked and unrewarded.",
      "That story is changing, and Highlands Coffee is one of the institutions changing it. By sourcing directly from farmers in the Central Highlands and building a brand narrative around the terroir of Vietnamese coffee — the red basalt soils of Đắk Lắk, the fog-laden elevations of Lâm Đồng — Highlands has begun the long work of making Vietnamese origin a mark of quality rather than a detail to be hidden.",
      "The commercial opportunity is substantial. Global coffee consumption is growing at roughly 3% annually, with the fastest growth in Asia and the Middle East — markets where Vietnamese coffee's bold, sweet, ice-forward style resonates naturally. Highlands Coffee's planned international expansion, beginning with Southeast Asian capitals in 2026, is the first serious attempt by a Vietnamese brand to claim a piece of that market directly. Whether it can compete with the marketing budgets and supply chains of global incumbents remains to be seen. But the product, as anyone who has queued in Hà Nội before dawn will attest, is compelling.",
    ],
  },
];

interface PressRelease {
  date: string;
  category: string;
  headline: string;
  summary: string;
  body: string[];
}

const RELEASES: PressRelease[] = [
  {
    date: "15 March 2026",
    category: "Milestone",
    headline: "Highlands Coffee Opens Its 500th Store in Vietnam",
    summary: "The landmark store opens in Đà Nẵng, completing our national footprint from Lạng Sơn to Cà Mau.",
    body: [
      "Highlands Coffee Corporation today announced the opening of its 500th store in Vietnam, located in the heart of Đà Nẵng's Han River waterfront district. The milestone marks the completion of a nationwide footprint stretching from Lạng Sơn in the north to Cà Mau at the southern tip of the country — making Highlands Coffee present in every province in Vietnam.",
      "The Đà Nẵng flagship store, designed by local architecture studio Nhà Studio, spans 320 square metres across two floors and features a rooftop terrace overlooking the Han River. The design draws on the city's identity as a bridge between north and south — an architectural metaphor for Highlands Coffee's role as a brand that has united the country over coffee for 26 years.",
      "CEO Trần Việt Trung said: 'Five hundred stores is not the destination. It is a waypoint. Every cup we serve is a reminder that Vietnamese coffee — grown here, roasted here, brewed here — deserves to be celebrated. We are nowhere near done.'",
      "For media enquiries regarding this announcement, please contact press@highlandscoffee.vn.",
    ],
  },
  {
    date: "28 February 2026",
    category: "Partnership",
    headline: "Strategic Partnership with the Vietnam Coffee Farmers Association",
    summary: "A five-year commitment to direct-trade sourcing, guaranteeing fair prices for 12,000 smallholder farmers across Đắk Lắk and Lâm Đồng.",
    body: [
      "Highlands Coffee Corporation and the Vietnam Coffee Farmers Association (VCFA) today announced a landmark five-year strategic partnership covering direct-trade sourcing from 12,000 smallholder farming families across Đắk Lắk and Lâm Đồng provinces — Vietnam's two most productive coffee-growing regions.",
      "Under the agreement, Highlands Coffee commits to purchasing a minimum of 8,000 tonnes of certified Vietnamese Robusta and Arabica coffee annually at a floor price set 15% above the international commodity benchmark, regardless of market fluctuations. The partnership also includes a VND 50 billion investment fund supporting farming infrastructure, sustainable cultivation practices, and climate resilience training.",
      "VCFA President Nguyễn Đức Hưng described the agreement as 'a turning point for the relationship between coffee growers and the brands that depend on them.' He added: 'For too long, the farmers who grow Vietnam's coffee have been invisible in the story that gets told about it. This partnership makes them central to it.'",
    ],
  },
  {
    date: "10 January 2026",
    category: "Sustainability",
    headline: "Highlands Coffee Announces 2030 Zero-Waste Packaging Roadmap",
    summary: "All single-use plastics eliminated from in-store operations by Q3 2027, with a full transition to compostable packaging by 2030.",
    body: [
      "Highlands Coffee Corporation today published its 2030 Zero-Waste Packaging Roadmap — a comprehensive plan to eliminate all single-use plastics from its operations by the third quarter of 2027 and complete the full transition to certified compostable packaging across all 500+ stores by 2030.",
      "The roadmap outlines three phases: immediate elimination of plastic straws and single-use cutlery (Q1 2026), replacement of all plastic cups and lids with certified compostable alternatives (Q2 2027), and the introduction of a nationwide cup-return and washing programme for dine-in customers (2029–2030). The company estimates the full programme will eliminate approximately 180 million pieces of single-use plastic annually.",
      "The announcement follows Highlands Coffee's 2025 sustainability audit, which found that packaging waste represented 63% of the company's total operational waste footprint. Chief Sustainability Officer Pham Thị Lan said: 'We cannot claim to care about the highlands — the land our coffee comes from — while contributing to the plastic crisis that is damaging it. This roadmap is our commitment to close that gap.'",
    ],
  },
  {
    date: "18 December 2025",
    category: "Financial",
    headline: "Record Revenue of VND 15 Trillion Reported for FY2025",
    summary: "Same-store sales growth of 12% and 47 new store openings drove the strongest full-year result in Highlands Coffee's 26-year history.",
    body: [
      "Highlands Coffee Corporation today reported full-year revenue of VND 15.2 trillion for fiscal year 2025 — a 19% increase over the prior year and the strongest annual result in the company's 26-year history. Same-store sales growth of 12% was driven by a combination of menu innovation, enhanced digital ordering capabilities, and continued growth in the company's delivery channel.",
      "The company opened 47 new stores during the fiscal year, bringing its total domestic footprint to 497 locations. EBITDA margin improved to 18.3% from 16.1% in the prior year, reflecting the benefits of scale in procurement and shared services. The company's loyalty programme, Highlands Stars, surpassed 8 million active members for the first time.",
      "Looking ahead, CEO Trần Việt Trung said the company would continue investing in its domestic network while beginning its international expansion programme in 2026. 'We enter 2026 from a position of exceptional strength,' he said. 'The fundamentals of our business — our coffee, our people, our brand — have never been stronger.'",
    ],
  },
  {
    date: "5 November 2025",
    category: "Product",
    headline: "New Cold Brew Collection Launches Nationwide",
    summary: "A curated range of slow-steeped Vietnamese cold brews — including the Highlands Signature Dark and a limited-edition Cà Phê Muối — available at all 500 stores.",
    body: [
      "Highlands Coffee today launched its first dedicated Cold Brew Collection — a range of five slow-steeped Vietnamese cold brews developed over eighteen months of product development in partnership with master roasters from the Central Highlands. The collection is available immediately at all 500 Highlands Coffee locations nationwide.",
      "The range includes the Highlands Signature Dark (a 20-hour cold-steeped Robusta blend), the Đà Lạt Arabica Light Brew (a delicate single-origin from Lâm Đồng province), and the limited-edition Cà Phê Muối — a salted cold brew inspired by the coastal coffee traditions of Huế, made with hand-harvested sea salt from Quảng Ngãi.",
      "Head of Product Innovation Vũ Thanh Hương said: 'Cold brew is not a trend for us — it is the natural evolution of the slow, patient, deeply Vietnamese way of making coffee. We have simply applied twenty-six years of knowledge about Vietnamese beans and flavour profiles to a format that the world is discovering.'",
    ],
  },
  {
    date: "22 September 2025",
    category: "Community",
    headline: "Highlands Foundation Expands Coffee Scholarship Programme",
    summary: "300 new scholarships awarded to students from coffee-growing families in the Central Highlands, bringing the total to over 1,200 beneficiaries since 2018.",
    body: [
      "The Highlands Coffee Foundation today announced the award of 300 new university and vocational scholarships to students from coffee-growing families in Đắk Lắk, Lâm Đồng, and Gia Lai provinces. The awards bring the total number of Highlands Foundation scholarship beneficiaries to over 1,200 since the programme's inception in 2018.",
      "Each scholarship covers tuition fees, a monthly living allowance, and access to a mentorship network of Highlands Coffee employees and alumni. Students are pursuing degrees and vocational qualifications across a range of disciplines including agricultural science, food technology, business administration, and hospitality management.",
      "Foundation Director Nguyễn Thị Bích Ngọc said: 'Coffee has provided livelihoods for generations of families in the Central Highlands. Our responsibility is to ensure it continues to do so for the next generation — and that those young people have the education and opportunity to shape the future of Vietnamese coffee on their own terms.'",
    ],
  },
];

interface AssetItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
  size: string;
  filename: string;
  generateContent: () => { content: string; mimeType: string };
}

const ASSETS: AssetItem[] = [
  {
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: "Logo Pack",
    desc: "SVG, PNG, and EPS formats. Light and dark variants. Minimum size and clear-space guidelines included.",
    size: "4.2 MB · SVG",
    filename: "highlands-coffee-logo.svg",
    generateContent: () => ({
      mimeType: "image/svg+xml",
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120" width="480" height="120">
  <rect width="480" height="120" fill="#1A0D00"/>
  <text x="240" y="68" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#FAF6EF" text-anchor="middle" letter-spacing="14">HIGHLANDS</text>
  <text x="240" y="94" font-family="Arial, sans-serif" font-size="13" fill="#C8820A" text-anchor="middle" letter-spacing="8">COFFEE</text>
  <line x1="80" y1="104" x2="400" y2="104" stroke="#C8820A" stroke-width="1" opacity="0.4"/>
</svg>`,
    }),
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Brand Guidelines",
    desc: "Colour palette, typography system, tone of voice, photography style, and do/don't usage examples.",
    size: "8.7 MB · TXT",
    filename: "highlands-coffee-brand-guidelines.txt",
    generateContent: () => ({
      mimeType: "text/plain",
      content: `HIGHLANDS COFFEE CORPORATION
BRAND GUIDELINES — 2026 EDITION
===============================

1. BRAND IDENTITY
-----------------
Highlands Coffee is Vietnam's leading coffee chain, founded in Hà Nội in 1999.
Our brand stands for: Vietnamese heritage, warmth, quality, and belonging.

2. COLOUR PALETTE
-----------------
Primary:
  Deep Coffee Brown  #3B1F0A — primary text, headers, backgrounds
  Warm Amber / Gold  #C8820A — accents, CTAs, highlights
  Cream / Off-White  #FAF6EF — backgrounds, light surfaces
  Dark Espresso      #1A0D00 — hero sections, dark mode

Supporting:
  Forest Green       #2D5016 — sustainability, nature contexts

3. TYPOGRAPHY
-------------
Display / Headlines: Playfair Display (Google Fonts)
  — Serif, elegant, authoritative
  — Use for all H1, H2, and pull quotes

Body / UI: DM Sans (Google Fonts)
  — Clean, modern, highly legible
  — Use for body text, labels, captions

Do not use: Arial, Helvetica, Inter, or Roboto as primary typefaces.

4. LOGO USAGE
-------------
Minimum size: 120px wide (digital), 30mm wide (print)
Clear space: Equal to the cap-height of the "H" in HIGHLANDS on all sides
Approved variants:
  — Dark background: White wordmark + amber "COFFEE" subtext
  — Light background: Dark brown wordmark + amber "COFFEE" subtext
  — Monochrome: Full black or full white

Do not: stretch, rotate, recolour, or add effects to the logo.

5. TONE OF VOICE
----------------
Highlands Coffee speaks with warmth, confidence, and pride in Vietnamese culture.
  — Warm, not saccharine
  — Confident, not boastful
  — Proud of heritage, not nostalgic
  — Accessible, not casual

Headlines should feel editorial. Body copy should feel like a knowledgeable friend.

6. PHOTOGRAPHY STYLE
--------------------
  — Natural light preferred; golden-hour warmth
  — Show coffee in its natural environment: highlands, farms, cafés
  — People should look natural, not posed
  — Colour grade: warm midtones, deep shadows, cream highlights
  — Avoid stark white backgrounds or artificial studio lighting

7. CONTACT
----------
Brand enquiries: brand@highlandscoffee.vn
Press enquiries: press@highlandscoffee.vn
Partnership:    partners@highlandscoffee.vn

© 2026 Highlands Coffee Corporation. All rights reserved.
These guidelines are for accredited media and partner use only.`,
    }),
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: "Photography Library",
    desc: "High-resolution store imagery, product photography, and lifestyle shots cleared for editorial use.",
    size: "Sample · SVG",
    filename: "highlands-coffee-photo-sample.svg",
    generateContent: () => ({
      mimeType: "image/svg+xml",
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B1F0A"/>
      <stop offset="100%" style="stop-color:#1A0D00"/>
    </linearGradient>
    <linearGradient id="steam" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" style="stop-color:#FAF6EF;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#FAF6EF;stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <!-- Coffee cup -->
  <ellipse cx="400" cy="310" rx="90" ry="18" fill="#C8820A" opacity="0.3"/>
  <path d="M320 230 Q310 310 310 330 Q310 370 400 380 Q490 370 490 330 Q490 310 480 230 Z" fill="#FAF6EF" opacity="0.9"/>
  <path d="M322 235 Q400 250 478 235" stroke="#3B1F0A" stroke-width="2" fill="none" opacity="0.3"/>
  <!-- Coffee liquid -->
  <ellipse cx="400" cy="260" rx="70" ry="14" fill="#3B1F0A" opacity="0.8"/>
  <!-- Steam -->
  <path d="M380 220 Q375 200 385 180 Q390 160 380 145" stroke="url(#steam)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M400 215 Q395 195 405 175 Q410 155 400 140" stroke="url(#steam)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M420 220 Q415 200 425 180 Q430 160 420 145" stroke="url(#steam)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Saucer -->
  <ellipse cx="400" cy="385" rx="110" ry="20" fill="#C8820A" opacity="0.4"/>
  <ellipse cx="400" cy="382" rx="108" ry="18" fill="#FAF6EF" opacity="0.15"/>
  <!-- Branding -->
  <text x="400" y="455" font-family="Georgia, serif" font-size="18" fill="#C8820A" text-anchor="middle" letter-spacing="6" opacity="0.8">HIGHLANDS COFFEE</text>
  <text x="400" y="480" font-family="Arial, sans-serif" font-size="11" fill="#FAF6EF" text-anchor="middle" letter-spacing="3" opacity="0.4">PHOTOGRAPHY LIBRARY · EDITORIAL USE</text>
</svg>`,
    }),
  },
  {
    icon: (
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: "Executive Profiles",
    desc: "Official biographies and approved headshots for CEO, CFO, and Chief Brand Officer — ready for publication.",
    size: "11.3 MB · TXT",
    filename: "highlands-coffee-executive-profiles.txt",
    generateContent: () => ({
      mimeType: "text/plain",
      content: `HIGHLANDS COFFEE CORPORATION
EXECUTIVE PROFILES — FOR MEDIA USE
====================================

TRẦN VIỆT TRUNG
Chief Executive Officer
------------------------
Trần Việt Trung has served as Chief Executive Officer of Highlands Coffee Corporation since 2015, overseeing the company's expansion from 150 stores to over 500 and its transformation into Vietnam's most valuable domestic coffee brand.

Prior to joining Highlands Coffee, Mr. Trung spent twelve years in strategic roles at Masan Group and Vinamilk, where he led market expansion programmes across Southeast Asia. He holds a Bachelor's degree in Economics from the National Economics University of Vietnam and an MBA from INSEAD.

Mr. Trung is a member of the Vietnam Business Forum advisory board and serves on the board of the Highlands Coffee Foundation. He is a frequent speaker at the World Coffee Conference and the Forbes Asia CEO Summit.

---

NGUYỄN THỊ THANH MAI
Chief Financial Officer
-----------------------
Nguyễn Thị Thanh Mai joined Highlands Coffee Corporation as Chief Financial Officer in 2019. She oversees all financial operations, investor relations, and the company's capital markets strategy.

Ms. Mai brings more than twenty years of financial leadership experience, including eight years as Deputy CFO of VinGroup and earlier roles at KPMG Vietnam and Goldman Sachs Hong Kong. She is a Chartered Financial Analyst (CFA) and holds a degree in Accounting from Hanoi University of Finance and Accounting.

Ms. Mai was named to the Forbes Vietnam Power Women list in 2023 and 2024.

---

LÊ MINH KHOA
Chief Brand Officer
--------------------
Lê Minh Khoa leads Highlands Coffee's global brand strategy, creative direction, product innovation, and customer experience. He joined the company in 2018 after a decade building brand identities for major Vietnamese and regional consumer companies.

Previously, Mr. Khoa served as Group Creative Director at BBDO Vietnam and held senior brand roles at Mekong Capital and PAN Group. His work on the Highlands Coffee rebrand in 2020 was recognised with the Effie Vietnam Award for Brand Effectiveness.

---

For high-resolution headshots, please contact press@highlandscoffee.vn.
Photo credit: All images © 2026 Highlands Coffee Corporation.
Approved for editorial use in reporting on Highlands Coffee Corporation.

© 2026 Highlands Coffee Corporation. All rights reserved.`,
    }),
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Business: "bg-amber-50 text-amber-700", Lifestyle: "bg-rose-50 text-rose-700",
  Markets: "bg-blue-50 text-blue-700", Industry: "bg-emerald-50 text-emerald-700",
  Culture: "bg-purple-50 text-purple-700", Analysis: "bg-slate-100 text-slate-600",
  Milestone: "bg-amber-50 text-amber-700", Partnership: "bg-emerald-50 text-emerald-700",
  Sustainability: "bg-green-50 text-green-700", Financial: "bg-blue-50 text-blue-700",
  Product: "bg-rose-50 text-rose-700", Community: "bg-purple-50 text-purple-700",
};

// ── Article Modal ─────────────────────────────────────────────
function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A0D00]/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>

        {/* Header */}
        <div className="bg-[#1A0D00] px-8 pt-8 pb-6 shrink-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <p className="text-[#C8820A] text-[11px] font-bold tracking-[0.3em] uppercase">{article.publication}</p>
              <span className="w-px h-3 bg-white/15" />
              <span className={`text-[10px] font-bold px-2 py-0.5 ${CATEGORY_COLORS[article.category] ?? "bg-stone-100 text-stone-600"}`}>
                {article.category}
              </span>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0 mt-0.5">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h2 className="text-white text-xl font-bold leading-snug mb-3"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            {article.headline}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-white/40 text-xs">{article.byline}</p>
            <span className="w-px h-3 bg-white/15" />
            <p className="text-white/30 text-xs">{article.date}</p>
          </div>
        </div>
        <div className="bg-[#C8820A] h-[3px] shrink-0" />

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-8 py-7">
          <p className="text-[#3B1F0A] text-sm font-semibold leading-relaxed mb-6 border-l-4 border-[#C8820A]/40 pl-4 italic">
            {article.excerpt}
          </p>
          <div className="space-y-5">
            {article.content.map((para, i) => (
              <p key={i} className="text-[#3B1F0A]/75 text-sm leading-[1.85]">{para}</p>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-[#3B1F0A]/8 flex items-center justify-between">
            <p className="text-[#3B1F0A]/30 text-xs">© {article.date} · {article.publication}</p>
            <button onClick={onClose}
              className="flex items-center gap-2 bg-[#3B1F0A] text-white text-xs font-semibold px-4 py-2 hover:bg-[#C8820A] transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Press Release Modal ───────────────────────────────────────
function ReleaseModal({ release, onClose }: { release: PressRelease; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const handleDownload = () => {
    const text = [
      "HIGHLANDS COFFEE CORPORATION — OFFICIAL PRESS RELEASE",
      "=".repeat(54),
      "",
      `Date: ${release.date}`,
      `Category: ${release.category}`,
      "",
      release.headline,
      "-".repeat(release.headline.length),
      "",
      ...release.body,
      "",
      "=".repeat(54),
      "For further information contact: press@highlandscoffee.vn",
      "© 2026 Highlands Coffee Corporation. All rights reserved.",
    ].join("\n");
    triggerDownload(`highlands-press-release-${release.date.replace(/\s/g, "-").toLowerCase()}.txt`, text);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A0D00]/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-white flex flex-col shadow-2xl overflow-hidden"
        style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }`}</style>
        <div className="bg-[#1A0D00] px-8 pt-8 pb-6 shrink-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <p className="text-white/40 text-[11px] font-bold tracking-[0.3em] uppercase">Official Statement</p>
              <span className="w-px h-3 bg-white/15" />
              <span className={`text-[10px] font-bold px-2 py-0.5 ${CATEGORY_COLORS[release.category] ?? "bg-stone-100 text-stone-600"}`}>
                {release.category}
              </span>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors shrink-0 mt-0.5">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h2 className="text-white text-xl font-bold leading-snug mb-3"
            style={{ fontFamily: "var(--font-playfair), serif" }}>
            {release.headline}
          </h2>
          <p className="text-white/30 text-xs font-mono">{release.date} · Highlands Coffee Corporation</p>
        </div>
        <div className="bg-[#C8820A] h-[3px] shrink-0" />
        <div className="overflow-y-auto flex-1 px-8 py-7">
          <p className="text-[#3B1F0A] text-sm font-semibold leading-relaxed mb-6 border-l-4 border-[#C8820A]/40 pl-4">
            {release.summary}
          </p>
          <div className="space-y-5">
            {release.body.map((para, i) => (
              <p key={i} className="text-[#3B1F0A]/75 text-sm leading-[1.85]">{para}</p>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-[#3B1F0A]/8 flex items-center justify-between gap-3">
            <p className="text-[#3B1F0A]/30 text-xs">© 2026 Highlands Coffee Corporation</p>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload}
                className="flex items-center gap-2 border border-[#3B1F0A]/15 text-[#3B1F0A]/55 text-xs font-semibold px-4 py-2 hover:border-[#C8820A] hover:text-[#C8820A] transition-all">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download
              </button>
              <button onClick={onClose}
                className="flex items-center gap-2 bg-[#3B1F0A] text-white text-xs font-semibold px-4 py-2 hover:bg-[#C8820A] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function PressPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeRelease, setActiveRelease] = useState<PressRelease | null>(null);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const downloadPressKit = () => {
    const content = [
      "HIGHLANDS COFFEE CORPORATION — FULL PRESS KIT",
      "=".repeat(50),
      "",
      "COMPANY OVERVIEW",
      "----------------",
      "Highlands Coffee is Vietnam's leading domestic coffee chain, founded in Hà Nội",
      "in 1999 and now operating over 500 stores across all 63 provinces of Vietnam.",
      "Annual revenue: VND 15 trillion (FY2025). Loyalty members: 8 million+.",
      "",
      "KEY FACTS",
      "---------",
      "Founded: 1999, Hà Nội, Vietnam",
      "Stores: 500+ nationwide",
      "Annual cups served: 50 million+",
      "Employees: 12,000+",
      "Loyalty programme: Highlands Stars (8M+ active members)",
      "",
      "RECENT PRESS RELEASES",
      "---------------------",
      ...RELEASES.map(r => `[${r.date}] ${r.headline}`),
      "",
      "EXECUTIVE CONTACTS",
      "------------------",
      "CEO: Trần Việt Trung",
      "CFO: Nguyễn Thị Thanh Mai",
      "CBO: Lê Minh Khoa",
      "",
      "PRESS CONTACT",
      "-------------",
      "Email: press@highlandscoffee.vn",
      "Phone: +84 28 3822 0123",
      "Hours: Mon–Fri, 08:00–18:00 (GMT+7)",
      "Address: 46 Lê Lai, District 1, Hồ Chí Minh City, Vietnam",
      "",
      "=".repeat(50),
      "© 2026 Highlands Coffee Corporation. For editorial use only.",
      "Full brand assets available at: highlandscoffee.vn/press",
    ].join("\n");
    triggerDownload("highlands-coffee-full-press-kit.txt", content);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif", background: "#FAF6EF" }}>

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navScrolled ? "bg-[#1A0D00]/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-white font-bold tracking-[0.22em] text-lg" style={{ fontFamily: "var(--font-playfair), serif" }}>
            HIGHLANDS
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-white/70">
            {[["Menu", "/menu"], ["Locations", "/stores"], ["Promotions", "/promotions"], ["About", "/about"]].map(([l, h]) => (
              <Link key={l} href={h} className="hover:text-white transition-colors">{l}</Link>
            ))}
            <span className="text-white font-semibold border-b border-[#C8820A] pb-px">Press</span>
          </div>
          <Link href="/contact" className="hidden md:inline-flex items-center gap-2 bg-[#C8820A] text-white text-xs font-semibold px-4 py-2 hover:bg-[#e09a20] transition-colors">
            Media Enquiry
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-[#1A0D00] pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(200,130,10,0.04) 0, rgba(200,130,10,0.04) 1px, transparent 1px, transparent 14%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(200,130,10,0.03) 0, rgba(200,130,10,0.03) 1px, transparent 1px, transparent 80px)" }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[#C8820A] text-[11px] font-bold tracking-[0.4em] uppercase mb-5">Press &amp; Media Centre</p>
            <h1 className="text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6" style={{ fontFamily: "var(--font-playfair), serif" }}>
              News from<br />the Highlands
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl">
              Official press releases, media coverage, and downloadable brand assets for journalists, broadcasters, and content creators.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#coverage" className="inline-flex items-center gap-2 bg-[#C8820A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#e09a20] transition-colors">
                Latest Coverage
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
              <a href="#assets" className="inline-flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/50 text-sm font-semibold px-6 py-3 transition-all">
                Download Media Kit
              </a>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8">
            {[{ v: "500+", l: "Stores", s: "Across Vietnam" }, { v: "26", l: "Years", s: "Since 1999" }, { v: "50M+", l: "Cups / Year", s: "And counting" }, { v: "#1", l: "Vietnamese Chain", s: "By revenue" }].map((s) => (
              <div key={s.l} className="bg-white/4 px-6 py-5">
                <p className="text-[#C8820A] text-2xl font-bold mb-0.5" style={{ fontFamily: "var(--font-playfair), serif" }}>{s.v}</p>
                <p className="text-white text-xs font-semibold uppercase tracking-wider">{s.l}</p>
                <p className="text-white/35 text-xs mt-0.5">{s.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scrolling ticker ── */}
      <div className="bg-[#C8820A] overflow-hidden py-2.5">
        <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}} .ticker-track{display:flex;width:max-content;animation:ticker 40s linear infinite} .ticker-track:hover{animation-play-state:paused}`}</style>
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="whitespace-nowrap text-white text-xs font-medium px-8">
              <span className="text-white/60 mr-2">◆</span>{item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Media Coverage ── */}
      <section id="coverage" className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn>
          <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.4em] uppercase mb-2">As Seen In</p>
          <div className="flex items-end justify-between border-b border-[#3B1F0A]/12 pb-5 mb-10">
            <h2 className="text-[#3B1F0A] text-3xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>Media Coverage</h2>
            <span className="text-[#3B1F0A]/35 text-sm hidden sm:block">{COVERAGE.length + 1} articles this season</span>
          </div>
        </FadeIn>

        {/* Featured card */}
        <FadeIn delay={80}>
          <button onClick={() => setActiveArticle(FEATURED_COVERAGE)} className="group block w-full text-left bg-[#1A0D00] mb-6 overflow-hidden hover:bg-[#3B1F0A] transition-colors duration-300">
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-white/25 text-[10px] tracking-[0.3em] uppercase font-semibold">Featured</span>
                    <span className="w-px h-3 bg-white/15" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 ${CATEGORY_COLORS[FEATURED_COVERAGE.category]}`}>{FEATURED_COVERAGE.category}</span>
                  </div>
                  <p className="text-[#C8820A] text-sm font-bold tracking-wider uppercase mb-3">{FEATURED_COVERAGE.publication}</p>
                  <h3 className="text-white text-2xl lg:text-3xl font-bold leading-snug mb-5 group-hover:text-[#FAF6EF] transition-colors" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {FEATURED_COVERAGE.headline}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">{FEATURED_COVERAGE.excerpt}</p>
                </div>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
                  <span className="text-white/30 text-xs">{FEATURED_COVERAGE.date}</span>
                  <span className="flex items-center gap-2 text-[#C8820A] text-xs font-semibold group-hover:gap-3 transition-all">
                    Read Full Story
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
              </div>
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center bg-[#C8820A]/8 border-l border-white/5">
                <div className="text-center px-8">
                  <p className="text-[#C8820A]/40 text-[70px] font-bold leading-none mb-4" style={{ fontFamily: "var(--font-playfair), serif" }}>B</p>
                  <p className="text-white/20 text-xs tracking-[0.4em] uppercase">Bloomberg</p>
                </div>
              </div>
            </div>
          </button>
        </FadeIn>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COVERAGE.map((item, i) => (
            <FadeIn key={i} delay={i * 60}>
              <button onClick={() => setActiveArticle(item)} className="group flex flex-col w-full text-left bg-white border border-[#3B1F0A]/8 hover:border-[#C8820A]/40 hover:shadow-md transition-all duration-200 h-full">
                <div className="px-5 pt-5 pb-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#3B1F0A] text-[11px] font-bold tracking-[0.25em] uppercase">{item.publication}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 ${CATEGORY_COLORS[item.category] ?? "bg-stone-100 text-stone-600"}`}>{item.category}</span>
                  </div>
                  <h3 className="text-[#3B1F0A] text-sm font-bold leading-snug mb-3 group-hover:text-[#C8820A] transition-colors" style={{ fontFamily: "var(--font-playfair), serif" }}>
                    {item.headline}
                  </h3>
                  <p className="text-[#3B1F0A]/50 text-xs leading-relaxed line-clamp-3">{item.excerpt}</p>
                </div>
                <div className="px-5 py-3 border-t border-[#3B1F0A]/6 flex items-center justify-between">
                  <span className="text-[#3B1F0A]/30 text-[11px]">{item.date}</span>
                  <span className="text-[#C8820A] text-[11px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read more
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
              </button>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Press Releases ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Direct from Highlands</p>
            <div className="flex items-end justify-between border-b border-[#3B1F0A]/10 pb-5 mb-0">
              <h2 className="text-[#3B1F0A] text-3xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>Press Releases</h2>
              <span className="text-[#3B1F0A]/35 text-sm hidden sm:block">Official statements</span>
            </div>
          </FadeIn>
          <div className="divide-y divide-[#3B1F0A]/6">
            {RELEASES.map((r, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className="group py-6 grid sm:grid-cols-[160px_1fr_auto] gap-4 items-start hover:bg-[#FAF6EF] -mx-6 px-6 transition-colors">
                  <div className="shrink-0">
                    <p className="text-[#3B1F0A]/35 text-xs font-mono">{r.date}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 ${CATEGORY_COLORS[r.category] ?? "bg-stone-100 text-stone-600"}`}>{r.category}</span>
                  </div>
                  <div className="min-w-0">
                    <button onClick={() => setActiveRelease(r)} className="text-left w-full">
                      <h3 className="text-[#3B1F0A] text-base font-bold mb-1.5 group-hover:text-[#C8820A] transition-colors leading-snug cursor-pointer" style={{ fontFamily: "var(--font-playfair), serif" }}>
                        {r.headline}
                      </h3>
                    </button>
                    <p className="text-[#3B1F0A]/50 text-sm leading-relaxed">{r.summary}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setActiveRelease(r)}
                      className="flex items-center gap-1.5 text-[#3B1F0A]/30 group-hover:text-[#C8820A] text-xs font-semibold transition-colors"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                      <span className="hidden sm:block">Read</span>
                    </button>
                    <button
                      onClick={() => {
                        const text = ["HIGHLANDS COFFEE CORPORATION — OFFICIAL PRESS RELEASE", "=".repeat(54), "", `Date: ${r.date}`, `Category: ${r.category}`, "", r.headline, "-".repeat(r.headline.length), "", ...r.body, "", "=".repeat(54), "For further information contact: press@highlandscoffee.vn", "© 2026 Highlands Coffee Corporation. All rights reserved."].join("\n");
                        triggerDownload(`highlands-press-release-${r.date.replace(/\s/g, "-").toLowerCase()}.txt`, text);
                      }}
                      className="flex items-center gap-1.5 text-[#3B1F0A]/30 group-hover:text-[#C8820A] text-xs font-semibold transition-colors"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:block">PDF</span>
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Assets ── */}
      <section id="assets" className="py-20 bg-[#FAF6EF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <FadeIn>
            <p className="text-[#C8820A] text-[10px] font-bold tracking-[0.4em] uppercase mb-2">Downloads</p>
            <div className="flex items-end justify-between border-b border-[#3B1F0A]/10 pb-5 mb-10">
              <h2 className="text-[#3B1F0A] text-3xl font-bold" style={{ fontFamily: "var(--font-playfair), serif" }}>Media Resources</h2>
              <span className="text-[#3B1F0A]/35 text-sm hidden sm:block">For editorial use only</span>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ASSETS.map((a, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className="group bg-white border border-[#3B1F0A]/8 hover:border-[#C8820A]/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="w-11 h-11 bg-[#C8820A]/10 text-[#C8820A] flex items-center justify-center mb-5">{a.icon}</div>
                    <h3 className="text-[#3B1F0A] text-base font-bold mb-2" style={{ fontFamily: "var(--font-playfair), serif" }}>{a.title}</h3>
                    <p className="text-[#3B1F0A]/50 text-xs leading-relaxed mb-4">{a.desc}</p>
                    <p className="text-[#3B1F0A]/25 text-[10px] font-mono">{a.size}</p>
                  </div>
                  <div className="border-t border-[#3B1F0A]/6 p-4">
                    <button
                      onClick={() => { const { content, mimeType } = a.generateContent(); triggerDownload(a.filename, content, mimeType); }}
                      className="w-full flex items-center justify-center gap-2 bg-[#3B1F0A] text-white text-xs font-semibold py-2.5 hover:bg-[#C8820A] transition-colors group-hover:bg-[#C8820A]">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={200}>
            <div className="mt-8 bg-[#3B1F0A] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <h3 className="text-white text-xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif" }}>Need everything at once?</h3>
                <p className="text-white/45 text-sm">Download the complete Highlands Coffee press kit — all assets in one package.</p>
              </div>
              <button
                onClick={downloadPressKit}
                className="shrink-0 flex items-center gap-2.5 bg-[#C8820A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#e09a20] transition-colors whitespace-nowrap">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Full Press Kit
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div className="bg-[#3B1F0A] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/80 font-bold tracking-[0.2em] text-sm" style={{ fontFamily: "var(--font-playfair), serif" }}>
            HIGHLANDS <span className="text-white/30 font-normal">Coffee</span>
          </p>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-white/35">
            {[["About", "/about"], ["Careers", "/careers"], ["Sustainability", "/sustainability"], ["Contact", "/contact"], ["Stores", "/stores"]].map(([l, h]) => (
              <Link key={l} href={h} className="hover:text-white/70 transition-colors">{l}</Link>
            ))}
          </div>
          <p className="text-white/20 text-xs">© 2026 Highlands Coffee Corporation</p>
        </div>
      </div>

      {/* ── Modals ── */}
      {activeArticle && <ArticleModal article={activeArticle} onClose={() => setActiveArticle(null)} />}
      {activeRelease && <ReleaseModal release={activeRelease} onClose={() => setActiveRelease(null)} />}
    </div>
  );
}
