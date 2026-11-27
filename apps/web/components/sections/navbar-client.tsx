"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import { WishlistSidebar } from "@/components/wishlist/wishlist-sidebar";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useSession, signOut } from "@/lib/auth-client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import type { Subcategory } from "@/types/category";
import { HeaderBar } from "./navbar/header-bar";
import { CategorySidebar } from "./navbar/category-sidebar";
import { SearchPanel } from "./navbar/search-panel";
import { useProductSearch } from "./navbar/use-product-search";
import type { NavbarClientProps } from "./navbar/types";

/**
 * Navbar orchestrator. The pieces live in ./navbar/:
 * - HeaderBar        the top bar (hamburger, logo, search/wishlist/cart)
 * - CategorySidebar  hamburger panel with category -> subcategory drill-down
 * - SearchPanel      right-side search panel with live results
 * - useProductSearch debounced product search + discover cards
 * This component only owns the shared state: which panel is open,
 * hide-on-scroll, body scroll-lock, and the auth actions.
 */
export function NavbarClient({
  company,
  navItems,
  categories,
  subcategories,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [showNavbar, setShowNavbar] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [wishlistOpen, setWishlistOpen] = React.useState(false);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { data: session } = useSession() as any;
  const user = session?.user ?? null;
  const { openLogin } = useAuthModal();

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

  const search = useProductSearch({
    onClose: () => setSearchOpen(false),
    categories,
    subcategories,
    sortedCategories,
  });

  // Other parts of the app can open the cart via this window event.
  React.useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  // Hide the bar when scrolling down, show it again scrolling up.
  React.useEffect(() => {
    const handleScroll = () => {
      if (menuOpen) return;
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
  }, [lastScrollY, menuOpen]);

  // Route changes close every panel.
  React.useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Lock body scroll while a full-height panel is open.
  React.useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOut();
    document.cookie = "user_role=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    localStorage.removeItem("auth_redirect");
    window.location.href = "/";
  };

  return (
    <>
      <HeaderBar
        company={company}
        visible={showNavbar}
        menuOpen={menuOpen}
        searchOpen={searchOpen}
        wishlistCount={wishlistCount}
        onOpenMenu={() => {
          setSearchOpen(false);
          setMenuOpen(true);
        }}
        onToggleSearch={() => {
          setMenuOpen(false);
          setSearchOpen((v) => !v);
        }}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      <CategorySidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={sortedCategories}
        subcategoriesByCategory={subcategoriesByCategory}
        navItems={navItems}
        pathname={pathname}
        company={company}
        user={user}
        onLogin={() => openLogin(pathname)}
        onLogout={handleLogout}
      />

      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        search={search}
        suggestions={sortedCategories}
      />

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistSidebar
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
      />
    </>
  );
}
