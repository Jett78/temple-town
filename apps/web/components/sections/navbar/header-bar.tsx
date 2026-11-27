"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Heart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartIcon } from "@/components/cart/cart-icon";
import type { CompanyProfile } from "@/types/company-profile";

interface HeaderBarProps {
  company: CompanyProfile | null;
  /** Hide-on-scroll state, owned by the navbar orchestrator. */
  visible: boolean;
  menuOpen: boolean;
  searchOpen: boolean;
  wishlistCount: number;
  onOpenMenu: () => void;
  onToggleSearch: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
}

/**
 * The top bar itself — Dior-style: hamburger on the left, centred logo,
 * search / wishlist / cart on the right.
 */
export function HeaderBar({
  company,
  visible,
  menuOpen,
  searchOpen,
  wishlistCount,
  onOpenMenu,
  onToggleSearch,
  onOpenWishlist,
  onOpenCart,
}: HeaderBarProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <header className="border-b border-gray-200 bg-white">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12">
          {/* Left: hamburger */}
          <div className="justify-self-start">
            <button
              className="inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
              onClick={onOpenMenu}
              aria-label="Open the menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          {/* Centre: logo (image or name, both from the company profile) */}
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

          {/* Right: search, wishlist, cart */}
          <div className="flex items-center gap-0.5 justify-self-end sm:gap-1">
            <button
              onClick={onToggleSearch}
              className="inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={onOpenWishlist}
              className="relative inline-flex h-10 w-10 items-center justify-center text-gray-800 transition-colors hover:text-black"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primarymain text-[9px] font-bold text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </button>

            <CartIcon onClick={onOpenCart} />
          </div>
        </div>
      </header>
    </div>
  );
}
