"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function VideoGallery({ videos }: { videos: string[] }) {
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = () => setOpenIndex(null);
  const prev = () => setOpenIndex((i) => (i === null ? i : (i - 1 + videos.length) % videos.length));
  const next = () => setOpenIndex((i) => (i === null ? i : (i + 1) % videos.length));

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex]);

  if (!videos || videos.length === 0) return null;

  const active = openIndex !== null ? videos[openIndex] : null;
  const activeEmbed = active ? toEmbedUrl(active) : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {videos.map((url, index) => {
          const embed = toEmbedUrl(url);
          return (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900"
            >
              {embed ? (
                <iframe
                  src={embed}
                  title={`Video ${index + 1}`}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  tabIndex={-1}
                />
              ) : (
                <video
                  src={url}
                  preload="metadata"
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              )}
              {/* Oynat ikonu overlay */}
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-brand-navy shadow-lg">
                  ▶
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label={t.common.close}
          >
            ✕
          </button>

          {videos.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-6"
              aria-label={t.common.previous}
            >
              ‹
            </button>
          ) : null}

          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {activeEmbed ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <iframe
                  src={activeEmbed}
                  title="Video"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <video controls autoPlay preload="metadata" className="mx-auto block max-h-[80vh] w-auto max-w-full rounded-xl">
                <source src={active} />
              </video>
            )}
          </div>

          {videos.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-6"
              aria-label={t.common.next}
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
