/**
 * Blog posts and community reviews used by the home page, /blog and the testimonials section.
 * Imported by scripts/seed.ts. Idempotent: only inserts when the tables are empty.
 */
import type { PrismaClient } from "../src/generated/prisma/client";

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

const POSTS = [
  {
    title: "How to choose a healthy kitten: a 10-point checklist",
    category: "Buying guide",
    cover: img("1561948955-570b270e7c36"),
    excerpt: "Eyes, ears, coat, appetite and paperwork: what to check before you pay for a kitten, and the red flags that mean you should walk away.",
    content: `Bringing a kitten home is a ten-to-fifteen year commitment, so it is worth spending twenty minutes on a proper check before you pay anything.

## What to look at

- Eyes should be bright and clean, with no crust or watery discharge.
- Ears should be pale pink inside, without dark crumbly wax, which can mean ear mites.
- The coat should be soft and even. Bald patches or constant scratching can point to fleas or ringworm.
- The nose and breathing should be clear. Sneezing and noisy breathing are common signs of cat flu.
- The belly should be round but not bloated, and the bottom clean.

## Behaviour and age

A healthy kitten is curious and playful when awake. Choose one that comes towards you rather than hiding. Never take a kitten younger than eight weeks: they still need their mother's milk and have not finished learning from their litter.

## Paperwork and questions

Ask to see the vaccination card and the date of each dose, and ask which food the kitten is eating now so you can keep the same diet for the first weeks. Ask to meet the mother. A seller who is happy to show you the home and the parents is usually a good sign.

## Red flags

Refusing a visit, pressure to pay a deposit before you have seen the kitten, no vaccine record, or a price far below the market for the breed. On Meow, look for the verified badge and the health section on every listing, and report anything that looks wrong.`,
  },
  {
    title: "Adopting a rescued cat: what to expect in the first 30 days",
    category: "Adoption",
    cover: img("1529778873920-4da4926a72c2"),
    excerpt: "A calm room, a slow introduction and a vet visit: a simple plan for helping a rescued cat settle into your home.",
    content: `Rescued cats often arrive nervous. The first month is about patience, routine and letting the cat decide the pace.

## Week 1: a safe room

Set up a quiet room with a litter tray, water, food, a hiding place and a scratching post. Keep the door closed at first so the cat can explore without being overwhelmed. Sit in the room, read aloud or just be present, and let the cat come to you.

## Week 2: widen the world

Once the cat eats well and uses the tray, open the door and let it explore the rest of the home at its own speed. Keep windows and balcony doors secured, because frightened cats can bolt.

## Vet visit

Book a check-up within the first two weeks. Take the vaccine card from the shelter, ask about deworming and flea treatment, and discuss neutering if it has not been done.

## Other pets and children

Introduce other pets slowly, first by scent (swap blankets), then through a door, then face to face with supervision. Teach children to let the cat approach and never to pick it up while it is hiding.

## Be patient

Some cats settle in days, others take weeks. A regular feeding time and gentle play with a feather toy build trust quickly. If you are adopting through Meow, the owner's contact details are shared after your request is approved, so you can ask them any questions about the cat's habits.`,
  },
  {
    title: "Core cat vaccines: what they are and when kittens need them",
    category: "Cat care",
    cover: img("1573865526739-10659fec78a5"),
    excerpt: "A plain-language guide to the vaccines most vets recommend for kittens, and why the dates on a vaccine card matter.",
    content: `Vaccination protects your cat from serious, sometimes fatal, infections. Schedules vary, so always follow your own vet's advice. This is a general guide to what the dates on a vaccine card usually mean.

## The core vaccines

The combined "core" vaccine (often called FVRCP or tricat) protects against feline herpesvirus, calicivirus and panleukopenia. Rabies is the other important one, and it protects people as well as cats.

## A typical kitten timeline

- Around 8 weeks: first combined dose.
- Around 12 weeks: second combined dose.
- Around 16 weeks: third dose in many schedules.
- From about 12 weeks: rabies, then a booster as your vet advises.
- After that, boosters are usually given every year or every three years depending on the vaccine.

## Why the card matters

A kitten that has had only one dose is not yet fully protected. When you buy or adopt a cat, check the date of each dose, the vet's stamp and the batch label. Keep the card safe: boarding places and travel often ask for it.

## Before and after

Only vaccinate healthy kittens, and keep them indoors until your vet says the course is complete. Mild tiredness for a day is normal. Swelling, vomiting or breathing trouble means you should call your vet straight away.`,
  },
  {
    title: "Spotting scams when buying a cat online",
    category: "Safety",
    cover: img("1514888286974-6c03e2ca1dba"),
    excerpt: "Fake listings follow predictable patterns. Learn the warning signs and how to meet sellers safely.",
    content: `Most sellers are honest, but a few fake listings copy photos from other websites to collect deposits. A few habits keep you safe.

## Warning signs

- The price is far lower than the same breed elsewhere.
- The seller will only talk by phone or messaging app and will not let you visit.
- They ask for an advance, a delivery fee or a "reservation" through a mobile wallet before you have seen the cat.
- The photos look professional or appear on other websites when you search for them.
- Their story keeps changing, or they cannot answer simple questions about feeding and vaccines.

## Safer habits

Meet in person, at the seller's home or a public place, and bring a friend. Ask for a short video of the cat moving and responding to its name, and ask for a photo of the vaccine card with today's date written next to it. Pay only after you have handed the cat over.

## Keep conversations on Meow

Messages sent on Meow are visible to our safety team if you report a problem. Our chat warns you when a phone number or link is shared, because moving off the platform is a common first step in a scam.

## Report it

If something feels wrong, use the report button on the listing or the seller's profile. We review every report and can remove listings and ban accounts.`,
  },
  {
    title: "Litter training a kitten in a flat",
    category: "Cat care",
    cover: img("1574158622682-e40e69881006"),
    excerpt: "Most kittens learn in a few days. Here is how to set up the tray, what to do after accidents and which litter to choose.",
    content: `Cats have a natural instinct to bury waste, so litter training is mostly about making the right choice easy.

## Set-up

Use a shallow tray with low sides for a young kitten, filled with two to three centimetres of unscented litter. Place it in a quiet corner away from food and water, and keep it in the same spot. In a small flat, a bathroom or balcony corner works well.

## Training steps

- Put the kitten in the tray after meals, after naps and after play.
- Praise quietly when it uses the tray. Do not shout after accidents.
- Clean accidents with an enzyme cleaner or a vinegar and water mix so the smell does not call the kitten back to the same spot.
- Scoop at least once a day and change the litter completely every week.

## Choosing a litter

Clumping clay is the easiest to scoop. Tofu and paper litters are lighter and flushable in some buildings, but check your building rules first. Avoid heavily scented products, which can put cats off.

## When to ask the vet

If a kitten suddenly stops using the tray, strains, cries while peeing or has diarrhoea for more than a day, see a vet. Stress and illness are the most common causes of sudden changes.`,
  },
  {
    title: "Keeping your cat cool and hydrated through the Bangladeshi summer",
    category: "Cat care",
    cover: img("1592194996308-7b43878e84a6"),
    excerpt: "Hot, humid months are hard on cats, especially long-haired breeds. Simple changes help them stay comfortable.",
    content: `Dhaka summers are hard on everyone, and cats feel it too, particularly Persians, Maine Coons and other long-haired breeds.

## Water first

Keep several bowls of fresh water around the home and change them at least twice a day. Many cats drink more from a ceramic bowl or a small pet fountain. Adding a spoonful of water or wet food to meals also helps.

## Cool resting spots

Cats pick tiles and shade by instinct. A tiled floor, a cooling mat or a damp towel in a shaded corner gives them somewhere to rest. Keep them out of closed cars and rooms with no airflow.

## Grooming

Brush long-haired cats every day during summer to remove loose fur that traps heat. Do not shave a cat unless your vet advises it, because the coat also protects from sunburn.

## Watch for heatstroke

Heavy panting, drooling, a very hot body, weakness or vomiting are emergencies. Move the cat to a cooler place, offer a little water and call your vet immediately.

## Fleas and ticks

Warm, wet weather also brings fleas. Ask your vet for a safe preventive treatment and wash bedding weekly.`,
  },
];

const REVIEWS: { reviewer: string; seller: string; rating: number; comment: string }[] = [
  {
    reviewer: "tanvir@meow.com.bd",
    seller: "shop@meow.com.bd",
    rating: 5,
    comment: "Ordered the Royal Canin kitten food. It arrived sealed with the batch number intact and delivery inside Dhaka was quick. The shop answered all my questions on chat.",
  },
  {
    reviewer: "nusrat@meow.com.bd",
    seller: "shop@meow.com.bd",
    rating: 5,
    comment: "Fair prices on scratchers and collars, and honest about what was in stock. Never pushed me to buy more than I needed.",
  },
  {
    reviewer: "tanvir@meow.com.bd",
    seller: "rescue@meow.com.bd",
    rating: 5,
    comment: "Adopted through Dhaka Cat Rescue. They asked sensible questions about my home, shared the vaccine card and checked in a week later to see how my cat was settling.",
  },
  {
    reviewer: "shop@meow.com.bd",
    seller: "nusrat@meow.com.bd",
    rating: 4,
    comment: "Met at her home to see the kitten. She showed the vaccine card and the mother, and the kitten was exactly as described.",
  },
];

export async function seedContent(db: PrismaClient, users: Record<string, { id: string }>, adminId: string) {
  if ((await db.blogPost.count()) === 0) {
    const start = Date.now();
    await db.blogPost.createMany({
      data: POSTS.map((p, i) => ({
        title: p.title,
        slug: p.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 70),
        excerpt: p.excerpt,
        content: p.content,
        coverUrl: p.cover,
        category: p.category,
        readMinutes: Math.max(2, Math.round(p.content.split(/\s+/).length / 200)),
        isPublished: true,
        publishedAt: new Date(start - i * 3 * 86_400_000),
        authorId: adminId,
      })),
      skipDuplicates: true,
    });
    console.log(`✓ blog posts (+${POSTS.length})`);
  }

  if ((await db.review.count()) === 0) {
    await db.review.createMany({
      data: REVIEWS.map((r) => ({
        reviewerId: users[r.reviewer].id,
        sellerId: users[r.seller].id,
        rating: r.rating,
        comment: r.comment,
      })),
    });
    console.log(`✓ reviews (+${REVIEWS.length})`);
  }
}
