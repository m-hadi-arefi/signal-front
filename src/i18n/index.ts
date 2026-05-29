export { en } from "./en";
export { fa } from "./fa";
export type { Translations } from "./en";

export type Locale = "en" | "fa";
export const LOCALES: Locale[] = ["en", "fa"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "sp_locale";
