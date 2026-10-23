/**
 * Username normalization and internal auth identity helpers.
 * Maps unique teacher usernames to a secured internal namespace.
 */

export const INTERNAL_EMAIL_DOMAIN = "internal.albari.org";

export function normalizeUsername(username: string): string {
  if (!username) return "";
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "");
}

export function isValidUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  // Must be between 3 and 30 characters, starting with a letter or number
  const regex = /^[a-z0-9][a-z0-9_.-]{2,29}$/;
  return regex.test(normalized);
}

/**
 * Derives an internal auth email from an admin-registered username.
 * Public users cannot register using this reserved internal domain.
 */
export function usernameToInternalEmail(username: string): string {
  const clean = normalizeUsername(username);
  if (!isValidUsername(clean)) {
    throw new Error(`Invalid username: "${username}". Must be 3-30 alphanumeric characters, dots, underscores, or dashes.`);
  }
  return `${clean}@${INTERNAL_EMAIL_DOMAIN}`;
}

/**
 * Checks if an email is an internal teacher email
 */
export function isInternalEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

/**
 * Extracts username from internal email
 */
export function emailToUsername(email?: string | null): string | null {
  if (!email || !isInternalEmail(email)) return null;
  return email.split("@")[0];
}
