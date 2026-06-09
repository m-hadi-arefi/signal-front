import { NextRequest } from "next/server";
import type { ZodIssue } from "zod";

const messages = {
  en: {
    // Generic
    too_many_requests: "Too many requests. Please wait a moment",
    invalid_input: "Invalid input",
    unauthorized: "Unauthorized",
    not_found: "Not found",
    forbidden: "You do not have permission to do this",
    server_error: "An error occurred. Please try again",
    // Auth
    invalid_credentials: "Invalid email or password",
    email_taken: "Email is already registered",
    username_taken: "Username is already taken",
    registration_failed: "Registration failed",
    login_failed: "Login failed",
    password_incorrect: "Current password is incorrect",
    // Validation
    email_invalid: "Invalid email address",
    username_too_short: "Username must be at least 3 characters",
    username_too_long: "Username must be at most 32 characters",
    password_too_short: "Password must be at least 8 characters",
    password_no_uppercase: "Password must contain at least one uppercase letter",
    password_no_number: "Password must contain at least one number",
    current_password_required: "Current password is required",
    // Signals
    signal_not_found: "Signal not found",
    signal_create_failed: "Failed to create signal",
    signal_invalid_input: "Invalid signal data",
    // Comments
    comment_not_found: "Comment not found",
    invalid_parent_comment: "Invalid parent comment",
    // Users
    user_not_found: "User not found",
    cannot_follow_yourself: "You cannot follow yourself",
    // Upload
    no_file_provided: "No file provided",
    unsupported_image_type: "Unsupported image type. Use JPG, PNG, WebP or GIF",
    image_too_large: "Image is too large (max 5 MB)",
    upload_failed: "Upload failed. Please try again",
  },
  fa: {
    // Generic
    too_many_requests: "درخواست‌های زیاد. لطفاً کمی صبر کنید",
    invalid_input: "ورودی نامعتبر",
    unauthorized: "دسترسی ندارید",
    not_found: "پیدا نشد",
    forbidden: "شما اجازه این کار را ندارید",
    server_error: "خطایی رخ داد. لطفاً دوباره تلاش کنید",
    // Auth
    invalid_credentials: "ایمیل یا رمز عبور اشتباه است",
    email_taken: "این ایمیل قبلاً ثبت شده است",
    username_taken: "این نام‌کاربری قبلاً ثبت شده است",
    registration_failed: "ثبت‌نام ناموفق بود",
    login_failed: "ورود ناموفق بود",
    password_incorrect: "رمز عبور فعلی اشتباه است",
    // Validation
    email_invalid: "آدرس ایمیل نامعتبر است",
    username_too_short: "نام‌کاربری باید حداقل ۳ کاراکتر داشته باشد",
    username_too_long: "نام‌کاربری باید حداکثر ۳۲ کاراکتر داشته باشد",
    password_too_short: "رمز عبور باید حداقل ۸ کاراکتر داشته باشد",
    password_no_uppercase: "رمز عبور باید حاوی حداقل یک حرف بزرگ باشد",
    password_no_number: "رمز عبور باید حاوی حداقل یک عدد باشد",
    current_password_required: "رمز عبور فعلی الزامی است",
    // Signals
    signal_not_found: "سیگنال پیدا نشد",
    signal_create_failed: "ارسال سیگنال ناموفق بود",
    signal_invalid_input: "داده‌های سیگنال نامعتبر است",
    // Comments
    comment_not_found: "نظر پیدا نشد",
    invalid_parent_comment: "نظر والد نامعتبر است",
    // Users
    user_not_found: "کاربر پیدا نشد",
    cannot_follow_yourself: "نمی‌توانید خودتان را دنبال کنید",
    // Upload
    no_file_provided: "فایلی ارسال نشده است",
    unsupported_image_type: "نوع تصویر پشتیبانی نمی‌شود. از JPG، PNG، WebP یا GIF استفاده کنید",
    image_too_large: "تصویر خیلی بزرگ است (حداکثر ۵ مگابایت)",
    upload_failed: "آپلود ناموفق بود. لطفاً دوباره تلاش کنید",
  },
} as const;

type MessageKey = keyof typeof messages.en;

export function getServerLocale(req: NextRequest): "fa" | "en" {
  const lang = req.headers.get("accept-language") ?? "";
  return lang.toLowerCase().startsWith("fa") ? "fa" : "en";
}

export function getServerT(req: NextRequest) {
  const locale = getServerLocale(req);
  return (key: MessageKey): string =>
    (messages[locale] as Record<string, string>)[key] ?? messages.en[key];
}

/** Maps a Zod issue to a localized, user-safe message. Never leaks schema internals. */
export function zodIssueToMessage(
  issue: ZodIssue,
  t: ReturnType<typeof getServerT>
): string {
  const path = issue.path[0];
  const code = issue.code;

  if (path === "email") return t("email_invalid");
  if (path === "username") {
    if (code === "too_small") return t("username_too_short");
    if (code === "too_big") return t("username_too_long");
    return t("invalid_input");
  }
  if (path === "password" || path === "newPassword") {
    if (code === "too_small") return t("password_too_short");
    const msg = issue.message.toLowerCase();
    if (msg.includes("uppercase")) return t("password_no_uppercase");
    if (msg.includes("number")) return t("password_no_number");
    return t("password_too_short");
  }
  if (path === "currentPassword") return t("current_password_required");

  return t("invalid_input");
}
