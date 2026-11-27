import type { CompanyProfile } from "@/types/company-profile";
import type { Category, Subcategory } from "@/types/category";

export interface NavItem {
  key: string;
  label: string;
  path: string;
}

export interface NavbarClientProps {
  company: CompanyProfile | null;
  navItems: NavItem[];
  categories: Category[];
  subcategories: Subcategory[];
}

/** The signed-in user shown in the sidebar footer (null when signed out). */
export interface NavbarUser {
  name: string;
  email: string;
}

/** One "Discover similar…" card in the search panel. */
export interface DiscoverItem {
  key: string;
  title: string;
  subtitle: string;
  href: string;
}
