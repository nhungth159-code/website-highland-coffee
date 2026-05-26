// Common domain typos that indicate a user made a mistake
const SUSPICIOUS_DOMAINS = new Set([
  "mgail.com", "gnail.com", "gmai.com", "gamil.com", "gmal.com", "gmial.com",
  "gmail.co", "gmail.cm", "gmail.con", "gmaill.com", "gmaiil.com",
  "yahooo.com", "yaho.com", "yahou.com", "yahoo.co", "yhaoo.com",
  "hotmai.com", "hotmial.com", "hotmall.com", "hotmail.co", "hotmail.cm",
  "outlok.com", "outloook.com", "outloo.com",
]);

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isSuspiciousDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (SUSPICIOUS_DOMAINS.has(domain)) {
    // Suggest the likely intended domain
    if (domain.includes("gmail") || domain === "mgail.com" || domain === "gnail.com" || domain === "gamil.com") {
      return `"${domain}" looks like a typo for "gmail.com"`;
    }
    if (domain.includes("yahoo")) return `"${domain}" looks like a typo for "yahoo.com"`;
    if (domain.includes("hotmail")) return `"${domain}" looks like a typo for "hotmail.com"`;
    if (domain.includes("outlook")) return `"${domain}" looks like a typo for "outlook.com"`;
    return `"${domain}" may be a mistyped email domain`;
  }
  return null;
}
