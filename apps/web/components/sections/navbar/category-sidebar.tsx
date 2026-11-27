"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  User,
  LogOut,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PanelBackdrop } from "./panel-backdrop";
import type { CompanyProfile } from "@/types/company-profile";
import type { Category, Subcategory } from "@/types/category";
import type { NavItem, NavbarUser } from "./types";

interface CategorySidebarProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  subcategoriesByCategory: Map<string, Subcategory[]>;
  navItems: NavItem[];
  pathname: string;
  company: CompanyProfile | null;
  user: NavbarUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

const ROW_CLASS =
  "flex w-full items-center justify-between py-[15px] text-left text-[15px] text-gray-800 transition-colors hover:text-black";

/**
 * The hamburger panel: a floating card over a blurred backdrop.
 * Level 0 lists the live categories (then the page links); tapping a
 * category with subcategories slides to level 1, whose header is the
 * back arrow + category name, sliding in with the pane like Dior.
 * The footer carries the account actions and the company contact
 * details from the company profile.
 */
export function CategorySidebar({
  open,
  onClose,
  categories,
  subcategoriesByCategory,
  navItems,
  pathname,
  company,
  user,
  onLogin,
  onLogout,
}: CategorySidebarProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);

  // However the panel closes, keep the drill-down visible during the
  // slide-out, then reset it so the next open starts at the top level.
  React.useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => setSelectedCategory(null), 400);
      return () => window.clearTimeout(t);
    }
  }, [open ]);

  React.useEffect(() => {
    setSelectedCategory(null);
  }, [pathname]);

  const selectedSubcategories = selectedCategory
    ? subcategoriesByCategory.get(selectedCategory.id) || []
    : [];

  return (
    <>
      <PanelBackdrop open={open} onClose={onClose} />

      <aside
        className={cn(
          "fixed bottom-2 left-2 top-2 z-[80] flex w-[min(92vw,430px)] flex-col overflow-hidden rounded-2xl bg-[#f8f8f8] shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          open ? "translate-x-0" : "-translate-x-[calc(100%+16px)]",
        )}
        aria-hidden={!open}
      >
        {/* Close */}
        <div className="px-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 py-5 text-sm text-gray-800 transition-colors hover:text-black"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
            Close
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
              {categories.map((category) => {
                const subs = subcategoriesByCategory.get(category.id) || [];
                return subs.length > 0 ? (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category)}
                    className={ROW_CLASS}
                  >
                    {category.name}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ) : (
                  <Link
                    key={category.id}
                    href={`/products?categoryId=${category.id}`}
                    onClick={onClose}
                    className={ROW_CLASS}
                  >
                    {category.name}
                  </Link>
                );
              })}

              {categories.length > 0 && (
                <div className="my-3 h-px bg-gray-300/60" />
              )}

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onClose}
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

            {/* Level 1: subcategories of the selected category. Like
                Dior, the pane header is the back arrow + category name
                and slides in together with the pane. */}
            <div className="h-full w-full shrink-0 overflow-y-auto px-6 py-2">
              {selectedCategory && (
                <>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="flex w-full items-center gap-1.5 py-[15px] text-left text-[15px] font-medium text-gray-900"
                    aria-label={`Back to categories from ${selectedCategory.name}`}
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    {selectedCategory.name}
                  </button>
                  <Link
                    href={`/products?categoryId=${selectedCategory.id}`}
                    onClick={onClose}
                    className="block py-[15px] text-[15px] text-gray-800 transition-colors hover:text-black"
                  >
                    All {selectedCategory.name}
                  </Link>
                  {selectedSubcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/products?categoryId=${selectedCategory.id}&subcategoryId=${sub.id}`}
                      onClick={onClose}
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

        {/* Footer: account + contact */}
        <div className="border-t border-gray-300/60 px-6 py-4">
          {user ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4.5 w-4.5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link
                href="/profile/user"
                onClick={onClose}
                className="flex items-center gap-3 py-2 text-[15px] text-gray-800 hover:text-black"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
                My Profile
              </Link>
              <Link
                href="/profile/user/orders"
                onClick={onClose}
                className="flex items-center gap-3 py-2 text-[15px] text-gray-800 hover:text-black"
              >
                <Package className="h-5 w-5" strokeWidth={1.5} />
                My Orders
              </Link>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
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
                onClose();
                onLogin();
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
    </>
  );
}
