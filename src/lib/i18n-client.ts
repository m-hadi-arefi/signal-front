/**
 * Client-side i18n helper for Zod validation errors.
 * Maps a ZodIssue to a localised user-safe message using the t() function
 * from useLanguage. Never leaks raw Zod schema internals to the UI.
 */
import type { ZodIssue } from "zod";

type TFn = (key: string) => string;

export function zodIssueToClientMessage(issue: ZodIssue, t: TFn): string {
  const path = issue.path[0];
  const code = issue.code;
  const msg = ("message" in issue ? (issue.message as string) : "").toLowerCase();

  if (path === "email") return t("validation.email_invalid");

  if (path === "username") {
    if (code === "too_small") return t("validation.username_too_short");
    if (code === "too_big") return t("validation.username_too_long");
    return t("validation.field_required");
  }

  if (path === "password" || path === "newPassword") {
    if (code === "too_small") return t("validation.password_too_short");
    if (msg.includes("uppercase")) return t("validation.password_no_uppercase");
    if (msg.includes("number")) return t("validation.password_no_number");
    return t("validation.password_too_short");
  }

  if (path === "currentPassword") return t("validation.current_password_required");

  return t("validation.field_required");
}
