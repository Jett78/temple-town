"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRef } from "react";
import CountdownTimer from "@/components/countdown-timer";
import type { FlashSale, ActiveFlashSaleProduct } from "@/types/flash-sale";
import ProductCard from "@/components/product-card";
import PrimaryButton from "@/components/ui/primary-button";
import Image from "next/image";

interface FlashSaleSectionClientProps {
  sale: FlashSale;
  products: ActiveFlashSaleProduct[];
}

export default function FlashSaleSectionClient({
  sale,
  products,
}: FlashSaleSectionClientProps) {
  const sliderRef = useRef<Slider | null>(null);
  const showSlider = products.length > 5;

  const settings = {
    dots: true,
    infinite: products.length > 5,
    slidesToShow: 5,
    slidesToScroll: 1,
    speed: 1000,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: { slidesToShow: 4 },
      },
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 480,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Cover Image */}
      {sale.imageUrl && (
        <div className="absolute inset-0">
          <Image
            src={sale.imageUrl}
            alt={sale.name}
            fill
            priority
            className="w-full h-full object-cover opacity-30"
          />
          {/* <div className="absolute inset-0 bg-gradient-to-r from-primarymain/90 via-primarymain/70 to-transparent" /> */}
        </div>
      )}

      <div className="relative mx-auto max-w-screen px-4 sm:px-6 lg:px-12 py-10 sm:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                {sale.name}
              </h2>
          </div>

          <div className="bg-white rounded-xl px-6 py-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 text-center">
              Ends In
            </p>
            <CountdownTimer endsAt={sale.endsAt} />
          </div>
        </div>

        {/* Products */}
        {showSlider ? (
          <div className="relative">
            <Slider {...settings} ref={sliderRef}>
              {products.map((item) => (
                <div key={item.id} className="px-2">
                  <ProductCard activeFlashSaleProduct={item} />
                </div>
              ))}
            </Slider>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                sliderRef.current?.slickPrev();
              }}
              className="absolute left-0 top-[40%] z-10 -translate-y-1/2 -translate-x-3 bg-white border border-gray-200 p-2 transition-colors hover:border-gray-900 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 text-gray-900" />
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                sliderRef.current?.slickNext();
              }}
              className="absolute right-0 top-[40%] z-10 -translate-y-1/2 translate-x-3 bg-white border border-gray-200 p-2 transition-colors hover:border-gray-900 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4 text-gray-900" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.slice(0, 10).map((item) => (
              <ProductCard key={item.id} activeFlashSaleProduct={item} />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-8">
          <PrimaryButton
            text="VIEW ALL"
            path={`/flash-sale?sale=${sale.slug}`}
            variant="primary"
          />
        </div>
      </div>
    </section>
  );
}
