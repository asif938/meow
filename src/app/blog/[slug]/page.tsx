import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { BlogCard } from "@/components/blog-card";
import { Badge } from "@/components/ui";
import { cldTransform } from "@/lib/cloudinary";
import { getPostBySlug, getRelatedPosts } from "@/lib/content-queries";
import { isAllowedImageUrl } from "@/lib/images";
import { appUrl } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: appUrl(`/blog/${post.slug}`) },
    openGraph: { title: post.title, description: post.excerpt, type: "article", images: post.coverUrl ? [post.coverUrl] : undefined },
  };
}

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

/** Plain-text body: blank line = new paragraph, "## " = sub-heading, "- " lines = bullet list. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        if (b.split("\n").every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {b.split("\n").map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{b}</p>;
      })}
    </>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, post.category, 3);

  return (
    <article className="container-page max-w-3xl py-8 sm:py-10">
      <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All articles
      </Link>
      <header>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <Badge tone="brand">{post.category}</Badge>
          {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{date.format(post.publishedAt)}</time>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden />{post.readMinutes} min read</span>
        </div>
        <h1 className="text-h1 mt-3 !text-3xl sm:!text-5xl">{post.title}</h1>
        <p className="mt-4 text-lead">{post.excerpt}</p>
        {post.author && <p className="mt-3 text-sm text-muted">By {post.author.name}</p>}
      </header>

      {post.coverUrl && isAllowedImageUrl(post.coverUrl) && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-brand-50">
          <Image src={cldTransform(post.coverUrl, "f_auto,q_auto,c_fill,w_1200,h_675")} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}

      <div className="mt-8 space-y-5 text-[17px] leading-8 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        <Body text={post.content} />
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-8" aria-labelledby="related-title">
          <h2 id="related-title" className="text-h2 mb-5">Keep reading</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.slice(0, 2).map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
