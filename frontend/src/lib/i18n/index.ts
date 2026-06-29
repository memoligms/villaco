import type { Language } from "./languages";
import type { Translations } from "./types";
import { tr } from "./tr";
import { en } from "./en";
import { de } from "./de";
import { ru } from "./ru";

export const TRANSLATIONS: Record<Language, Translations> = { tr, en, de, ru };

export * from "./languages";
export * from "./types";
