import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPreviewProps {
  url: string;
}

// Renders every page of a PDF to a canvas via pdf.js instead of relying on the
// browser's native PDF plugin — Capacitor WebViews (iOS/Android) don't reliably
// ship one, so an <iframe src="..."> silently shows a blank box on-device.
export const PdfPreview = ({ url }: PdfPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const render = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "w-full h-auto rounded-lg shadow-sm mb-3 bg-white";
          const context = canvas.getContext("2d");
          if (!context) continue;
          await page.render({ canvasContext: context, viewport } as Parameters<typeof page.render>[0]).promise;
          if (cancelled) return;
          containerRef.current?.appendChild(canvas);
        }
        if (!cancelled) setIsLoading(false);
      } catch (err) {
        console.error("Failed to render PDF:", err);
        if (!cancelled) {
          setError("Could not load this PDF.");
          setIsLoading(false);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return <p className="text-sm text-muted-foreground text-center py-8">{error}</p>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
};
