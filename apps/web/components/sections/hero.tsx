import Image from "next/image";
import Link from "next/link";
import { getBanners } from "@/actions/banner-action";
import HeroBannerSlider from "./hero-banner-slider";

export async function Hero() {
  const allBanners = await getBanners();
  const heroBanners = allBanners.filter((b) => b.type === "hero");

  if (heroBanners.length === 0) {
    return null;
  }

  if (heroBanners.length === 1 && heroBanners[0]) {
    const banner = heroBanners[0];
    return (
      <section className="  relative w-full h-screen md:h-[140vh]">
        {banner.link ? (
          <Link href={banner.link} className="block h-full w-full">
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
              priority
            />
          </Link>
        ) : (
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className=""
            priority
          />
        )}
      </section>
    );
  }

  return <HeroBannerSlider banners={heroBanners} />;
}
