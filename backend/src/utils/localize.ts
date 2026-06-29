const SUPPORTED_LANGS = new Set(["en", "de", "ru"]);

export function parseLang(value: unknown): string | null {
  const lang = typeof value === "string" ? value.toLowerCase() : "";
  return SUPPORTED_LANGS.has(lang) ? lang : null;
}

interface VillaLike {
  name: string;
  description: string;
  location: string;
  address: string;
  amenities: string[];
  translations: unknown;
}

export function localizeVilla<T extends VillaLike>(villa: T, lang: string | null) {
  const { translations, ...rest } = villa;
  if (!lang) return { ...rest };

  const dict = (translations as Record<string, Partial<VillaLike>> | null)?.[lang];
  if (!dict) return { ...rest };

  return {
    ...rest,
    name: dict.name ?? rest.name,
    description: dict.description ?? rest.description,
    location: dict.location ?? rest.location,
    address: dict.address ?? rest.address,
    amenities: dict.amenities ?? rest.amenities,
  };
}

interface ExtraServiceLike {
  name: string;
  description: string | null;
  translations: unknown;
}

export function localizeExtraService<T extends ExtraServiceLike>(service: T, lang: string | null) {
  const { translations, ...rest } = service;
  if (!lang) return { ...rest };

  const dict = (translations as Record<string, Partial<ExtraServiceLike>> | null)?.[lang];
  if (!dict) return { ...rest };

  return {
    ...rest,
    name: dict.name ?? rest.name,
    description: dict.description ?? rest.description,
  };
}
