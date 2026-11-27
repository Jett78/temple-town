import Image from "next/image";
import Link from "next/link";
import { getBanners } from "@/actions/banner-action";
import HeroBannerSlider from "./hero-banner-slider";

export async function MidBanner() {
  const allBanners = await getBanners();
  const midBanners = allBanners.filter((b) => b.type === "mid");

  if (midBanners.length === 0) {
    return null;
  }

  if (midBanners.length === 1 && midBanners[0]) {
    const banner = midBanners[0];
    return (
      <section className="w-full">
        <div className="relative h-screen md:h-[140vh] w-full ">
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className=""
          />
          {banner.link && (
            <Link
              href={banner.link}
              className="absolute inset-0"
              aria-label={banner.title}
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <HeroBannerSlider banners={midBanners} />
    </section>
  );
}
