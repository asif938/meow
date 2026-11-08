import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";
import { RULES } from "@/lib/constants";

export const metadata: Metadata = { title: "Safety tips & guidelines", description: "How to buy, sell and adopt cats safely on Meow." };

export default function SafetyPage() {
  return (
    <ProsePage title="Safety tips & guidelines">
      <h2>Buying a cat</h2>
      <ul>
        <li>Kittens must be at least {RULES.minCatAgeWeeks} weeks old. Ask for the date of birth.</li>
        <li>Ask to see the vaccine card and any vet records. Check eyes, ears, coat and energy.</li>
        <li>Meet in a public place or bring a friend. Visit the cat before paying.</li>
        <li>Never send an advance payment for a cat you haven&apos;t seen in person.</li>
        <li>Keep chats on Meow. If someone pushes you to WhatsApp or asks for advance bKash, be careful.</li>
      </ul>

      <h2 id="adoption">Adoption guidelines</h2>
      <ul>
        <li>Adoption listings have no sale price. An optional rehoming fee (max ৳{RULES.maxAdoptionFee}) may cover vaccines and care.</li>
        <li>Owners screen requests: home type, other pets and experience. Be honest — it&apos;s about the right match.</li>
        <li>Phone numbers are shared only after the owner approves your request.</li>
        <li>If an &ldquo;adoption&rdquo; turns out to be a sale, report it.</li>
      </ul>

      <h2>Selling safely</h2>
      <ul>
        <li>Use your own photos. Copied photos are automatically flagged.</li>
        <li>Describe condition honestly. For food and litter, only sealed, unexpired packs are allowed as used items.</li>
        <li>Collect payment on delivery or in person. Beware of fake &ldquo;payment sent&rdquo; screenshots.</li>
      </ul>

      <h2 id="prohibited">Prohibited items & practices</h2>
      <ul>
        <li>Kittens younger than {RULES.minCatAgeWeeks} weeks, sick animals without disclosure, or mass-bred litters</li>
        <li>Opened or expired food, litter, or medicine</li>
        <li>Medicine and health products from non-verified sellers</li>
        <li>Counterfeit or replica products</li>
        <li>Wild or protected animals, or any animal other than domestic cats</li>
        <li>Selling a cat under the &ldquo;adoption&rdquo; label</li>
      </ul>

      <h2>Report a problem</h2>
      <p>
        Use the &ldquo;Report&rdquo; link on any listing or profile. Our moderators review every report. Accounts involved in scams or animal cruelty are
        banned.
      </p>
    </ProsePage>
  );
}
