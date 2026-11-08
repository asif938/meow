"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, HeartHandshake, Loader2, Lock, Cat, ShoppingBag } from "lucide-react";
import { saveListingAction } from "@/actions/listings";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { CAT_BREEDS, RULES } from "@/lib/constants";
import { cn, formatAge, formatBDT } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";
import { emptyWizard, type WizardCategory, type WizardLocation, type WizardValues } from "@/lib/wizard-types";

const STEPS = ["Type", "Details", "Photos", "Price & location", "Review"];

export function ListingWizard({
  categories,
  locations,
  caps,
  uploadsEnabled,
  initial,
  listingId,
}: {
  categories: WizardCategory[];
  locations: WizardLocation[];
  caps: { isBusiness: boolean; isVerifiedSeller: boolean; isPhoneVerified: boolean };
  uploadsEnabled: boolean;
  initial?: WizardValues;
  listingId?: string;
}) {
  const router = useRouter();
  const editing = Boolean(listingId);
  const [step, setStep] = useState(editing ? 1 : 0);
  const [v, setV] = useState<WizardValues>(initial ?? emptyWizard);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [division, setDivision] = useState(() => locations.find((l) => l.id === v.locationId)?.division ?? "");
  const [district, setDistrict] = useState(() => locations.find((l) => l.id === v.locationId)?.district ?? "");

  const set = <K extends keyof WizardValues>(k: K, val: WizardValues[K]) => setV((prev) => ({ ...prev, [k]: val }));
  const isCatType = v.type === "cat" || v.type === "adoption";

  const typeCategories = useMemo(() => categories.filter((c) => c.listingType === v.type), [categories, v.type]);
  const category = categories.find((c) => c.id === v.categoryId);
  const divisions = [...new Set(locations.map((l) => l.division))];
  const districts = [...new Set(locations.filter((l) => l.division === division).map((l) => l.district))];
  const areas = locations.filter((l) => l.division === division && l.district === district);

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!v.type) return "Choose what you're posting.";
      if (v.type === "supply" && !v.condition) return "Choose new or used.";
    }
    if (s === 1) {
      if (!v.categoryId) return "Choose a category.";
      if (v.title.trim().length < 5) return "Title must be at least 5 characters.";
      if (v.description.trim().length < 20) return "Description must be at least 20 characters.";
      if (isCatType) {
        if (!v.breed) return "Choose a breed.";
        if (!v.ageMonths || Number(v.ageMonths) < RULES.minCatAgeMonths) return `Cats must be at least ${RULES.minCatAgeWeeks} weeks (2 months) old.`;
        if (!v.gender) return "Choose gender.";
        if (v.healthNote.trim().length < 10) return "Health information is required.";
      }
      if (category?.requiresExpiry && !v.expiryDate) return "Expiry date is required for this category.";
      if (category?.requiresExpiry && v.condition === "used" && !v.isSealed) return "Used food/litter must be sealed and unopened.";
    }
    if (s === 2) {
      const min = v.type === "supply" ? RULES.minSupplyPhotos : RULES.minCatPhotos;
      if (v.images.length < min) return `Add at least ${min} photo${min > 1 ? "s" : ""}.`;
    }
    if (s === 3) {
      if (v.type !== "adoption" && (!v.price || Number(v.price) < 1)) return "Enter a price.";
      if (v.type === "adoption" && Number(v.adoptionFee) > RULES.maxAdoptionFee) return `Rehoming fee is capped at ৳${RULES.maxAdoptionFee}.`;
      if (!v.locationId) return "Choose your location.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    setError(err);
    if (!err) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit(asDraft: boolean) {
    setError(null);
    const payload: Record<string, unknown> = {
      type: v.type,
      categoryId: v.categoryId,
      title: v.title,
      description: v.description,
      locationId: v.locationId,
      videoUrl: v.videoUrl,
      images: v.images,
      asDraft,
    };
    if (isCatType) {
      Object.assign(payload, {
        breed: v.breed,
        ageMonths: v.ageMonths,
        gender: v.gender,
        color: v.color,
        vaccinated: v.vaccinated,
        vaccineNote: v.vaccineNote,
        neutered: v.neutered,
        healthNote: v.healthNote,
      });
    }
    if (v.type === "cat") Object.assign(payload, { price: v.price, isNegotiable: v.isNegotiable });
    if (v.type === "adoption") Object.assign(payload, { adoptionFee: v.adoptionFee || 0 });
    if (v.type === "supply") {
      Object.assign(payload, {
        condition: v.condition,
        brand: v.brand,
        price: v.price,
        isNegotiable: v.isNegotiable,
        stock: v.condition === "new" ? v.stock : 1,
        expiryDate: v.expiryDate || undefined,
        conditionNote: v.conditionNote,
        isSealed: v.isSealed,
      });
    }

    startTransition(async () => {
      const res = await saveListingAction(payload, listingId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/dashboard?saved=${res.status}`);
      router.refresh();
    });
  }

  const blocked =
    !caps.isPhoneVerified ? (
      <Alert tone="amber" className="mb-6">
        You need a verified phone number to post.{" "}
        <Link href="/verify?next=/sell/new" className="font-semibold underline">Verify now</Link>
      </Alert>
    ) : null;

  return (
    <div>
      {blocked}
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-1 overflow-x-auto text-xs font-medium sm:text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full",
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-500 text-white" : "bg-stone-100 text-muted",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn("hidden sm:inline", i === step ? "text-ink" : "text-muted")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-line sm:w-8" />}
          </li>
        ))}
      </ol>

      <div className="rounded-[var(--radius-card)] border border-line bg-white p-5 sm:p-8">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold">What are you posting?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <TypeCard
                active={v.type === "cat"}
                onClick={() => setV({ ...v, type: "cat", condition: "", categoryId: "" })}
                icon={<Cat className="h-6 w-6" />}
                title="Sell a cat"
                desc="Requires ID verification"
                locked={!caps.isVerifiedSeller}
              />
              <TypeCard
                active={v.type === "adoption"}
                onClick={() => setV({ ...v, type: "adoption", condition: "", categoryId: "" })}
                icon={<HeartHandshake className="h-6 w-6" />}
                title="Put up for adoption"
                desc="Rehome a cat — no sale price"
              />
              <TypeCard
                active={v.type === "supply"}
                onClick={() => setV({ ...v, type: "supply", categoryId: "" })}
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Sell supplies"
                desc="Food, litter, toys & more"
              />
            </div>
            {v.type === "cat" && !caps.isVerifiedSeller && (
              <Alert tone="amber">
                To sell cats you need an approved NID verification.{" "}
                <Link href="/dashboard/shop" className="font-semibold underline">Get verified</Link> — you can still save a draft.
              </Alert>
            )}
            {v.type === "supply" && (
              <div>
                <p className="mb-2 text-sm font-medium">Condition</p>
                <div className="grid grid-cols-2 gap-3">
                  <TypeCard
                    active={v.condition === "used"}
                    onClick={() => setV({ ...v, condition: "used", categoryId: "" })}
                    title="Used"
                    desc="Pre-loved items from your home"
                  />
                  <TypeCard
                    active={v.condition === "new"}
                    onClick={() => setV({ ...v, condition: "new", categoryId: "" })}
                    title="New"
                    desc="Verified business sellers only"
                    locked={!caps.isBusiness}
                  />
                </div>
                {v.condition === "new" && !caps.isBusiness && (
                  <Alert tone="amber" className="mt-3">
                    New products can only be listed by approved shops.{" "}
                    <Link href="/dashboard/shop" className="font-semibold underline">Apply as a business seller</Link>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold">Details</h2>
            <Field label="Category" htmlFor="w-cat">
              <Select id="w-cat" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Choose a category</option>
                {typeCategories
                  .filter((c) => !c.parentId)
                  .map((parent) => {
                    const children = typeCategories.filter((c) => c.parentId === parent.id);
                    const usable = (c: WizardCategory) =>
                      (!c.businessOnly || caps.isBusiness) &&
                      (v.type !== "supply" || !c.allowedConditions.length || c.allowedConditions.includes(v.condition as "new" | "used"));
                    return (
                      <optgroup key={parent.id} label={parent.name}>
                        {(children.length ? children : [parent]).map((c) => (
                          <option key={c.id} value={c.id} disabled={!usable(c)}>
                            {c.name}
                            {c.businessOnly || parent.businessOnly ? " (business only)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
              </Select>
            </Field>
            <Field label="Title" htmlFor="w-title" hint="e.g. “Playful Persian kitten, 3 months, vaccinated”">
              <Input id="w-title" value={v.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
            </Field>

            {isCatType && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Breed" htmlFor="w-breed">
                  <Select id="w-breed" value={v.breed} onChange={(e) => set("breed", e.target.value)}>
                    <option value="">Choose breed</option>
                    {CAT_BREEDS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Age (months)" htmlFor="w-age" hint={v.ageMonths ? formatAge(Number(v.ageMonths)) : "Minimum 2 months (8 weeks)"}>
                  <Input id="w-age" type="number" min={RULES.minCatAgeMonths} max={300} value={v.ageMonths} onChange={(e) => set("ageMonths", e.target.value)} />
                </Field>
                <Field label="Gender" htmlFor="w-gender">
                  <Select id="w-gender" value={v.gender} onChange={(e) => set("gender", e.target.value as WizardValues["gender"])}>
                    <option value="">Choose</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </Field>
                <Field label="Color" htmlFor="w-color">
                  <Input id="w-color" value={v.color} onChange={(e) => set("color", e.target.value)} placeholder="e.g. White, orange tabby" />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={v.vaccinated} onChange={(e) => set("vaccinated", e.target.checked)} />
                  Vaccinated
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={v.neutered} onChange={(e) => set("neutered", e.target.checked)} />
                  Neutered / spayed
                </label>
                <Field label="Vaccine details" htmlFor="w-vacc" className="sm:col-span-2" hint="Which vaccines and when (e.g. Tricat 1st dose 12 Aug, Rabies due Nov)">
                  <Input id="w-vacc" value={v.vaccineNote} onChange={(e) => set("vaccineNote", e.target.value)} />
                </Field>
                <Field label="Health information" htmlFor="w-health" className="sm:col-span-2" hint="Deworming, vet checkups, any conditions. Required.">
                  <Textarea id="w-health" value={v.healthNote} onChange={(e) => set("healthNote", e.target.value)} className="min-h-20" />
                </Field>
              </div>
            )}

            {v.type === "supply" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand (optional)" htmlFor="w-brand">
                  <Input id="w-brand" value={v.brand} onChange={(e) => set("brand", e.target.value)} />
                </Field>
                {v.condition === "new" && (
                  <Field label="Stock quantity" htmlFor="w-stock">
                    <Input id="w-stock" type="number" min={1} value={v.stock} onChange={(e) => set("stock", e.target.value)} />
                  </Field>
                )}
                {category?.requiresExpiry && (
                  <Field label="Expiry date" htmlFor="w-exp" hint="Required for food & medicine">
                    <Input id="w-exp" type="date" value={v.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
                  </Field>
                )}
                {category?.requiresExpiry && v.condition === "used" && (
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={v.isSealed} onChange={(e) => set("isSealed", e.target.checked)} />
                    I confirm the package is sealed and unopened
                  </label>
                )}
                {v.condition === "used" && (
                  <Field label="Condition note" htmlFor="w-cnote" className="sm:col-span-2" hint="How old is it? Any wear or damage?">
                    <Input id="w-cnote" value={v.conditionNote} onChange={(e) => set("conditionNote", e.target.value)} />
                  </Field>
                )}
              </div>
            )}

            <Field label="Description" htmlFor="w-desc">
              <Textarea id="w-desc" value={v.description} maxLength={5000} onChange={(e) => set("description", e.target.value)} placeholder={isCatType ? "Personality, diet, litter trained? Why are you rehoming?" : "What's included, size, reason for selling…"} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold">Photos</h2>
            <p className="text-sm text-muted">
              {v.type === "supply" ? `At least ${RULES.minSupplyPhotos} photos` : "At least 1 photo"}, up to {RULES.maxPhotos}. Use your own photos — copied images are flagged.
            </p>
            <ImageUploader value={v.images} onChange={(imgs) => set("images", imgs)} max={RULES.maxPhotos} uploadsEnabled={uploadsEnabled} />
            <Field label="Video link (optional)" htmlFor="w-video" hint="YouTube or Facebook video URL">
              <Input id="w-video" type="url" value={v.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/…" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold">Price & location</h2>
            {v.type === "adoption" ? (
              <Field label="Rehoming fee (৳, optional)" htmlFor="w-fee" hint={`Covers vaccines/care. Maximum ৳${RULES.maxAdoptionFee}. Most adoptions are free.`}>
                <Input id="w-fee" type="number" min={0} max={RULES.maxAdoptionFee} value={v.adoptionFee} onChange={(e) => set("adoptionFee", e.target.value)} />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price (৳)" htmlFor="w-price">
                  <Input id="w-price" type="number" min={1} value={v.price} onChange={(e) => set("price", e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 self-end pb-3 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={v.isNegotiable} onChange={(e) => set("isNegotiable", e.target.checked)} />
                  Price is negotiable
                </label>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Division" htmlFor="w-div">
                <Select
                  id="w-div"
                  value={division}
                  onChange={(e) => {
                    setDivision(e.target.value);
                    setDistrict("");
                    set("locationId", "");
                  }}
                >
                  <option value="">Choose</option>
                  {divisions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </Field>
              <Field label="District" htmlFor="w-dist">
                <Select
                  id="w-dist"
                  value={district}
                  disabled={!division}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    const only = locations.filter((l) => l.division === division && l.district === e.target.value);
                    set("locationId", only.length === 1 ? only[0].id : (only.find((l) => !l.area)?.id ?? ""));
                  }}
                >
                  <option value="">Choose</option>
                  {districts.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Area" htmlFor="w-area">
                <Select id="w-area" value={v.locationId} disabled={!district} onChange={(e) => set("locationId", e.target.value)}>
                  <option value="">Choose</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.area ?? `All of ${a.district}`}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold">Review</h2>
            <div className="flex gap-4">
              {v.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.images[0].url} alt="" className="h-28 w-28 shrink-0 rounded-2xl object-cover" />
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-semibold">{v.title}</p>
                <p className="font-display text-xl font-bold text-brand-600">
                  {v.type === "adoption" ? (Number(v.adoptionFee) ? `Rehoming fee ${formatBDT(Number(v.adoptionFee))}` : "Free adoption") : formatBDT(Number(v.price || 0))}
                </p>
                <p className="text-sm text-muted">
                  {category?.name} · {locations.find((l) => l.id === v.locationId)?.district}
                  {isCatType && ` · ${v.breed} · ${formatAge(Number(v.ageMonths || 0))}`}
                </p>
                <p className="text-sm text-muted">{v.images.length} photo(s)</p>
              </div>
            </div>
            <Alert tone="blue">
              {v.type === "cat"
                ? "Cat sale listings are reviewed by our team for animal welfare before going live (usually within a few hours)."
                : "Your listing goes live right away if it passes our automatic checks; otherwise a moderator will review it."}
            </Alert>
            <p className="text-xs text-muted">
              By publishing you confirm this listing follows our <Link href="/terms" className="underline">Terms</Link> and{" "}
              <Link href="/safety#prohibited" className="underline">prohibited items list</Link>.
            </p>
          </div>
        )}

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || pending}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" disabled={pending || !v.type || !v.categoryId} onClick={() => submit(true)}>
                Save draft
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => submit(false)} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  desc,
  locked,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  desc: string;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex cursor-pointer flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition",
        active ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-200",
      )}
    >
      {icon && <span className="text-brand-600">{icon}</span>}
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-muted">{desc}</span>
      {locked && <Lock className="absolute right-3 top-3 h-4 w-4 text-muted" aria-label="Requires verification" />}
    </button>
  );
}
