/** Spam and scam text pattern detection for Uganda rental market. */

const SPAM_KEYWORDS = [
  // Financial scams
  'send money', 'wire transfer', 'western union', 'money gram', 'moneygram',
  'pay upfront', 'pay first', 'advance payment', 'deposit first',
  'agent fee first', 'pay before viewing', 'pay before visit',
  // Urgency manipulation
  'act fast', 'limited time', 'first come', 'going fast', 'last chance',
  'only today', 'urgent sale', 'must go',
  // Suspicious claims
  'no broker', 'no agent', 'landlord abroad', 'owner abroad', 'owner overseas',
  'send details', 'contact me privately', 'whatsapp only',
  // Generic spam
  'guaranteed', 'free money', '100% genuine', 'legit deal',
];

const SCAM_URL_PATTERN = /https?:\/\/(?!wa\.me|maps\.google|goo\.gl)[^\s]+/gi;

interface SpamResult {
  isSpam: boolean;
  score: number;   // 0–100, higher = more suspicious
  flags: string[];
}

export function analyseSpamText(text: string): SpamResult {
  if (!text || text.trim().length === 0) {
    return { isSpam: false, score: 0, flags: [] };
  }

  const lower   = text.toLowerCase();
  const flags: string[] = [];
  let score = 0;

  // 1. Excessive all-caps (more than 40% of alphabetic characters)
  const alphaChars  = text.replace(/[^a-zA-Z]/g, '');
  const capsChars   = text.replace(/[^A-Z]/g, '');
  if (alphaChars.length > 20 && capsChars.length / alphaChars.length > 0.4) {
    flags.push('excessive_caps');
    score += 15;
  }

  // 2. Excessive punctuation (more than 5 repeated !!! or ???)
  if (/[!?]{3,}/.test(text)) {
    flags.push('excessive_punctuation');
    score += 10;
  }

  // 3. URLs in description (only wa.me / maps are allowed)
  const suspiciousUrls = text.match(SCAM_URL_PATTERN);
  if (suspiciousUrls && suspiciousUrls.length > 0) {
    flags.push('suspicious_urls');
    score += 30;
  }

  // 4. Known spam keyword matches
  const matchedKeywords = SPAM_KEYWORDS.filter((kw) => lower.includes(kw));
  if (matchedKeywords.length > 0) {
    flags.push('spam_keywords');
    score += Math.min(matchedKeywords.length * 10, 40);
  }

  // 5. Very short description (< 20 chars) — low quality listing
  if (text.trim().length < 20) {
    flags.push('too_short');
    score += 5;
  }

  // 6. Repeated characters (e.g. "aaaaaaa")
  if (/(.)\1{4,}/.test(text)) {
    flags.push('repeated_chars');
    score += 10;
  }

  // 7. Phone numbers in description (indicating bypass of the platform's contact system)
  if (/(?:\+?256|0)[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}/.test(text)) {
    flags.push('phone_in_description');
    score += 8;
  }

  const finalScore = Math.min(score, 100);
  return {
    isSpam: finalScore >= 40,
    score: finalScore,
    flags,
  };
}

/** Check if a price is anomalous for Uganda rentals (UGX). */
export function isPriceAnomaly(priceUGX: number): { anomalous: boolean; reason: string | null } {
  if (priceUGX < 30_000) {
    return { anomalous: true, reason: 'price_too_low' };
  }
  if (priceUGX > 10_000_000) {
    return { anomalous: true, reason: 'price_too_high' };
  }
  return { anomalous: false, reason: null };
}
