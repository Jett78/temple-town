import Link from "next/link";
import { getNewArrivals } from "@/actions/homepage-actions";
import { getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import ProductCard from "@/components/product-card";

export default async function NewArrivals() {
  const [products, flashSaleProducts] = await Promise.all([
    getNewArrivals(20),
    getActiveFlashSaleProducts(),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        {/* Centred title, like Atelio's "NEW DROP" */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">
            Just In
          </p>
          <h2 className="text-[22px] font-semibold uppercase tracking-[0.25em] text-gray-900 md:text-2xl">
            New Arrivals
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => {
            const productVariantIds = product.variants?.map((v) => v.id) || [];
            const flashSale = flashSaleProducts.find((fp) =>
              productVariantIds.includes(fp.variantId)
            ) || null;
            return (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                flashSalePrice={flashSale?.salePrice}
                flashSaleOriginalPrice={flashSale?.originalPrice}
                flashSaleName={flashSale?.flashSaleName}
              />
            );
          })}
        </div>

        {/* "Shop the Drop" — black square button below the grid */}
        <div className="mt-14 text-center">
          <Link
            href="/products?sortBy=newest"
            className="inline-block bg-black px-12 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-800"
          >
            Shop the Drop
          </Link>
        </div>
      </div>
    </section>
  );
}
