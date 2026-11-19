export type Faq = { q: string; a: string };

/** Shared by the home page FAQ section and the /help page. */
export const FAQS: Faq[] = [
  {
    q: "Is it safe to buy a cat on Meow?",
    a: "Every cat listing must include health and vaccination details, and kittens under 8 weeks are not allowed. Look for the verified badge, ask the seller for vaccine records, and always meet in a public place or at the seller's home before paying.",
  },
  {
    q: "How does adoption work?",
    a: "Send an adoption request with a short note about your home and experience. The owner reviews it and approves or declines. Their phone number is only shared after approval, and the listing is marked as adopted once the handover is complete.",
  },
  {
    q: "What does the verified badge mean?",
    a: "Verified sellers have confirmed their phone number and submitted an NID, trade licence or organisation document that our team has checked. Verified shops are also the only sellers who can offer cash-on-delivery orders.",
  },
  {
    q: "How do I pay for supplies?",
    a: "New supplies from verified shops can be ordered with cash on delivery. Stock is reserved when you order, and the order moves from pending to confirmed, shipped and delivered. You can cancel while it is still pending.",
  },
  {
    q: "Is posting an ad free?",
    a: "Yes. Posting is free for individuals, shelters and shops. Verify your phone number, fill in the 5-step form with clear photos, and our moderators review new listings before they go live.",
  },
  {
    q: "How do I report a suspicious listing or user?",
    a: "Use the report button on any listing or seller profile. Our team reviews every report and can remove listings or ban accounts. For anything urgent, contact us through the Contact page.",
  },
];
