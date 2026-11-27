import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/actions/homepage-actions";
import { getImageUrl } from "@/lib/utils";

/**
 * Category showcase, Atelio-style: full-bleed tall image tiles with
 * no gaps — category name and a "View Collection" outline button at
 * the bottom-left of each tile. Images and names come from the live
 * categories; the whole tile links to that category's products.
 */
export default async function CategorySection() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="group relative block aspect-[3/4] overflow-hidden bg-gray-900 lg:aspect-[3/5]"
          >
            {category.imageKey ? (
              <Image
                src={getImageUrl(category.imageKey)}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-6xl font-bold text-white/20">
                {category.name.charAt(0)}
              </div>
            )}

            {/* Soft shade at the bottom so the text stays readable */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />

            <div className="absolute bottom-0 left-0 p-5 sm:p-7">
              <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-white sm:text-lg">
                {category.name}
              </h3>
              <span className="mt-4 inline-block border border-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black sm:text-xs">
                View Collection
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
