"use client";

import { useState } from "react";

function toEmbedUrl(url: string): string | null {
  // YouTube
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function VideoItem({ url }: { url: string }) {
  const embed = toEmbedUrl(url);
  if (embed) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={embed}
          title="Video"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <video
      controls
      preload="metadata"
      className="aspect-video w-full rounded-xl bg-black"
    >
      <source src={url} />
    </video>
  );
}

export function VideoGallery({ videos, title }: { videos: string[]; title: string }) {
  const [open, setOpen] = useState(false);

  if (!videos || videos.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-blue"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-lg font-bold text-brand-navy">
          🎬 {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {videos.length}
          </span>
        </span>
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {videos.map((url, i) => (
            <VideoItem key={`${url}-${i}`} url={url} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
