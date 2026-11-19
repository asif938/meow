import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui";
import { isAllowedImageUrl } from "@/lib/images";
import { cldTransform } from "@/lib/cloudinary";

export type BlogCardData = {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  category: string;
  readMinutes: number;
  publishedAt: Date | null;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function BlogCard({ post }: { post: BlogCardData }) {
  const href = `/blog/${post.slug}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-900/5">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] shrink-0 overflow-hidden bg-brand-50">
        {post.coverUrl && isAllowedImageUrl(post.coverUrl) ? (
          <Image
            src={cldTransform(post.coverUrl, "f_auto,q_auto,c_fill,w_800,h_450")}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-brand-300">
            <PawPrint className="h-12 w-12" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Badge tone="brand">{post.category}</Badge>
          {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{date.format(post.publishedAt)}</time>}
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{post.readMinutes} min</span>
        </div>
        <h3 className="line-clamp-2 text-h3">
          <Link href={href} className="hover:text-brand-600">{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-muted">{post.excerpt}</p>
        <Link href={href} className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-semibold text-brand-600">
          Read article <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
