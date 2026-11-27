import { getCompanyProfile } from "@/actions/company-profile-action";
import { getNavigationItems } from "@/actions/navigation-action";
import { getCategories } from "@/actions/homepage-actions";
import { getSubcategories } from "@/actions/subcategory-action";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const [company, navItems, categories, subcategories] = await Promise.all([
    getCompanyProfile(),
    getNavigationItems(),
    getCategories(),
    getSubcategories(),
  ]);

  return (
    <NavbarClient
      company={company}
      navItems={navItems}
      categories={categories}
      subcategories={subcategories}
    />
  );
}
