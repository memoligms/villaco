"use client";

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
    // Gömülü oynatıcılar (YouTube/Vimeo) 16:9'dur.
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
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
  // Yüklenen videolar kendi en-boy oranında gösterilir (kenarlarda siyah bant olmaz).
  return (
    <video controls preload="metadata" className="mx-auto block max-h-[75vh] w-auto max-w-full rounded-xl">
      <source src={url} />
    </video>
  );
}

export function VideoGallery({ videos, title }: { videos: string[]; title: string }) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="flex items-center gap-2 text-lg font-bold text-brand-navy">🎬 {title}</h3>
      <div className="mt-3 space-y-5">
        {videos.map((url, i) => (
          <VideoItem key={`${url}-${i}`} url={url} />
        ))}
      </div>
    </div>
  );
}
