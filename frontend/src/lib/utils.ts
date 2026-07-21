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
