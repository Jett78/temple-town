"use client";

import * as React from "react";
import Link from "next/link";
import { X, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PanelBackdrop } from "./panel-backdrop";
import type { ProductSearch } from "./use-product-search";
import type { Category } from "@/types/category";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  search: ProductSearch;
  /** Live categories, shown as Suggestions when there are no results. */
  suggestions: Category[];
}

/**
 * The search panel — opens from the right, like Dior. Live product
 * results while typing; otherwise category suggestions, plus
 * "Discover similar product categories or collections" cards.
 * (Deliberately no "You may also like" section.)
 */
export function SearchPanel({
  open,
  onClose,
  search,
  suggestions,
}: SearchPanelProps) {
  const {
    query,
    results,
    isSearching,
    inputRef,
    submitSearch,
    handleSubmit,
    openProduct,
    applySuggestion,
    discoverItems,
  } = search;

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, inputRef]);

  return (
    <>
      <PanelBackdrop open={open} onClose={onClose} />

      <aside
        className={cn(
          "fixed bottom-2 right-2 top-2 z-[80] flex w-[min(96vw,1020px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-x-0" : "translate-x-[calc(100%+16px)]",
        )}
        aria-hidden={!open}
      >
        {/* Panel header: Close left, active search icon right */}
        <div className="flex items-center justify-between px-6 pt-5 md:px-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 py-2 text-sm text-gray-800 transition-colors hover:text-black"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
            Close
          </button>
          <span className="border-b-2 border-gray-900 pb-1.5 text-gray-900">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </span>
        </div>
        <div className="mx-6 mt-3 h-px bg-gray-200 md:mx-10" />

        <div className="flex-1 overflow-y-auto px-6 pb-10 md:px-10">
          {/* Search input row */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex items-center gap-3 border-b border-gray-400 pb-3">
              <Search
                className="h-5 w-5 shrink-0 text-gray-400"
                strokeWidth={1.5}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => search.setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none md:text-lg"
              />
              {isSearching ? (
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-primarymain" />
              ) : (
                query.trim() && (
                  <button
                    type="submit"
                    aria-label="Search"
                    className="shrink-0 text-gray-500 transition-colors hover:text-black"
                  >
                    <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                )
              )}
            </div>
          </form>

          {/* "Search for … products" */}
          {query.trim() && (
            <div className="flex justify-end pt-4">
              <button
                onClick={submitSearch}
                className="text-sm text-gray-800 transition-colors hover:text-black"
              >
                Search for{" "}
                <span className="font-medium underline underline-offset-4">
                  {query.trim()}
                </span>{" "}
                products
              </button>
            </div>
          )}

          {/* Live results while typing, otherwise category suggestions */}
          {results.length > 0 ? (
            <div className="mt-10">
              <p className="text-[15px] text-gray-500">Products</p>
              <div className="mt-2">
                {results.map((product) => {
                  const productImage =
                    product.images?.find((img) => img.isPrimary) ||
                    product.images?.[0];
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProduct(product)}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded bg-gray-100">
                        {productImage?.url ? (
                          <img
                            src={productImage.url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-400">
                            {product.name.charAt(0)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="block truncate text-sm text-gray-500">
                          {product.variants?.[0]?.price
                            ? `Rs. ${product.variants[0].price.toLocaleString()}`
                            : "No price"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            suggestions.length > 0 && (
              <div className="mt-10">
                <p className="text-[15px] text-gray-500">Suggestions</p>
                <div className="mt-2">
                  {suggestions.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => applySuggestion(category.name)}
                      className="block py-2 text-left text-[15px] text-gray-800 transition-colors hover:text-black"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Discover similar categories / collections */}
          {discoverItems.length > 0 && (
            <>
              <div className="my-8 h-px bg-gray-200" />
              <p className="text-[15px] text-gray-500">
                Discover similar product categories or collections
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {discoverItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className="rounded-xl border border-gray-200 px-4 py-4 transition-colors hover:border-gray-400"
                  >
                    <span className="block text-[15px] font-medium text-gray-900">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="mt-0.5 block text-sm text-gray-500">
                        {item.subtitle}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
