"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product, ProductVariant } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import { ChevronLeft } from "lucide-react";
import ProductImages from "@/components/product-images";
import ProductInfo from "@/components/product-info";
import RatingSummary from "@/components/rating-summary";
import ReviewList from "@/components/review-list";
import ReviewForm from "@/components/review-form";
import RelatedProducts from "@/components/product/related-products";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
  flashSale?: ActiveFlashSaleProduct | null;
}

export default function ProductDetailClient({ product, relatedProducts = [], flashSale }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  );
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const displayImages = product.images || [];
  const currentStock = selectedVariant?.stockQuantity ?? product.stockQuantity ?? 0;
  const isInStock = currentStock > 0;

  const matchingFlashSale = flashSale && selectedVariant && flashSale.variantId === selectedVariant.id
    ? flashSale
    : null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12 my-16 ">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 mb-8 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="md:sticky md:top-6 md:self-start">
            <ProductImages
              images={displayImages}
              productName={product.name}
              isInStock={isInStock}
            />
          </div>

          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            flashSale={matchingFlashSale}
          />
        </div>

        {/* Reviews Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          {/* Section Header */}
          <div className="mb-10">
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
              Reviews
            </p>
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <h2 className="text-xl md:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                Customer Reviews
              </h2>
              <p className="text-sm text-gray-500 max-w-md">
                Honest feedback from customers who bought and used this product.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Rating Summary + Form - Left Side */}
            <div className="lg:col-span-1 space-y-6">
              <RatingSummary
                productId={product.id}
                selectedRating={ratingFilter}
                onSelectRating={setRatingFilter}
              />
              <ReviewForm productId={product.id} />
            </div>

            {/* Reviews List - Right Side */}
            <div className="lg:col-span-2">
              <ReviewList
                productId={product.id}
                ratingFilter={ratingFilter}
                onRatingFilter={setRatingFilter}
              />
            </div>
          </div>
        </div>

        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
