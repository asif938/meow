import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { BlogCard } from "@/components/blog-card";
import { Pagination } from "@/components/pagination";
import { EmptyState, Input, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { listPosts } from "@/lib/content-queries";

export const metadata: Metadata = {
  title: "Blog",
  description: "Cat care advice, adoption guides and safe-buying tips from the Meow team.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() || undefined;
  const category = first(sp.category) || undefined;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const { items, pages, total, categories } = await listPosts({ q, category, page });

  const chip = (value?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value) params.set("category", value);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-h1">The Meow blog</h1>
        <p className="mt-3 text-lead">Practical advice on cat care, adoption and buying safely in Bangladesh.</p>
      </header>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form role="search" action="/blog" className="relative w-full max-w-md">
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="blog-q" className="sr-only">Search articles</label>
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" aria-hidden />
          <Input id="blog-q" name="q" defaultValue={q} placeholder="Search articles…" className="pl-10" />
        </form>
        <nav aria-label="Categories" className="scrollbar-none flex gap-2 overflow-x-auto">
          <Link href={chip()} className={cn(buttonClass(!category ? "primary" : "outline", "sm"), "shrink-0")}>All</Link>
          {categories.map((c) => (
            <Link key={c} href={chip(c)} className={cn(buttonClass(category === c ? "primary" : "outline", "sm"), "shrink-0")}>
              {c}
            </Link>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No articles found" description={q ? `Nothing matched “${q}”. Try a different search.` : "Check back soon for new articles."} />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">{total} article{total === 1 ? "" : "s"}</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
          <Pagination basePath="/blog" searchParams={sp} page={page} pages={pages} />
        </>
      )}
    </div>
  );
}
