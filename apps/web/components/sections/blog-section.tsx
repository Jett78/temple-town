"use client";

import { BlogCard } from "@/components/blog-card";
import PrimaryButton from "../ui/primary-button";
import type { Blog as BlogType } from "@/types/blog";
import PageHeader from "../ui/page-header";

export default function BlogSection({ posts }: { posts: BlogType[] }) {
  if (posts.length === 0) return null;

  return (
    <section id="blog" className="py-10 sm:py-16">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <PageHeader
          title="Latest Insights"
          subtitle="Blogs"
          desc="Explore our blog for valuable information and expert perspectives."
        />
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post: BlogType) => (
            <div key={post.id}>
              <BlogCard blog={post} />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <PrimaryButton
            text="View All Posts"
            path="/blog"
            variant="primary"
          />
        </div>
      </div>
    </section>
  );
}
