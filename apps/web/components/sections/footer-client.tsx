"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyProfile } from "@/types/company-profile";
import type { Category } from "@/types/category";

interface SocialLink {
  label: string;
  url: string;
}

interface FooterClientProps {
  company: CompanyProfile | null;
  categories: Category[];
  socialLinks: SocialLink[];
}

const LINK_CLASS =
  "text-[15px] text-gray-500 transition-colors hover:text-gray-900";
const HEADING_CLASS = "font-serif text-[22px] text-gray-900";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={HEADING_CLASS}>{children}</h3>;
}

function LinkList({ links }: { links: { label: string; href: string }[] }) {
  return (
    <ul className="mt-5 space-y-3.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className={LINK_CLASS}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Dior-style footer: serif link columns over a bottom row with
 * "Follow Us" text socials on the left, the big logo centred, and
 * the copyright on the right. All content is dynamic — categories
 * from the catalogue, contact details and socials from the company
 * profile.
 */
export function FooterClient({
  company,
  categories,
  socialLinks,
}: FooterClientProps) {
  const [contactOpen, setContactOpen] = React.useState(false);
  const companyName = company?.companyName || "Your Brand";

  const shopLinks = [
    { label: "All Products", href: "/products" },
    ...categories.slice(0, 5).map((c) => ({
      label: c.name,
      href: `/products?categoryId=${c.id}`,
    })),
  ];

  const hasContactDetails =
    !!company?.phoneNumber || !!company?.email || !!company?.address;

  return (
    <footer className="border-t border-gray-200 bg-white text-gray-900">
      <div className=" pb-10 pt-16 mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        {/* Link columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Shop — live categories */}
          <div>
            <ColumnHeading>Shop</ColumnHeading>
            <LinkList links={shopLinks} />
          </div>

          {/* Client Services — Contact expands to the profile details */}
          <div>
            <ColumnHeading>Client Services</ColumnHeading>
            <ul className="mt-5 space-y-3.5">
              {hasContactDetails && (
                <li>
                  <button
                    onClick={() => setContactOpen((v) => !v)}
                    className={cn(
                      LINK_CLASS,
                      "inline-flex items-center gap-2",
                    )}
                    aria-expanded={contactOpen}
                  >
                    Contact
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        contactOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      contactOpen
                        ? "mt-3 grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="space-y-2 overflow-hidden text-[15px] text-gray-500">
                      {company?.address && <p>{company.address}</p>}
                      {company?.phoneNumber && (
                        <p>
                          <a
                            href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`}
                            className="hover:text-gray-900"
                          >
                            {company.phoneNumber}
                          </a>
                        </p>
                      )}
                      {company?.email && (
                        <p>
                          <a
                            href={`mailto:${company.email}`}
                            className="hover:text-gray-900"
                          >
                            {company.email}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )}
              <li>
                <Link href="/contact" className={LINK_CLASS}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className={LINK_CLASS}>
                  Get in Touch
                </Link>
              </li>
            </ul>
          </div>

          {/* The company */}
          <div>
            <ColumnHeading>{companyName}</ColumnHeading>
            <LinkList
              links={[
                { label: "Home", href: "/" },
                { label: "About Us", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: "/contact" },
              ]}
            />
          </div>

          {/* Legal */}
          <div>
            <ColumnHeading>Legal Terms</ColumnHeading>
            <LinkList
              links={[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ]}
            />
          </div>
        </div>

        {/* Bottom row: Follow Us | logo | copyright */}
        <div className="mt-20 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
          {/* Socials — text links, from the company profile */}
          <div className="order-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:order-1 lg:justify-start">
            {socialLinks.length > 0 && (
              <>
                <span className="text-sm text-gray-400">Follow Us</span>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] text-gray-800 transition-colors hover:text-black"
                  >
                    {social.label}
                  </a>
                ))}
              </>
            )}
          </div>

          {/* Big centred logo */}
          <div className="order-1 text-center lg:order-2">
            <Link href="/" className="inline-flex items-center justify-center">
              {company?.footerLogoKey ? (
                <Image
                  src={company.footerLogoKey}
                  alt={companyName}
                  width={200}
                  height={56}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <span className="font-serif text-5xl tracking-wide text-gray-900">
                  {companyName}
                </span>
              )}
            </Link>
            {company?.companyDescription && (
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                {company.companyDescription}
              </p>
            )}
          </div>

          {/* Copyright + credit */}
          <div className="order-3 text-center lg:text-right">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} {companyName}. All rights
              reserved.
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Designed & Developed by{" "}
              <a
                href="https://nepaltechinnov.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Nepal Tech
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
