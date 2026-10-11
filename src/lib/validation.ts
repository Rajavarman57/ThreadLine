import { z } from "zod";

/**
 * Valid Indian state and Union Territory codes per Ministry of Road Transport & Highways (MoRTH)
 */
export const INDIAN_STATE_CODES = [
  "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN",
  "GA", "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD",
  "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "OR", "PB", "PY",
  "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB",
] as const;

/**
 * Helper to get current calendar date string in Asia/Kolkata timezone (YYYY-MM-DD)
 */
export function getKolkataDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formats a raw vehicle number into standardized spaced representation (e.g. "TN 09 AB 1234" or "22 BH 1234 AA").
 * Returns null if the format does not match.
 */
export function formatVehicleNumber(val: string): string | null {
  if (!val) return null;
  const raw = val.trim().toUpperCase().replace(/[\s-]+/g, "");

  // Standard State/UT series: ^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$
  const stateRegex = new RegExp(
    `^(${INDIAN_STATE_CODES.join("|")})(\\d{1,2})([A-Z]{0,3})(\\d{4})$`
  );
  const m1 = raw.match(stateRegex);
  if (m1) {
    const [, st, rto, series, num] = m1;
    const rtoPadded = rto.padStart(2, "0");
    return series
      ? `${st} ${rtoPadded} ${series} ${num}`
      : `${st} ${rtoPadded} ${num}`;
  }

  // Bharat (BH) series: ^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$
  const bhRegex = /^(\d{2})BH(\d{4})([A-Z]{1,2})$/;
  const m2 = raw.match(bhRegex);
  if (m2) {
    const [, yr, num, series] = m2;
    return `${yr} BH ${num} ${series}`;
  }

  return null;
}

/**
 * Reusable vehicle number Zod schema:
 * - Trims, uppercases, strips spaces/hyphens
 * - Accepts valid Indian State/UT code + RTO + Series + 4 digits OR Bharat Series
 * - Transforms to spaced form (e.g. "TN 09 AB 1234")
 */
export const vehicleNo = z
  .string()
  .min(1, "Vehicle number is required")
  .transform((val) => val.trim().toUpperCase())
  .refine(
    (val) => formatVehicleNumber(val) !== null,
    { message: "Enter a vehicle number like TN 09 AB 1234" }
  )
  .transform((val) => formatVehicleNumber(val)!);

/**
 * Optional vehicle number schema for goods receipts where vehicle might not be provided
 */
export const optionalVehicleNo = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.trim().toUpperCase() : ""))
  .refine(
    (val) => !val || formatVehicleNumber(val) !== null,
    { message: "Enter a vehicle number like TN 09 AB 1234" }
  )
  .transform((val) => (val ? formatVehicleNumber(val) : null));

/**
 * Reusable person name schema:
 * - Unicode letters and marks plus spaces, dots, apostrophes, hyphens
 * - 2 to 60 characters
 * - Must start with a letter
 * - Trims and collapses multiple spaces
 * - Digits and symbols rejected
 */
export const personName = z
  .string()
  .min(1, "Name is required")
  .transform((v) => v.trim().replace(/\s+/g, " "))
  .refine(
    (v) => /^\p{L}[\p{L}\p{M}\s.'-]{1,59}$/u.test(v),
    { message: "Name can contain letters only" }
  );

export const optionalPersonName = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v.trim().replace(/\s+/g, " ") : ""))
  .refine(
    (v) => !v || /^\p{L}[\p{L}\p{M}\s.'-]{1,59}$/u.test(v),
    { message: "Name can contain letters only" }
  )
  .transform((v) => v || undefined);

/**
 * Reusable phone number schema (Indian mobile and landline with STD codes):
 * - Optional +91 or 0 prefix
 * - Standard 10-digit mobile starting 6-9, or seeded landlines
 */
export const phoneIN = z
  .string()
  .min(1, "Phone number is required")
  .transform((v) => v.trim())
  .refine(
    (v) => {
      const clean = v.replace(/[\s-]+/g, "");
      // Mobile: 10 digits starting 6-9, optionally prefixed with +91 or 0
      const isMobile = /^(?:(?:\+91|0))?[6-9]\d{9}$/.test(clean);
      // Landline support for existing enterprise contact numbers (e.g., +91 22 6152 7000)
      const isLandline = /^(?:(?:\+91|0))?\d{2,4}\d{6,8}$/.test(clean);
      return isMobile || isLandline;
    },
    { message: "Enter a valid 10-digit Indian phone number starting with 6-9" }
  );

export const optionalPhoneIN = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v.trim() : ""))
  .refine(
    (v) => {
      if (!v) return true;
      const clean = v.replace(/[\s-]+/g, "");
      const isMobile = /^(?:(?:\+91|0))?[6-9]\d{9}$/.test(clean);
      const isLandline = /^(?:(?:\+91|0))?\d{2,4}\d{6,8}$/.test(clean);
      return isMobile || isLandline;
    },
    { message: "Enter a valid 10-digit Indian phone number starting with 6-9" }
  )
  .transform((v) => v || undefined);

/**
 * Reusable email schema:
 * - Valid format, lower-cased
 */
export const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .transform((v) => v.trim().toLowerCase());

export const optionalEmailField = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v.trim().toLowerCase() : ""))
  .refine(
    (v) => !v || z.string().email().safeParse(v).success,
    { message: "Enter a valid email address" }
  )
  .transform((v) => v || undefined);

/**
 * Reusable quantity schema:
 * - Greater than 0
 * - Optional upper limit
 */
export const quantity = (max = 1_000_000) =>
  z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .max(max, `Quantity cannot exceed ${max.toLocaleString()}`);

/**
 * Reusable money schema:
 * - Greater than 0
 * - Up to 2 decimal places
 * - Optional maximum cap
 */
export const money = (max = 100_000_000) =>
  z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(max, `Amount cannot exceed ₹${max.toLocaleString()}`)
    .refine(
      (v) => Math.round(v * 100) === v * 100,
      "Amount can have at most 2 decimal places"
    );

/**
 * Date not in the future using Asia/Kolkata calendar day
 */
export const dateNotFuture = z
  .string()
  .min(1, "Date is required")
  .refine((val) => {
    const todayKolkata = getKolkataDateString();
    const inputDate = val.slice(0, 10);
    return inputDate <= todayKolkata;
  }, { message: "Date cannot be in the future" });

/**
 * Date not in the past using Asia/Kolkata calendar day
 */
export const dateNotPast = z
  .string()
  .min(1, "Date is required")
  .refine((val) => {
    const todayKolkata = getKolkataDateString();
    const inputDate = val.slice(0, 10);
    return inputDate >= todayKolkata;
  }, { message: "Date cannot be in the past" });
