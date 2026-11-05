/** What the landing page needs to work out about the browser and the count. Pure, so it can be tested without one. */
export type Platform = 'ios' | 'android' | 'desktop';

export function platformOf(ua: string, touchPoints = 0): Platform {
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  // iPadOS Safari reports itself as a Mac; only the touch screen gives it away.
  if (/Macintosh/.test(ua) && touchPoints > 1) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/** Facebook, Messenger and Instagram open links in a built-in browser that cannot install apps. */
export function inAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram/.test(ua);
}

/** "3 sleeps until Diwali", split so the number can be the big part. */
export function countWords(n: number, name: string): { readonly big: string; readonly small: string } {
  if (n <= 0) return { big: 'Today', small: `is ${name}!` };
  return { big: String(n), small: `${n === 1 ? 'sleep' : 'sleeps'} until ${name}` };
}
