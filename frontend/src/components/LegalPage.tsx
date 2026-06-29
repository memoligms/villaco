import type { LegalBlock } from "@/lib/i18n/types";

export function LegalPage({ title, blocks }: { title: string; blocks: LegalBlock[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
      <div className="mt-6 space-y-4 text-slate-600">
        {blocks.map((block, i) =>
          block.type === "h2" ? (
            <h2 key={i} className="text-lg font-semibold text-brand-navy">
              {block.text}
            </h2>
          ) : (
            <p key={i}>{block.text}</p>
          )
        )}
      </div>
    </div>
  );
}
