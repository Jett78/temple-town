import Link from "next/link";
import Image from "next/image";
import { getBrands } from "@/actions/brand-action";

export default async function BrandSection() {
  const brands = await getBrands();

  if (brands.length === 0) return null;

  return (
    <section className="py-10 sm:py-16 border-t border-gray-100">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">
            Partners
          </p>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 uppercase">
            Shop by Brand
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brandId=${brand.id}`}
              className="group flex items-center justify-center aspect-[3/2] bg-gray-50 border border-gray-200 hover:border-primarymain transition-colors duration-200 p-4"
            >
              {brand.imageKey ? (
                <Image
                  src={brand.imageKey}
                  alt={brand.name}
                  width={120}
                  height={60}
                  className="object-contain max-h-10 w-auto group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <span className="text-sm font-bold text-gray-400 group-hover:text-primarymain transition-colors text-center leading-tight">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
