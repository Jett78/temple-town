"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { Product } from "@/types/product";
import type { Category, Subcategory } from "@/types/category";
import type { DiscoverItem } from "./types";

interface UseProductSearchOptions {
  /** Called whenever a search action should also close the search panel. */
  onClose: () => void;
  categories: Category[];
  subcategories: Subcategory[];
  sortedCategories: Category[];
}

/**
 * All search behaviour for the navbar search panel: the debounced live
 * product lookup, submitting a search, and the "Discover similar…"
 * cards derived from the live categories/subcategories.
 */
export function useProductSearch({
  onClose,
  categories,
  subcategories,
  sortedCategories,
}: UseProductSearchOptions) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const fetchResults = React.useCallback(async (value: string) => {
    if (value.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiClient<{ data: Product[] }>(
        `${API_ROUTES.PRODUCT}?take=10&skip=0&search=${encodeURIComponent(value)}`,
      );
      setResults(response?.data || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const submitSearch = React.useCallback(() => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  }, [router, query, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const openProduct = (product: Product) => {
    router.push(`/products/${product.slug}`);
    setQuery("");
    onClose();
  };

  /** Fill the input with a suggestion term (used by the Suggestions list). */
  const applySuggestion = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const discoverItems: DiscoverItem[] = React.useMemo(() => {
    const categoryName = (id: string) =>
      categories.find((c) => c.id === id)?.name || "";
    const pool = [...subcategories]
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        key: s.id,
        title: s.name,
        subtitle: categoryName(s.categoryId),
        href: `/products?categoryId=${s.categoryId}&subcategoryId=${s.id}`,
      }));
    const fallback = sortedCategories.map((c) => ({
      key: c.id,
      title: c.name,
      subtitle: "Category",
      href: `/products?categoryId=${c.id}`,
    }));
    const all = pool.length > 0 ? pool : fallback;
    const q = query.trim().toLowerCase();
    if (q.length >= 2) {
      const matching = all.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q),
      );
      if (matching.length > 0) return matching.slice(0, 4);
    }
    return all.slice(0, 4);
  }, [categories, subcategories, sortedCategories, query]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    inputRef,
    submitSearch,
    handleSubmit,
    openProduct,
    applySuggestion,
    discoverItems,
  };
}

export type ProductSearch = ReturnType<typeof useProductSearch>;
