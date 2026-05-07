/**
 * Whitelisted email domains for Verlyn pre-registration.
 * Only these globally trusted providers are accepted.
 */
export const WHITELISTED_DOMAINS = new Set([
  'gmail.com','googlemail.com','outlook.com','outlook.in','outlook.co.uk',
  'outlook.com.au','outlook.de','outlook.fr','outlook.es','outlook.it',
  'outlook.jp','hotmail.com','hotmail.co.uk','hotmail.fr','hotmail.de',
  'hotmail.it','hotmail.es','hotmail.co.jp','live.com','live.co.uk',
  'live.in','live.fr','live.de','live.com.au','msn.com','yahoo.com',
  'yahoo.co.uk','yahoo.co.in','yahoo.ca','yahoo.com.au','yahoo.co.jp',
  'yahoo.de','yahoo.fr','yahoo.it','yahoo.es','yahoo.com.br','yahoo.com.mx',
  'ymail.com','rocketmail.com','myyahoo.com','icloud.com','me.com','mac.com',
  'aol.com','aim.com','verizon.net','zoho.com','zohomail.com','zohomail.in',
  'protonmail.com','protonmail.ch','proton.me','pm.me','tutanota.com',
  'tutanota.de','tutamail.com','tuta.io','tuta.com','keemail.me','gmx.com',
  'gmx.net','gmx.de','gmx.at','gmx.ch','web.de','mail.com','email.com',
  'fastmail.com','fastmail.fm','rediffmail.com','rediff.com','sify.com',
  'yandex.com','yandex.ru','mail.ru','inbox.ru','bk.ru','list.ru',
  'rambler.ru','lenta.ru','autorambler.ru','myrambler.ru','ro.ru','qq.com',
  '163.com','126.com','yeah.net','sina.com','sina.cn','sohu.com',
  'foxmail.com','aliyun.com','naver.com','daum.net','hanmail.net',
  'nifty.com','biglobe.ne.jp','excite.co.jp','laposte.net','orange.fr',
  'free.fr','sfr.fr','wanadoo.fr','libero.it','virgilio.it','alice.it',
  'tin.it','tiscali.it','terra.com.br','bol.com.br','uol.com.br','ig.com.br',
  'terra.es','telefonica.net','btinternet.com','sky.com','virginmedia.com',
  'talktalk.net','comcast.net','sbcglobal.net','att.net','bellsouth.net',
  'charter.net','cox.net','earthlink.net','juno.com','optonline.net',
  'rogers.com','shaw.ca','sympatico.ca','telus.net','mailfence.com',
  'disroot.org','posteo.de','posteo.net','mailbox.org','runbox.com',
  'startmail.com','hushmail.com','countermail.com','ctemplar.com','hey.com',
  'duck.com','eclipso.de','eclipso.eu','lycos.com','usa.com',
]);

/** Regex: strict RFC-5321-ish email pattern */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  sanitized?: string;
}

/**
 * Sanitizes a raw input string to prevent XSS / injection.
 * Strips HTML tags and trims whitespace.
 */
export function sanitize(raw: string): string {
  return raw
    .trim()
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/['"`;\\]/g, '')      // strip quote/injection chars
    .slice(0, 254);                // enforce max email length
}

/**
 * Validates and sanitizes an email address.
 * Returns { valid, reason, sanitized }
 */
export function validateEmail(raw: string): ValidationResult {
  const email = sanitize(raw).toLowerCase();

  if (!email) return { valid: false, reason: 'Email is required.' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, reason: 'Invalid email format.' };

  const parts = email.split('@');
  if (parts.length !== 2) return { valid: false, reason: 'Invalid email format.' };

  const domain = parts[1];
  if (!WHITELISTED_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: `Domain "@${domain}" is not on the approved provider list.`,
    };
  }

  return { valid: true, sanitized: email };
}
