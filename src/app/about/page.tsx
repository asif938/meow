import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "About Meow" };

export default function AboutPage() {
  return (
    <ProsePage title="About Meow">
      <p>
        Meow is a marketplace made for cat people in Bangladesh. In one place you can find a kitten, adopt a rescued cat, and buy everything a
        cat needs — food, litter, toys, health items and accessories — new from verified shops or pre-loved from fellow cat parents.
      </p>
      <h2>What we believe</h2>
      <ul>
        <li><strong>Welfare first.</strong> No kittens under 8 weeks. Health and vaccine information is mandatory on every cat listing.</li>
        <li><strong>Trust is a feature.</strong> Phone verification, ID and trade-license checks, and a visible verified badge.</li>
        <li><strong>Adoption is not a sale.</strong> Adoption listings carry no price — only an optional, capped rehoming fee.</li>
        <li><strong>Reuse is good.</strong> A cat tree or carrier deserves a second home too.</li>
      </ul>
      <h2>Who uses Meow</h2>
      <ul>
        <li>Cat lovers looking to buy or adopt</li>
        <li>Cat owners selling used supplies or rehoming a cat</li>
        <li>Pet shops and brands selling new products</li>
        <li>Rescuers and shelters finding forever homes</li>
      </ul>
      <p>
        Ready to start? <Link href="/sell/new">Post an ad</Link> or <Link href="/adopt">meet cats waiting for a home</Link>.
      </p>
    </ProsePage>
  );
}
