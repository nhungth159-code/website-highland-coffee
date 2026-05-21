export type Lang = "en" | "vi" | "th";

export const LANGUAGE_OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
  { code: "th", label: "TH" },
];

export interface FooterLink { label: string; href: string; }
export interface FooterCol  { heading: string; links: FooterLink[]; }
export interface ItemT      { name: string; desc: string; }
export interface FeaturedItemT { name: string; desc: string; tag: string; }

export interface Translations {
  nav: { menu: string; locations: string; promotions: string; orderNow: string; myOrders: string; };
  hero: { since: string; line1: string; line2: string; sub: string; ctaMenu: string; ctaStore: string; };
  featured: { eyebrow: string; heading1: string; heading2: string; viewMenu: string; items: FeaturedItemT[]; };
  story: { eyebrow: string; line1: string; line2: string; line3: string; yearsLabel: string; p1: string; p2: string; cta: string; };
  promo: { eyebrow: string; heading: string; text: string; cta: string; oneUse: string; };
  menuSec: { eyebrow: string; heading: string; Coffee: string; Tea: string; Food: string; seeAll: string; addBtn: string; };
  locations: { eyebrow: string; stores: string; text: string; cta: string; };
  footer: { tagline: string; cols: FooterCol[]; copyright: string; };
  modal: { eyebrow: string; heading: string; validity: string; instructionBefore: string; instructionBold: string; instructionAfter: string; saves: string; copy: string; copied: string; orderBtn: string; };
  menuItems: { Coffee: ItemT[]; Tea: ItemT[]; Food: ItemT[]; };
}

const TRANSLATIONS: Record<Lang, Translations> = {
  en: {
    nav: { menu: "Menu", locations: "Locations", promotions: "Promotions", orderNow: "Order Now", myOrders: "My Orders" },
    hero: {
      since: "Since 1999 · Vietnam",
      line1: "Taste the",
      line2: "Highlands",
      sub: "From the misty plateaus of Đà Lạt to your cup — every sip carries the story of Vietnam's finest highland coffee heritage.",
      ctaMenu: "Explore Menu",
      ctaStore: "Find a Store",
    },
    featured: {
      eyebrow: "Handcrafted Selections",
      heading1: "This Season's",
      heading2: "Favourites",
      viewMenu: "View full menu",
      items: [
        { name: "Vietnamese Iced Coffee", desc: "Vietnam's iconic iced coffee — rich Robusta with velvety condensed milk over hand-chipped ice.", tag: "Classic" },
        { name: "Peach & Lemongrass Iced Tea", desc: "Sun-ripened peaches, orange slices, and fragrant lemongrass in a golden iced tea.", tag: "Bestseller" },
        { name: "Highland Cold Brew", desc: "Single-origin Arabica from Cầu Đất farm, cold-steeped 18 hours for unmatched silky depth.", tag: "Premium" },
      ],
    },
    story: {
      eyebrow: "Our Story",
      line1: "Born in the",
      line2: "Mist of the",
      line3: "Highlands",
      yearsLabel: "Years of craft",
      p1: "In 1999, we opened our first store in Hà Nội with a single belief: that Vietnam's remarkable coffee deserved the world stage it had long been denied. Our beans are sourced from the volcanic red soils of Cầu Đất and Di Linh — altitudes above 1,500 metres where cool air and rich earth conspire to create extraordinary depth of flavour.",
      p2: "Today, Highlands Coffee is woven into the daily rhythm of Vietnamese life — a gathering place, a workspace, a moment of warmth in a busy city. Over 500 stores. One unbroken promise.",
      cta: "Discover our heritage",
    },
    promo: { eyebrow: "Limited Time Offer", heading: "25% Off Your Order", text: "Use code HIGHLANDS25 at checkout. Valid through 31 May 2026.", cta: "Claim Offer", oneUse: "One use per customer" },
    menuSec: { eyebrow: "What We Serve", heading: "Our Menu", Coffee: "Coffee", Tea: "Tea", Food: "Food", seeAll: "See Full Menu", addBtn: "Add +" },
    locations: {
      eyebrow: "Find Us Nationwide",
      stores: "Stores across Vietnam",
      text: "From Hà Nội to Hồ Chí Minh City, Đà Nẵng to Cần Thơ — there's always a Highlands nearby when you need a moment to breathe.",
      cta: "Find a Store Near You",
    },
    footer: {
      tagline: "Vietnam's favourite coffee experience, rooted in the highlands and served with heart since 1999.",
      cols: [
        { heading: "Menu", links: [{ label: "Coffee", href: "/menu#coffee" }, { label: "Tea & More", href: "/menu#tea" }, { label: "Food & Snacks", href: "/menu#food" }, { label: "Seasonal Specials", href: "/menu#seasonal" }] },
        { heading: "Company", links: [{ label: "About Us", href: "/about" }, { label: "Careers", href: "/careers" }, { label: "Sustainability", href: "/sustainability" }, { label: "Press", href: "/press" }] },
        { heading: "Support", links: [{ label: "Find a Store", href: "/stores" }, { label: "FAQs", href: "/faqs" }, { label: "Gift Cards", href: "/gift-cards" }, { label: "Contact Us", href: "/contact" }] },
      ],
      copyright: "© 2026 Highlands Coffee Corporation. All rights reserved.",
    },
    modal: { eyebrow: "Limited Time Offer", heading: "25% Off Your Order", validity: "Valid through 31 May 2026 · One use per customer", instructionBefore: "Copy the code below and paste it in the ", instructionBold: "Promo Code", instructionAfter: " field at checkout to get 25% off your subtotal.", saves: "Saves 25% on your order subtotal", copy: "Copy", copied: "Copied!", orderBtn: "Order Now & Apply →" },
    menuItems: {
      Coffee: [
        { name: "Vietnamese Iced Coffee", desc: "Vietnam's iconic iced coffee — rich Robusta with velvety condensed milk over hand-chipped ice." },
        { name: "Milk Coffee", desc: "Mild espresso with a generous pour of sweetened milk — light, smooth, and endlessly comforting." },
        { name: "Highlands Espresso", desc: "Double-shot espresso from single-origin Arabica grown at 1,500m in Cầu Đất, Đà Lạt." },
        { name: "Cold Brew", desc: "18-hour cold-steeped highland beans — silky, low-acid, with a naturally sweet finish." },
      ],
      Tea: [
        { name: "Peach & Lemongrass Iced Tea", desc: "Sun-ripened peaches, fresh orange slices, and fragrant lemongrass in a golden iced tea." },
        { name: "Green Milk Tea", desc: "Matcha milk tea with hand-blended Da Lat green tea and a hint of toasted rice." },
        { name: "Black Milk Tea", desc: "Black milk tea with creamy foam topping — warm, bold, and perfectly sweet." },
        { name: "Fresh Kumquat Tea", desc: "Fresh-squeezed kumquat with premium jasmine tea — bright, tangy, and refreshing." },
      ],
      Food: [
        { name: "Butter Baguette", desc: "Toasted Vietnamese baguette with cultured butter and fleur de sel — a simple morning ritual." },
        { name: "Almond Croissant", desc: "Flaky almond croissant baked fresh each morning, filled with house-made frangipane." },
        { name: "Matcha Cheesecake", desc: "Green tea cheesecake on a toasted sesame crust — soft, fragrant, and lightly bitter." },
        { name: "Coffee Tiramisu", desc: "House tiramisu soaked in Highland Cold Brew, dusted with premium Vietnamese cacao." },
      ],
    },
  },

  // ─── VIETNAMESE ───────────────────────────────────────────────────────────
  vi: {
    nav: { menu: "Menu", locations: "Địa Điểm", promotions: "Khuyến Mãi", orderNow: "Đặt Ngay", myOrders: "Đơn Hàng" },
    hero: {
      since: "Từ 1999 · Việt Nam",
      line1: "Thưởng Thức",
      line2: "Highlands",
      sub: "Từ những cao nguyên mờ sương Đà Lạt đến tách cà phê của bạn — mỗi ngụm là câu chuyện về di sản cà phê cao nguyên Việt Nam.",
      ctaMenu: "Khám Phá Menu",
      ctaStore: "Tìm Cửa Hàng",
    },
    featured: {
      eyebrow: "Thức Uống Tinh Chọn",
      heading1: "Yêu Thích",
      heading2: "Mùa Này",
      viewMenu: "Xem menu đầy đủ",
      items: [
        { name: "Cà Phê Sữa Đá", desc: "Cà phê Robusta đặc trưng của Việt Nam — đậm đà hòa quyện cùng sữa đặc thơm ngậy trên đá tự nhiên.", tag: "Truyền Thống" },
        { name: "Trà Đào Cam Sả", desc: "Đào chín mọng, cam tươi và sả thơm ngào ngạt trong ly trà đá vàng óng.", tag: "Bán Chạy" },
        { name: "Cold Brew Highlands", desc: "Hạt Arabica nguồn gốc đơn từ trang trại Cầu Đất, ngâm lạnh 18 giờ cho hương vị êm ái sâu lắng.", tag: "Cao Cấp" },
      ],
    },
    story: {
      eyebrow: "Câu Chuyện Của Chúng Tôi",
      line1: "Sinh Ra Giữa",
      line2: "Màn Sương",
      line3: "Cao Nguyên",
      yearsLabel: "Năm chắt chiu hương vị",
      p1: "Năm 1999, chúng tôi mở cửa hàng đầu tiên tại Hà Nội với một niềm tin: cà phê Việt Nam xứng đáng được thế giới biết đến. Hạt cà phê của chúng tôi được chắt lọc từ đất đỏ bazan Cầu Đất và Di Linh — những vùng đất ở độ cao trên 1.500 mét, nơi khí hậu mát mẻ và đất đai màu mỡ tạo nên chiều sâu hương vị phi thường.",
      p2: "Ngày nay, Highlands Coffee đã thấm sâu vào nhịp sống thường nhật của người Việt — nơi gặp gỡ, không gian làm việc, khoảnh khắc ấm áp giữa phố thị bận rộn. Hơn 500 cửa hàng. Một cam kết không bao giờ thay đổi.",
      cta: "Khám phá lịch sử của chúng tôi",
    },
    promo: { eyebrow: "Ưu Đãi Có Hạn", heading: "Giảm 25% Đơn Hàng", text: "Nhập mã HIGHLANDS25 khi thanh toán. Áp dụng đến 31/05/2026.", cta: "Nhận Ưu Đãi", oneUse: "Mỗi khách hàng sử dụng một lần" },
    menuSec: { eyebrow: "Thực Đơn", heading: "Menu Của Chúng Tôi", Coffee: "Cà Phê", Tea: "Trà", Food: "Đồ Ăn", seeAll: "Xem Menu Đầy Đủ", addBtn: "Thêm +" },
    locations: {
      eyebrow: "Tìm Chúng Tôi Toàn Quốc",
      stores: "Cửa Hàng Trên Cả Nước",
      text: "Từ Hà Nội đến TP. Hồ Chí Minh, từ Đà Nẵng đến Cần Thơ — luôn có một Highlands bên cạnh khi bạn cần một khoảnh khắc thư giãn.",
      cta: "Tìm Cửa Hàng Gần Bạn",
    },
    footer: {
      tagline: "Thương hiệu cà phê yêu thích của người Việt, bắt nguồn từ cao nguyên và phục vụ với tất cả tâm huyết từ năm 1999.",
      cols: [
        { heading: "Menu", links: [{ label: "Cà Phê", href: "/menu#coffee" }, { label: "Trà & Đồ Uống Khác", href: "/menu#tea" }, { label: "Đồ Ăn & Bánh", href: "/menu#food" }, { label: "Đặc Biệt Theo Mùa", href: "/menu#seasonal" }] },
        { heading: "Công Ty", links: [{ label: "Về Chúng Tôi", href: "#" }, { label: "Tuyển Dụng", href: "/careers" }, { label: "Bền Vững", href: "/sustainability" }, { label: "Báo Chí", href: "#" }] },
        { heading: "Hỗ Trợ", links: [{ label: "Tìm Cửa Hàng", href: "/stores" }, { label: "Câu Hỏi Thường Gặp", href: "/faqs" }, { label: "Thẻ Quà Tặng", href: "#" }, { label: "Liên Hệ", href: "/contact" }] },
      ],
      copyright: "© 2026 Highlands Coffee Corporation. Bảo lưu mọi quyền.",
    },
    modal: { eyebrow: "Ưu Đãi Có Hạn", heading: "Giảm 25% Đơn Hàng", validity: "Áp dụng đến 31/05/2026 · Mỗi khách một lần", instructionBefore: "Sao chép mã bên dưới và dán vào ô ", instructionBold: "Mã Khuyến Mãi", instructionAfter: " khi thanh toán để được giảm 25% tổng đơn hàng.", saves: "Tiết kiệm 25% trên tổng đơn hàng", copy: "Sao Chép", copied: "Đã Sao Chép!", orderBtn: "Đặt Hàng Ngay & Áp Dụng →" },
    menuItems: {
      Coffee: [
        { name: "Cà Phê Sữa Đá", desc: "Cà phê Robusta đặc trưng của Việt Nam — đậm đà hòa quyện cùng sữa đặc thơm ngậy trên đá tự nhiên." },
        { name: "Bạc Xỉu", desc: "Espresso nhẹ nhàng với lượng sữa đặc hào phóng — thanh nhẹ, mịn màng và vô cùng dễ chịu." },
        { name: "Espresso Highlands", desc: "Double shot espresso từ Arabica nguồn gốc đơn, trồng ở độ cao 1.500m tại Cầu Đất, Đà Lạt." },
        { name: "Cold Brew", desc: "Hạt cà phê cao nguyên ngâm lạnh 18 giờ — êm dịu, ít chua, hậu vị ngọt tự nhiên." },
      ],
      Tea: [
        { name: "Trà Đào Cam Sả", desc: "Đào chín mọng, cam tươi và sả thơm ngào ngạt trong ly trà đá vàng óng." },
        { name: "Trà Xanh Sữa", desc: "Trà sữa matcha pha từ trà xanh Đà Lạt thủ công với hương gạo rang nhẹ." },
        { name: "Hồng Trà Sữa", desc: "Hồng trà sữa với lớp kem béo ngậy phủ trên — ấm áp, đậm đà và ngọt vừa phải." },
        { name: "Trà Tắc Tươi", desc: "Tắc tươi vắt tay cùng trà nhài thượng hạng — tươi mát, chua thanh và sảng khoái." },
      ],
      Food: [
        { name: "Bánh Mì Bơ", desc: "Bánh mì nướng với bơ văn hóa và muối biển — một nghi lễ sáng giản dị." },
        { name: "Croissant Hạnh Nhân", desc: "Croissant hạnh nhân giòn rụm nướng mỗi buổi sáng, nhân kem hạnh nhân tự làm." },
        { name: "Bánh Phô Mai Matcha", desc: "Bánh phô mai trà xanh trên đế mè rang — mềm mịn, thơm ngát và vị đắng nhẹ." },
        { name: "Tiramisu Cà Phê", desc: "Tiramisu nhà tự làm ngấm Cold Brew Highlands, phủ cacao Việt Nam thượng hạng." },
      ],
    },
  },

  // ─── THAI ─────────────────────────────────────────────────────────────────
  th: {
    nav: { menu: "เมนู", locations: "สาขา", promotions: "โปรโมชั่น", orderNow: "สั่งเลย", myOrders: "คำสั่งซื้อ" },
    hero: {
      since: "ตั้งแต่ปี 1999 · เวียดนาม",
      line1: "ลิ้มรส",
      line2: "ไฮแลนด์",
      sub: "จากที่ราบสูงแสนหมอกของดาลัตสู่แก้วกาแฟของคุณ — ทุกอึกคือเรื่องราวของมรดกกาแฟบนที่สูงที่ดีที่สุดของเวียดนาม",
      ctaMenu: "ดูเมนู",
      ctaStore: "ค้นหาสาขา",
    },
    featured: {
      eyebrow: "เครื่องดื่มคัดพิเศษ",
      heading1: "ที่ชื่นชอบ",
      heading2: "ฤดูกาลนี้",
      viewMenu: "ดูเมนูทั้งหมด",
      items: [
        { name: "กาแฟเวียดนามเย็น", desc: "กาแฟโรบัสต้าเวียดนามเข้มข้น — กลมกล่อมด้วยนมข้นหวานและน้ำแข็งบดสด", tag: "คลาสสิก" },
        { name: "ชาพีชตะไคร้เย็น", desc: "พีชสุกหอม ส้มสด และตะไคร้หอมในชาเย็นสีทอง", tag: "ขายดี" },
        { name: "โคลด์บรูว์ไฮแลนด์", desc: "อาราบิก้าจากไร่เดียวที่เกิ่วดัด หมักในน้ำเย็น 18 ชั่วโมง — นุ่มลื่น ไม่เปรี้ยว หวานธรรมชาติ", tag: "พรีเมี่ยม" },
      ],
    },
    story: {
      eyebrow: "เรื่องราวของเรา",
      line1: "กำเนิดท่ามกลาง",
      line2: "หมอกแห่ง",
      line3: "ที่สูง",
      yearsLabel: "ปีแห่งงานฝีมือ",
      p1: "ในปี 1999 เราเปิดร้านแรกที่ฮานอยด้วยความเชื่อเดียว: กาแฟเวียดนามที่น่าทึ่งสมควรได้รับการยอมรับจากโลก เมล็ดกาแฟของเรามาจากดินแดงภูเขาไฟที่เกิ่วดัดและดีลิญ — ที่ระดับความสูงกว่า 1,500 เมตร ที่ซึ่งอากาศเย็นและดินอุดมสมบูรณ์สร้างความลึกของรสชาติอันพิเศษ",
      p2: "วันนี้ Highlands Coffee ได้กลายเป็นส่วนหนึ่งของจังหวะชีวิตประจำวันของชาวเวียดนาม — สถานที่พบปะ พื้นที่ทำงาน ช่วงเวลาแห่งความอบอุ่นในเมืองที่วุ่นวาย มากกว่า 500 สาขา สัญญาที่ไม่เคยสิ้นสุด",
      cta: "ค้นพบมรดกของเรา",
    },
    promo: { eyebrow: "ข้อเสนอจำกัดเวลา", heading: "ลด 25% สำหรับออเดอร์ของคุณ", text: "ใช้โค้ด HIGHLANDS25 เมื่อชำระเงิน ใช้ได้ถึง 31 พ.ค. 2569", cta: "รับข้อเสนอ", oneUse: "ใช้ได้หนึ่งครั้งต่อลูกค้า" },
    menuSec: { eyebrow: "สิ่งที่เราเสิร์ฟ", heading: "เมนูของเรา", Coffee: "กาแฟ", Tea: "ชา", Food: "อาหาร", seeAll: "ดูเมนูเต็ม", addBtn: "เพิ่ม +" },
    locations: {
      eyebrow: "ค้นหาเราทั่วประเทศ",
      stores: "สาขาทั่วเวียดนาม",
      text: "จากฮานอยถึงโฮจิมินห์ซิตี้ ดานังถึงเกิ่นเทอ — มีสาขา Highlands อยู่ใกล้ๆ เสมอเมื่อคุณต้องการพักผ่อน",
      cta: "ค้นหาสาขาใกล้คุณ",
    },
    footer: {
      tagline: "ประสบการณ์กาแฟที่คนเวียดนามชื่นชอบที่สุด หยั่งรากจากที่สูงและเสิร์ฟด้วยหัวใจตั้งแต่ปี 1999",
      cols: [
        { heading: "เมนู", links: [{ label: "กาแฟ", href: "/menu#coffee" }, { label: "ชาและเครื่องดื่ม", href: "/menu#tea" }, { label: "อาหารและของว่าง", href: "/menu#food" }, { label: "พิเศษตามฤดูกาล", href: "/menu#seasonal" }] },
        { heading: "บริษัท", links: [{ label: "เกี่ยวกับเรา", href: "#" }, { label: "ร่วมงานกับเรา", href: "/careers" }, { label: "ความยั่งยืน", href: "/sustainability" }, { label: "ข่าวสาร", href: "#" }] },
        { heading: "ช่วยเหลือ", links: [{ label: "ค้นหาสาขา", href: "/stores" }, { label: "คำถามที่พบบ่อย", href: "/faqs" }, { label: "บัตรของขวัญ", href: "#" }, { label: "ติดต่อเรา", href: "/contact" }] },
      ],
      copyright: "© 2569 Highlands Coffee Corporation สงวนลิขสิทธิ์ทุกประการ",
    },
    modal: { eyebrow: "ข้อเสนอจำกัดเวลา", heading: "ลด 25% สำหรับออเดอร์ของคุณ", validity: "ใช้ได้ถึง 31 พ.ค. 2569 · ใช้ได้หนึ่งครั้งต่อลูกค้า", instructionBefore: "คัดลอกโค้ดด้านล่างและวางในช่อง ", instructionBold: "รหัสโปรโมชั่น", instructionAfter: " เมื่อชำระเงินเพื่อรับส่วนลด 25%", saves: "ประหยัด 25% จากยอดรวมออเดอร์", copy: "คัดลอก", copied: "คัดลอกแล้ว!", orderBtn: "สั่งซื้อเลยและรับส่วนลด →" },
    menuItems: {
      Coffee: [
        { name: "กาแฟเวียดนามเย็น", desc: "กาแฟโรบัสต้าเวียดนามเข้มข้น — กลมกล่อมด้วยนมข้นหวานและน้ำแข็งบดสด" },
        { name: "กาแฟนม", desc: "เอสเพรสโซ่อ่อนกับนมข้นสวีทมิลค์ — เบา นุ่ม และชวนติดใจ" },
        { name: "เอสเพรสโซ่ไฮแลนด์", desc: "ดับเบิ้ลช็อตเอสเพรสโซ่จากอาราบิก้าแหล่งเดียว ปลูกที่ความสูง 1,500 เมตรในเวียดนาม" },
        { name: "โคลด์บรูว์", desc: "กาแฟที่ราบสูงหมักน้ำเย็น 18 ชั่วโมง — นุ่มลื่น กรดน้อย หวานธรรมชาติ" },
      ],
      Tea: [
        { name: "ชาพีชตะไคร้เย็น", desc: "พีชสุกหอม ส้มสดหั่นชิ้น และตะไคร้หอมในชาเย็นสีทอง" },
        { name: "ชาเขียวนม", desc: "ชานมมัทฉะผสมชาเขียวดาลัต มีกลิ่นข้าวคั่วอ่อนๆ" },
        { name: "ชาดำนม", desc: "ชานมดำกับโฟมครีมด้านบน — อุ่น เข้มข้น และหวานกำลังดี" },
        { name: "ชามะกรูดสด", desc: "มะกรูดคั้นสดกับชามะลิชั้นเลิศ — สดชื่น เปรี้ยวอ่อน และชื่นใจ" },
      ],
      Food: [
        { name: "บาแกตต์เนย", desc: "บาแกตต์เวียดนามอบกรอบกับเนยเกลือ — พิธีกรรมยามเช้าที่เรียบง่าย" },
        { name: "ครัวซองต์อัลมอนด์", desc: "ครัวซองต์กรอบอัลมอนด์อบใหม่ทุกเช้า ไส้ครีมฟรานจิปานทำเอง" },
        { name: "มัทฉะชีสเค้ก", desc: "ชีสเค้กชาเขียวบนฐานงาคั่ว — นุ่ม หอม และขมนิดๆ" },
        { name: "ทีรามิสุกาแฟ", desc: "ทีรามิสุชุ่มโคลด์บรูว์ไฮแลนด์ โรยโกโก้เวียดนามคุณภาพสูง" },
      ],
    },
  },
};

export const getT = (lang: Lang): Translations => TRANSLATIONS[lang];

// Price display — input is always raw VND; output is formatted in the language's currency
export const formatPrice = (lang: Lang, vnd: number): string => {
  if (lang === "en") return `$${(vnd / 24000).toFixed(2)}`;
  if (lang === "th") return `฿${Math.round(vnd / 680 / 5) * 5}`;
  return `${vnd.toLocaleString("vi-VN")}₫`; // vi default
};
