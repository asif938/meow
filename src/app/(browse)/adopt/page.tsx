import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Browse } from "@/components/browse";
import { parseFilters } from "@/lib/queries";
import { RULES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Adopt a cat",
  description: "Kittens, adult and senior cats waiting for a forever home in Bangladesh. Adopt from owners and verified shelters.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdoptPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Browse
      title="Adopt a cat"
      description="Adoption listings are free — owners may ask a small rehoming fee to cover vaccines."
      basePath="/adopt"
      fixedType="adoption"
      filters={parseFilters(sp)}
      searchParams={sp}
      banner={
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
          <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Adoption is about the right match, not money. Rehoming fees are capped at ৳{RULES.maxAdoptionFee}. If someone
            asks for more, please report it. <Link href="/safety#adoption" className="font-semibold underline">Adoption guidelines</Link>
          </p>
        </div>
      }
    />
  );
}
