function getRandomInt(min: number, max: number): number {
  const range = max - min;
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}

export function generateTemporaryPassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%^&*";

  const all = upper + lower + digits + special;
  let password = "";

  // Ensure at least one of each required group
  password += upper[getRandomInt(0, upper.length)];
  password += lower[getRandomInt(0, lower.length)];
  password += digits[getRandomInt(0, digits.length)];
  password += special[getRandomInt(0, special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[getRandomInt(0, all.length)];
  }

  // Shuffle characters using Fisher-Yates
  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getRandomInt(0, i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }
  return chars.join("");
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number." };
  }
  return { valid: true };
}
