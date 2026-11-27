import { Hero } from "@/components/sections/hero";
import { Testimonials } from "@/components/sections/testimonials";
import { FaqSection } from "@/components/sections/faq-section";
import BlogSection from "@/components/sections/blog-section";
import { MidBanner } from "@/components/sections/mid-banner";
import { getBlogs } from "@/actions/blog-action";
import CategorySection from "@/components/sections/category-section";
import FeaturedProducts from "@/components/sections/featured-products";
import BestSellers from "@/components/sections/best-seller-products";
import NewArrivals from "@/components/sections/new-arrivals";
import BrandSection from "@/components/sections/brand-section";
import TrustFeatures from "@/components/sections/trust-features";
import WhyChooseUs from "@/components/sections/why-choose-us";
import FlashSaleSection from "@/components/sections/flash-sale-section";
export default async function Home() {
  const posts = await getBlogs({ take: 3, isActive: true });

  return (
    <>
      <Hero />
      <FlashSaleSection />
      <NewArrivals />
      <MidBanner />
      <BestSellers />
      <CategorySection />
      {/* <WhyChooseUs /> */}
      {/* <BrandSection /> */}
      <FeaturedProducts />
      <BlogSection posts={posts} />
      <TrustFeatures />
      <Testimonials />
      <FaqSection />
    </>
  );
}
