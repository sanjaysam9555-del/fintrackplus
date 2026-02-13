import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  screens: { src: string; alt: string; fit?: "cover" | "contain" }[];
  autoPlayMs?: number;
  className?: string;
}

export const PhoneMockup = ({ screens, autoPlayMs = 3000, className }: PhoneMockupProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();

    if (screens.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, autoPlayMs);

    return () => clearInterval(interval);
  }, [emblaApi, onSelect, autoPlayMs, screens.length]);

  return (
    <div className={cn("relative w-full max-w-[220px] mx-auto", className)}>
      <div className="bg-foreground/10 rounded-[2rem] p-1.5 shadow-xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-foreground/10 rounded-b-xl z-10" />
        <div className="rounded-[1.6rem] overflow-hidden bg-background" ref={emblaRef}>
          <div className="flex">
            {screens.map((s, i) => (
              <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
                <img
                  src={s.src}
                  alt={s.alt}
                  className={cn("w-full aspect-[9/19] object-top", s.fit === "contain" ? "object-contain" : "object-cover")}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Dot indicators */}
      {screens.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {screens.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                i === selectedIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
      {/* Glow */}
      <div className="absolute -inset-6 bg-primary/15 rounded-[3rem] blur-3xl -z-10" />
    </div>
  );
};
