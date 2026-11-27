"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/types/product";
import type { ActiveFlashSaleProduct } from "@/types/flash-sale";
import WishlistButton from "@/components/wishlist/wishlist-button";
import { useCartStore } from "@/stores/cart-store";
import { dispatchOpenCart } from "@/components/cart/cart-icon";
import { showSuccess, showError } from "@/lib/toast-helper";

interface ProductCardProps {
  product?: Product;
  index?: number;
  flashSalePrice?: number;
  flashSaleOriginalPrice?: number;
  flashSaleName?: string;
  activeFlashSaleProduct?: ActiveFlashSaleProduct;
}

/** Card price format, matching the reference design: Rs1,550.00 */
function formatCardPrice(value: number): string {
  return `Rs${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCheapestVariant(product: Product) {
  if (product.variants && product.variants.length > 0) {
    const inStockVariants = product.variants.filter((v) => v.stockQuantity > 0);
    if (inStockVariants.length > 0) {
      return inStockVariants.reduce((cheapest, current) =>
        current.price < cheapest.price ? current : cheapest
      );
    }
    return product.variants.reduce((cheapest, current) =>
      current.price < cheapest.price ? current : cheapest
    );
  }
  return null;
}

function getProductPriceValue(product: Product): number {
  const variant = getCheapestVariant(product);
  return variant ? variant.price : (product.price ?? 0);
}

function getCompareAtPriceValue(product: Product): number | null {
  const variant = getCheapestVariant(product);
  if (variant?.compareAtPrice && variant.compareAtPrice > variant.price) {
    return variant.compareAtPrice;
  }
  const comparePrice = product.compareAtPrice;
  if (comparePrice && comparePrice > (product.price ?? 0)) {
    return comparePrice;
  }
  return null;
}

function isOutOfStock(product: Product) {
  if (product.variants && product.variants.length > 0) {
    return product.variants.every((v) => v.stockQuantity <= 0);
  }
  return (product.stockQuantity ?? 0) <= 0;
}

function getDiscountPercent(product: Product): number | null {
  const variant = getCheapestVariant(product);
  if (variant?.compareAtPrice && variant.price) {
    if (variant.compareAtPrice > variant.price) {
      return Math.round(
        ((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100
      );
    }
    return null;
  }
  const comparePrice = product.compareAtPrice;
  const price = product.price ?? 0;
  if (comparePrice && comparePrice > price) {
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }
  return null;
}

/** "NEW" badge: products added within the last 30 days. */
function isNewProduct(product: Product): boolean {
  const created = new Date(product.createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const age = Date.now() - created;
  return age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
}

const BADGE_CLASS =
  "px-2 py-1 text-[10px] font-semibold tracking-[0.12em] z-10";

export default function ProductCard({
  product,
  flashSalePrice,
  flashSaleOriginalPrice,
  activeFlashSaleProduct,
}: ProductCardProps) {
  if (!product && !activeFlashSaleProduct) return null;

  const primaryImage = activeFlashSaleProduct?.imageUrl
    ? { url: activeFlashSaleProduct.imageUrl, isPrimary: true }
    : product?.images?.find((img) => img.isPrimary) || product?.images?.[0];
  const outOfStock = product ? isOutOfStock(product) : false;
  const discountPercent = product ? getDiscountPercent(product) : null;
  const compareAtPrice = product ? getCompareAtPriceValue(product) : null;
  const showNew = product ? isNewProduct(product) : false;

  const salePrice = activeFlashSaleProduct?.salePrice ?? flashSalePrice;
  const originalPrice = activeFlashSaleProduct?.originalPrice ?? flashSaleOriginalPrice;
  const hasFlashSale = salePrice != null && originalPrice != null && salePrice < originalPrice;
  const flashSaleDiscount = hasFlashSale
    ? Math.round(((originalPrice! - salePrice!) / originalPrice!) * 100)
    : null;

  const displayName = activeFlashSaleProduct?.productName ?? product?.name ?? "";
  const displaySlug = activeFlashSaleProduct?.productSlug ?? product?.slug ?? "";

  // Quick-add: the "+" button adds the variant this card's price refers
  // to — the flash-sale variant when there is one, otherwise the
  // cheapest in-stock variant — exactly like the product page does
  // (cart store + open the cart + toast), without leaving the page.
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;

    let target = getCheapestVariant(product);
    let price = target?.price ?? product.price ?? 0;

    if (hasFlashSale) {
      const flashVariant =
        (activeFlashSaleProduct?.variantId &&
          product.variants?.find(
            (v) => v.id === activeFlashSaleProduct.variantId,
          )) ||
        product.variants?.find((v) => v.price === originalPrice);
      if (flashVariant && flashVariant.stockQuantity > 0) {
        target = flashVariant;
        price = salePrice!;
      } else if (target && target.price === originalPrice) {
        price = salePrice!;
      }
    }

    if (!target) {
      showError("This product is not available for purchase");
      return;
    }

    const alreadyInCart =
      useCartStore
        .getState()
        .items.find((i) => i.variantId === target!.id)?.quantity ?? 0;
    if (alreadyInCart >= target.stockQuantity) {
      showError("No more stock available for this item");
      return;
    }

    useCartStore.getState().addItem({
      variantId: target.id,
      priceAtAdd: price,
      productName: product.name,
      productSlug: product.slug,
      variantSku: target.sku ?? null,
      stockQuantity: target.stockQuantity,
      allowBackorder: target.allowBackorder ?? product.allowBackorder ?? false,
      imageUrl: primaryImage?.url,
      productId: product.id,
      categoryId: product.categoryId,
      brandId: product.brandId,
      attributes: target.attributes?.map((a) => ({
        attributeName: a.attributeName,
        attributeValue: a.attributeValue,
      })),
    });
    dispatchOpenCart();
    showSuccess("Added to cart");
  };

  const canQuickAdd =
    !!product && !outOfStock && (product.variants?.length ?? 0) > 0;

  return (
    <Link href={`/products/${displaySlug}`} className="group relative block bg-white">
      {/* Image area — light gray, generous padding, like the reference */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f6f6]">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={displayName}
            fill
            className="object-contain  transition-transform duration-500 group-hover:scale-105 "
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-gray-200">
            {displayName.charAt(0)}
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="border border-white px-4 py-1.5 text-[11px] font-bold tracking-widest text-white">
              OUT OF STOCK
            </span>
          </div>
        )}

        {/* Badges, top-left */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {showNew && (
            <span className={`${BADGE_CLASS} border border-gray-200 bg-white text-gray-900`}>
              NEW
            </span>
          )}
          {hasFlashSale && flashSaleDiscount ? (
            <span className={`${BADGE_CLASS} bg-black text-white`}>
              FLASH SALE · {flashSaleDiscount}% OFF
            </span>
          ) : (
            discountPercent && (
              <span className={`${BADGE_CLASS} bg-black text-white`}>
                SAVE {discountPercent}%
              </span>
            )
          )}
        </div>

        {product && (
          <div className="absolute right-3 top-3 z-10">
            <WishlistButton product={product} size="sm" />
          </div>
        )}

        {/* Quick-add "+" — bottom-right, appears on hover */}
        {canQuickAdd && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Add ${displayName} to cart`}
            className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center bg-black text-white opacity-0 transition-opacity duration-200 hover:bg-gray-800 group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Name + price, centred */}
      <div className="px-2 py-4 text-center">
        <h3 className="line-clamp-2 text-[13px] font-medium uppercase leading-snug tracking-[0.08em] text-gray-900 group-hover:underline decoration-1 underline-offset-4 sm:text-sm">
          {displayName}
        </h3>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          {hasFlashSale ? (
            <>
              <p className="text-sm text-gray-900 sm:text-[15px]">{formatCardPrice(salePrice!)}</p>
              <p className="text-sm text-gray-400 line-through">{formatCardPrice(originalPrice!)}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-900 sm:text-[15px]">
                {product ? formatCardPrice(getProductPriceValue(product)) : ""}
              </p>
              {compareAtPrice && (
                <p className="text-sm text-gray-400 line-through">
                  {formatCardPrice(compareAtPrice)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
