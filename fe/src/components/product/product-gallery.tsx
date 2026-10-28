"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const t = useTranslations("ProductDetail");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* Desktop: lưới 2x2 */}
      <div className="hidden grid-cols-2 content-start gap-8 self-start md:grid">
        {images.map((src, i) => (
          <motion.button
            key={src + i}
            type="button"
            aria-label={t("openImage", { index: i + 1 })}
            onClick={() => setOpenIndex(i)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative aspect-square cursor-zoom-in overflow-hidden"
          >
            <Image
              src={src}
              alt={`${name} ${i + 1}`}
              fill
              priority={i < 2}
              sizes="(min-width: 1440px) 300px, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          </motion.button>
        ))}
      </div>

      {/* Mobile: vuốt ngang */}
      <Carousel className="md:hidden" opts={{ loop: images.length > 1 }}>
        <CarouselContent>
          {images.map((src, i) => (
            <CarouselItem key={src + i}>
              <button
                type="button"
                aria-label={t("openImage", { index: i + 1 })}
                onClick={() => setOpenIndex(i)}
                className="relative block aspect-square w-full overflow-hidden"
              >
                <Image src={src} alt={`${name} ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-3 bg-cream/80" />
            <CarouselNext className="right-3 bg-cream/80" />
          </>
        )}
      </Carousel>

      {/* Xem ảnh lớn */}
      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-[min(90vw,720px)] bg-cream p-4 sm:max-w-[min(90vw,720px)]">
          <DialogTitle className="sr-only">{t("galleryTitle", { name })}</DialogTitle>
          {openIndex !== null && (
            <Carousel opts={{ startIndex: openIndex, loop: images.length > 1 }}>
              <CarouselContent>
                {images.map((src, i) => (
                  <CarouselItem key={src + i}>
                    <div className="relative aspect-square">
                      <Image src={src} alt={`${name} ${i + 1}`} fill sizes="720px" className="object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-3 bg-cream/80" />
                  <CarouselNext className="right-3 bg-cream/80" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
