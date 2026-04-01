import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL-safe slug from a name + area combination.
 * Pattern: slugify(name + "-" + area), unique per vertical.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format Singapore dollar amounts.
 */
export function formatSGD(cents: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Parse UTM parameters from a URL search string.
 */
export function parseUtmParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  return utmKeys.reduce(
    (acc, key) => {
      const val = params.get(key);
      if (val) acc[key] = val;
      return acc;
    },
    {} as Record<string, string>
  );
}
