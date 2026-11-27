"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCrud } from "@/hooks/useCRUD";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import ProductCard from "@/components/product-card";
import ProductFilter from "@/components/product-filter";
import NoData from "@/components/no-data";
import { getActiveFlashSaleProducts } from "@/actions/flash-sale-action";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "oldest", label: "Oldest" },
  { value: "popularity", label: "Popularity" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const subcategoryId = searchParams.get("subcategoryId") || "";
  const brandId = searchParams.get("brandId") || "";
  const sortBy = searchParams.get("sortBy") || "newest";
  const [filters, setFilters] = useState({
    categoryId,
    subcategoryId,
    brandId,
    minPrice: "",
    maxPrice: "",
    minRating: "",
  });
  const [page, setPage] = useState(1);
  const [flashSaleProducts, setFlashSaleProducts] = useState<ActiveFlashSaleProduct[]>([]);
  const take = 20;

  // Sync filters with URL params when they change
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      subcategoryId,
      brandId,
    }));
  }, [categoryId, subcategoryId, brandId]);

  const { getAllPaginated } = useCrud<Product>({
    endpoint: API_ROUTES.PRODUCT,
    queryKey: "public-products",
  });

  const { data: productsData, isLoading } = getAllPaginated({
    take,
    skip: (page - 1) * take,
    status: "active",
    ...(searchQuery && { search: searchQuery }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.subcategoryId && { subcategoryId: filters.subcategoryId }),
    ...(filters.brandId && { brandId: filters.brandId }),
    ...(filters.minPrice && { minPrice: parseInt(filters.minPrice) }),
    ...(filters.maxPrice && { maxPrice: parseInt(filters.maxPrice) }),
    ...(filters.minRating && { minRating: parseInt(filters.minRating) }),
    ...(sortBy && { sortBy }),
  });

  const products = productsData?.items || [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / take);

  useEffect(() => {
    getActiveFlashSaleProducts().then(setFlashSaleProducts);
  }, []);

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", value);
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const hasActiveFilters = !!(
    filters.categoryId ||
    filters.subcategoryId ||
    filters.brandId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating
  );

  const clearFilters = () => {
    handleFilterChange({
      categoryId: "",
      subcategoryId: "",
      brandId: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12 my-20">
        <div className="flex gap-8">
          {/* Desktop: Sticky Filter Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilter onFilterChange={handleFilterChange} initialFilters={filters} />
            </div>
          </div>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Mobile: Filter toggle button (renders inline above sort dropdown) */}
            <div className="md:hidden mb-4">
              <ProductFilter onFilterChange={handleFilterChange} initialFilters={filters} />
            </div>

            {/* Sort Dropdown */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="hidden md:block">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <X size={14} />
                    Clear filter
                  </button>
                )}
              </div>
              <div className="relative ml-auto">
                <label htmlFor="sort-select" className="sr-only">Sort by</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none w-full sm:w-48 px-3 py-2 pr-8 border border-gray-200 bg-white rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primarymain/20 focus:border-primarymain cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 mb-3" />
                    <div className="h-3 bg-gray-100 mb-2 w-3/4" />
                    <div className="h-3 bg-gray-100 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <NoData title="products" />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product, index) => {
                    const productVariantIds = product.variants?.map((v: { id: string }) => v.id) || [];
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (Math.abs(p - page) <= 1) return true;
                        return false;
                      })
                      .reduce<(number | string)[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) {
                          acc.push("...");
                        }
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        typeof p === "string" ? (
                          <span key={`dots-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-300 text-sm">
                            ...
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors ${
                              page === p
                                ? "bg-primarymain text-white"
                                : "border border-gray-200 text-gray-600 hover:border-primarymain"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-primarymain hover:text-primarymain disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
