import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClass } from "@/components/ui";

export function Pagination({
  basePath,
  searchParams,
  page,
  pages,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page" || v === undefined) continue;
      sp.set(k, Array.isArray(v) ? v[0] : v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const window = [page - 2, page - 1, page, page + 1, page + 2].filter((p) => p >= 1 && p <= pages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className={buttonClass("outline", "icon")} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {window.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={buttonClass(p === page ? "primary" : "ghost", "icon")}
        >
          {p}
        </Link>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className={buttonClass("outline", "icon")} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
