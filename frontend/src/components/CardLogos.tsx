// Visa & Mastercard kart logoları (inline SVG — dış görsel/istek gerektirmez)
export function CardLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Visa */}
      <span className="inline-flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white">
        <svg viewBox="0 0 48 16" width="34" height="12" role="img" aria-label="Visa">
          <text
            x="0"
            y="13"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="15"
            fontStyle="italic"
            fontWeight="700"
            fill="#1A1F71"
            letterSpacing="0.5"
          >
            VISA
          </text>
        </svg>
      </span>

      {/* Mastercard */}
      <span className="inline-flex h-7 w-11 items-center justify-center rounded-md border border-slate-200 bg-white">
        <svg viewBox="0 0 40 24" width="30" height="18" role="img" aria-label="Mastercard">
          <circle cx="15" cy="12" r="10" fill="#EB001B" />
          <circle cx="25" cy="12" r="10" fill="#F79E1B" />
          <path d="M20 4.6a10 10 0 0 0 0 14.8 10 10 0 0 0 0-14.8Z" fill="#FF5F00" />
        </svg>
      </span>

      {/* iyzico */}
      <span className="inline-flex h-7 items-center justify-center rounded-md border border-slate-200 bg-white px-2">
        <svg viewBox="0 0 60 16" width="48" height="13" role="img" aria-label="iyzico">
          <text
            x="0"
            y="13"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="15"
            fontWeight="700"
            fill="#1E64FF"
          >
            iyzico
          </text>
        </svg>
      </span>
    </div>
  );
}
