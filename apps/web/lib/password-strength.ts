export type PasswordStrengthLabel = "Too short" | "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrength = {
  /** 0 = empty, 1–4 = meter segments to fill */
  level: 0 | 1 | 2 | 3 | 4;
  label: PasswordStrengthLabel | "";
};

/**
 * Client-side heuristic for signup UX (not a cryptographic strength guarantee).
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 0, label: "" };
  }

  const len = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const types = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  if (len < 6) {
    return { level: 1, label: "Too short" };
  }
  if (len < 8 || types <= 1) {
    return { level: 1, label: "Weak" };
  }
  if (len < 10 || types <= 2) {
    return { level: 2, label: "Fair" };
  }
  if (len < 12 || types <= 3) {
    return { level: 3, label: "Good" };
  }
  return { level: 4, label: "Strong" };
}
