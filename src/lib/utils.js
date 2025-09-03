import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Generate secure random token (used for reset password, email verification, etc.)
export function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex string
}
