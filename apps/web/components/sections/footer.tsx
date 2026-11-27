import { getCompanyProfile } from "@/actions/company-profile-action";
import { getCategories } from "@/actions/homepage-actions";
import { FooterClient } from "./footer-client";

const SOCIAL_FIELDS = [
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "tiktokUrl", label: "TikTok" },
  { key: "twitterUrl", label: "X" },
] as const;

export async function Footer() {
  const [company, categories] = await Promise.all([
    getCompanyProfile(),
    getCategories(),
  ]);

  const socialLinks = SOCIAL_FIELDS.filter(
    (s) => company?.[s.key] && company[s.key]!.trim() !== "",
  ).map((s) => ({ label: s.label, url: company![s.key]! }));

  const sortedCategories = [...categories]
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <FooterClient
      company={company}
      categories={sortedCategories}
      socialLinks={socialLinks}
    />
  );
}
