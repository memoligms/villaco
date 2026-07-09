import type { Language } from "./languages";
import type { Translations } from "./types";
import { tr } from "./tr";
import { en } from "./en";
import { de } from "./de";
import { ru } from "./ru";
import { ar } from "./ar";

export const TRANSLATIONS: Record<Language, Translations> = { tr, en, de, ru, ar };

export * from "./languages";
export * from "./types";
