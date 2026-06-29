"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = ["/villa/villa-15.jpg", "/villa/villa-08.jpg", "/villa/villa-17.jpg"];
const INTERVAL_MS = 4000;

export function HeroSlideshow({ alt }: { alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {SLIDES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={alt}
          fill
          priority={index === 0}
          className={`object-cover transition-opacity duration-1000 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
