import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Browse } from "@/components/browse";
import { getCategories, parseFilters } from "@/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function findCategory(slug: string) {
  const all = await getCategories();
  return all.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await findCategory((await params).slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: `${category.name} listings on Meow — Bangladesh's cat marketplace.` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await findCategory(slug);
  if (!category) notFound();

  return (
    <Browse
      title={category.name}
      description={category.businessOnly ? "Sold by verified businesses only." : undefined}
      basePath={`/category/${slug}`}
      fixedType={category.listingType}
      hideCategory
      filters={{ ...parseFilters(sp), category: slug }}
      searchParams={sp}
    />
  );
}
