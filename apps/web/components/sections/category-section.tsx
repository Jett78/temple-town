import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/actions/homepage-actions";
import { getImageUrl } from "@/lib/utils";

export default async function CategorySection() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-1">
            Browse
          </p>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 uppercase">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="group relative aspect-square overflow-hidden bg-gray-50 border border-gray-200 hover:border-gray-900 transition-colors duration-200"
            >
              {category.imageKey ? (
                <Image
                  src={getImageUrl(category.imageKey)}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-4xl font-bold text-gray-200">
                  {category.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
