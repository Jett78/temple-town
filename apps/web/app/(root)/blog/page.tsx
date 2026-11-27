import { getPageSeoForMetadata } from "@/actions/page-seo-action";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { getBlogs } from "@/actions/blog-action";
import BlogList from "@/components/sections/blog-list";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeoForMetadata("/blog");

  return {
    title: seo?.metaTitle ?? "Blog",
    description: seo?.metaDescription ?? "",
    openGraph: {
      title: seo?.ogTitle ?? seo?.metaTitle ?? "Blog",
      description: seo?.ogDescription ?? seo?.metaDescription ?? "",
      images: seo?.ogImageKey ? [{ url: seo.ogImageKey }] : [],
    },
  };
}

export default async function BlogPage() {
  const posts = await getBlogs({ take: 50, isActive: true });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gray-900 pt-20 pb-14 sm:pt-28 sm:pb-20">
        <div className="relative mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 bg-gray-800 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <BookOpen className="h-3 w-3" />
              Blog
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ideas, insights,
              <span className="block text-gray-500">and inspiration.</span>
            </h1>

            <p className="mt-4 text-base leading-7 text-gray-500">
              Thoughts on development, design, and building products that matter.
            </p>
          </div>
        </div>
      </section>

      <BlogList posts={posts} />
    </div>
  );
}
