"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Heart,
  User,
  LogOut,
  Package,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon } from "@/components/cart/cart-icon";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { useWishlistStore } from "@/stores/wishlist-store";
import { WishlistSidebar } from "@/components/wishlist/wishlist-sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/config/api-routes";
import type { CompanyProfile } from "@/types/company-profile";
import type { Product } from "@/types/product";
import type { Category, Subcategory } from "@/types/category";

interface NavItem {
  key: string;
  label: string;
  path: string;
}

interface NavbarClientProps {
  company: CompanyProfile | null;
  navItems: NavItem[];
  categories: Category[];
  subcategories: Subcategory[];
}

export function NavbarClient({
  company,
  navItems,
  categories,
  subcategories,
}: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNavbar, setShowNavbar] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const wishlistItemCount = useWishlistStore((s) => s.items.length);
  const { data: session } = useSession() as any;
  const isAuthenticated = !!session?.user;
  const { openLogin } = useAuthModal();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const sortedCategories = React.useMemo(
    () =>
      [...categories]
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const subcategoriesByCategory = React.useMemo(() => {
    const map = new Map<string, Subcategory[]>();
    [...subcategories]
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((sub) => {
        const list = map.get(sub.categoryId) || [];
        list.push(sub);
        map.set(sub.categoryId, list);
      });
    return map;
  }, [subcategories]);

  const closeMenu = React.useCallback(() => {
    setIsOpen(false);
    // Reset the drill-down after the panel has slid away, so the
    // next open starts at the top-level category list again.
    window.setTimeout(() => setSelectedCategory(null), 400);
  }, []);

  const submitSearch = React.useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  }, [router, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  const handleSearchProducts = React.useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiClient<{ data: Product[] }>(
        `${API_ROUTES.PRODUCT}?take=10&skip=0&search=${encodeURIComponent(query)}`,
      );
      setSearchResults(response?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    handleSearchProducts(debouncedSearch);
  }, [debouncedSearch, handleSearchProducts]);

  React.useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  React.useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isOpen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isOpen]);

  React.useEffect(() => {
    setIsOpen(false);
    setSelectedCategory(null);
    setSearchOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (isOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, searchOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isOpen) closeMenu();
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    document.cookie = "user_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    localStorage.removeItem("auth_redirect");
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const handleSuggestionClick = (product: Product) => {
    router.push(`/products/${product.slug}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  // "Discover similar product categories or collections" cards for the
  // search panel — built from the live categories/subcategories, and
  // filtered by the current query when one is typed.
  const discoverItems = React.useMemo(() => {
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
    const q = searchQuery.trim().toLowerCase();
    if (q.length >= 2) {
      const matching = all.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q),
      );
      if (matching.length > 0) return matching.slice(0, 4);
    }
    return all.slice(0, 4);
  }, [categories, subcategories, sortedCategories, searchQuery]);

  const handleLoginClick = () => {
    openLogin(pathname);
  };

  const selectedSubcategories = selectedCategory
    ? subcategoriesByCategory.get(selectedCategory.id) || []
    : [];

  return (
    <>
      {/* Header — Dior-style: hamburger left, centred logo, actions right */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
          showNavbar ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <header className="border-b border-gray-200 bg-white">
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12">
            {/* Left: hamburger */}
            <div className="justify-self-start">
              <button
                className="inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
                onClick={() => {
                  setSearchOpen(false);
                  setIsOpen(true);
                }}
                aria-label="Open the menu"
                aria-expanded={isOpen}
              >
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </div>

            {/* Centre: logo */}
            <Link
              href="/"
              className="flex items-center justify-center justify-self-center"
              aria-label={company?.companyName || "Home"}
            >
              {company?.logoKey ? (
                <Image
                  src={company.logoKey}
                  alt={company.companyName || "Logo"}
                  width={140}
                  height={44}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="font-serif text-2xl tracking-wide text-gray-900 md:text-[28px]">
                  {company?.companyName || "Store"}
                </span>
              )}
            </Link>

            {/* Right: search, wishlist, cart, account */}
            <div className="flex items-center gap-0.5 justify-self-end sm:gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchOpen((v) => !v);
                }}
                className="inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>

              <button
                onClick={() => setWishlistOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
                aria-label={`Wishlist with ${wishlistItemCount} items`}
              >
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                {wishlistItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primarymain text-[9px] font-bold text-white">
                    {wishlistItemCount > 99 ? "99+" : wishlistItemCount}
                  </span>
                )}
              </button>

              <CartIcon onClick={() => setCartOpen(true)} />

              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-gray-800 transition-colors hover:text-black"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-4 w-4 text-gray-600" />
                    </span>
                    <span className="hidden max-w-[100px] truncate lg:block">
                      {session.user.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        "hidden h-3.5 w-3.5 transition-transform lg:block",
                        userMenuOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        href="/profile/user"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/profile/user/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <Link
                        href="/profile/user/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="inline-flex h-10 items-center gap-2 px-2 text-sm font-medium text-gray-800 transition-colors hover:text-black"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                  <span className="hidden md:block">Sign In</span>
                </button>
              )}
            </div>
          </div>

        </header>
      </div>

      {/* Sidebar backdrop — blurred + dimmed page behind, like Dior */}
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/30 backdrop-blur-md transition-opacity duration-400",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMenu}
      />

      {/* Sidebar — floating panel, categories drill down into subcategories */}
      <aside
        className={cn(
          "fixed bottom-2 left-2 top-2 z-[80] flex w-[min(92vw,430px)] flex-col overflow-hidden rounded-2xl bg-[#f8f8f8] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+16px)]",
        )}
        aria-hidden={!isOpen}
      >
        {/* Close */}
        <div className="px-6">
          <button
            onClick={closeMenu}
            className="flex items-center gap-2 py-5 text-sm text-gray-800 transition-colors hover:text-black"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
            Close
          </button>
          <div className="h-px bg-gray-300/60" />
        </div>

        {/* Back row (drill-down level) */}
        <div
          className={cn(
            "overflow-hidden px-6 transition-all duration-300",
            selectedCategory
              ? "max-h-16 opacity-100"
              : "pointer-events-none max-h-0 opacity-0",
          )}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 py-3 text-sm font-medium text-gray-900"
            tabIndex={selectedCategory ? 0 : -1}
          >
            <ChevronLeft className="h-4 w-4" />
            {selectedCategory?.name}
          </button>
          <div className="h-px bg-gray-300/60" />
        </div>

        {/* Sliding panes: categories -> subcategories */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              transform: selectedCategory
                ? "translateX(-100%)"
                : "translateX(0)",
            }}
          >
            {/* Level 0: categories, then page links */}
            <div className="h-full w-full shrink-0 overflow-y-auto px-6 py-2">
              {sortedCategories.map((category) => {
                const subs = subcategoriesByCategory.get(category.id) || [];
                const rowClass =
                  "flex w-full items-center justify-between py-[15px] text-left text-[15px] text-gray-800 transition-colors hover:text-black";
                return subs.length > 0 ? (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={rowClass}
                  >
                    {category.name}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ) : (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    onClick={closeMenu}
                    className={rowClass}
                  >
                    {category.name}
                  </Link>
                );
              })}

              {sortedCategories.length > 0 && (
                <div className="my-3 h-px bg-gray-300/60" />
              )}

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMenu}
                  className={cn(
                    "block py-[13px] text-[15px] transition-colors hover:text-black",
                    pathname === item.path
                      ? "font-medium text-black"
                      : "text-gray-800",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Level 1: subcategories of the selected category */}
            <div className="h-full w-full shrink-0 overflow-y-auto px-6 py-2">
              {selectedCategory && (
                <>
                  <Link
                    href={`/products?categoryId=${selectedCategory.id}`}
                    onClick={closeMenu}
                    className="block py-[15px] text-[15px] font-medium text-gray-900"
                  >
                    All {selectedCategory.name}
                  </Link>
                  {selectedSubcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/products?categoryId=${selectedCategory.id}&subcategoryId=${sub.id}`}
                      onClick={closeMenu}
                      className="block py-[15px] text-[15px] text-gray-800 transition-colors hover:text-black"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer: account + contact (same actions the old menu had) */}
        <div className="border-t border-gray-300/60 px-6 py-4">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4.5 w-4.5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Link
                href="/profile/user"
                onClick={closeMenu}
                className="flex items-center gap-3 py-2 text-[15px] text-gray-800 hover:text-black"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
                My Profile
              </Link>
              <Link
                href="/profile/user/orders"
                onClick={closeMenu}
                className="flex items-center gap-3 py-2 text-[15px] text-gray-800 hover:text-black"
              >
                <Package className="h-5 w-5" strokeWidth={1.5} />
                My Orders
              </Link>
              <button
                onClick={() => {
                  closeMenu();
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 py-2 text-[15px] text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.5} />
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                closeMenu();
                handleLoginClick();
              }}
              className="flex w-full items-center justify-center gap-2 bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
            >
              <User className="h-4 w-4" />
              Sign In
            </button>
          )}

          {(company?.phoneNumber || company?.email) && (
            <div className="space-y-1 pt-3 text-sm text-gray-500">
              {company?.phoneNumber && (
                <a
                  href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`}
                  className="block hover:text-gray-900"
                >
                  {company.phoneNumber}
                </a>
              )}
              {company?.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="block hover:text-gray-900"
                >
                  {company.email}
                </a>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Search backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-black/30 backdrop-blur-md transition-opacity duration-400",
          searchOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSearchOpen(false)}
      />

      {/* Search panel — opens from the right, like Dior (no "You may also like") */}
      <aside
        className={cn(
          "fixed bottom-2 right-2 top-2 z-[80] flex w-[min(96vw,1060px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          searchOpen ? "translate-x-0" : "translate-x-[calc(100%+16px)]",
        )}
        aria-hidden={!searchOpen}
      >
        {/* Panel header: Close left, active search icon right */}
        <div className="flex items-center justify-between px-6 pt-5 md:px-10">
          <button
            onClick={() => setSearchOpen(false)}
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
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex items-center gap-3 border-b border-gray-400 pb-3">
              <Search className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none md:text-lg"
              />
              {isSearching ? (
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-primarymain" />
              ) : (
                searchQuery.trim() && (
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
          {searchQuery.trim() && (
            <div className="flex justify-end pt-4">
              <button
                onClick={submitSearch}
                className="text-sm text-gray-800 transition-colors hover:text-black"
              >
                Search for{" "}
                <span className="font-medium underline underline-offset-4">
                  {searchQuery.trim()}
                </span>{" "}
                products
              </button>
            </div>
          )}

          {/* Live product results while typing, otherwise category suggestions */}
          {searchResults.length > 0 ? (
            <div className="mt-10">
              <p className="text-[15px] text-gray-500">Products</p>
              <div className="mt-2">
                {searchResults.map((product) => {
                  const productImage =
                    product.images?.find((img) => img.isPrimary) ||
                    product.images?.[0];
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionClick(product)}
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
            sortedCategories.length > 0 && (
              <div className="mt-10">
                <p className="text-[15px] text-gray-500">Suggestions</p>
                <div className="mt-2">
                  {sortedCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(category.name);
                        searchInputRef.current?.focus();
                      }}
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
                    onClick={() => setSearchOpen(false)}
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

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Wishlist Sidebar */}
      <WishlistSidebar
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </>
  );
}
