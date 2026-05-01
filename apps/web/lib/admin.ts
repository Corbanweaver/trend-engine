export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!configured.length) return false;
  return configured.includes(email.trim().toLowerCase());
}

