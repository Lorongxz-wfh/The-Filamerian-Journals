import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatVolumeName(volNum: string | number | null | undefined): string {
  if (!volNum) return '';
  const str = String(volNum).trim();
  if (/^vol(ume)?\.?\s*/i.test(str)) {
    return str;
  }
  return `Vol. ${str}`;
}

export function truncateMiddle(str: string | null | undefined, maxLength: number = 40): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  const charsToShow = maxLength - 3;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return str.substring(0, frontChars) + '...' + str.substring(str.length - backChars);
}
