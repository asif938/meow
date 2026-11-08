import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Button, Input, Label, Select, buttonClass } from "@/components/ui";
import { CAT_BREEDS, DIVISIONS, SORTS } from "@/lib/constants";
import type { ListingFilters } from "@/lib/queries";
import type { Category, ListingType } from "@/db/types";
import { AutoSubmitSelect } from "./auto-submit-select";
import { BottomSheet } from "./bottom-sheet";

type Props = {
  basePath: string;
  filters: ListingFilters;
  categories: Category[];
  fixedType?: ListingType;
  hideCategory?: boolean;
};

/**
 * Plain GET form: every filter lives in the URL query string, so results are
 * shareable and the page works without JavaScript.
 */
function FilterFields({ filters, categories, fixedType, hideCategory }: Omit<Props, "basePath">) {
  const type = fixedType ?? filters.type;
  const isCat = type === "cat" || type === "adoption";
  const relevant = categories.filter((c) => !type || c.listingType === type);
  const districts = filters.division ? DIVISIONS[filters.division] ?? [] : Object.values(DIVISIONS).flat();

  return (
    <div className="space-y-4">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      {!fixedType && (
        <div>
          <Label htmlFor="f-type">Listing type</Label>
          <Select id="f-type" name="type" defaultValue={filters.type ?? ""}>
            <option value="">All</option>
            <option value="cat">Cats for sale</option>
            <option value="adoption">Adoption</option>
            <option value="supply">Supplies</option>
          </Select>
        </div>
      )}

      {!hideCategory && relevant.length > 0 && (
        <div>
          <Label htmlFor="f-cat">Category</Label>
          <Select id="f-cat" name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {relevant
              .filter((c) => !c.parentId)
              .map((parent) => (
                <optgroup key={parent.id} label={parent.name}>
                  <option value={parent.slug}>All {parent.name}</option>
                  {relevant
                    .filter((c) => c.parentId === parent.id)
                    .map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </Select>
        </div>
      )}

      {isCat && (
        <>
          <div>
            <Label htmlFor="f-breed">Breed</Label>
            <Select id="f-breed" name="breed" defaultValue={filters.breed ?? ""}>
              <option value="">Any breed</option>
              {CAT_BREEDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-gender">Gender</Label>
            <Select id="f-gender" name="gender" defaultValue={filters.gender ?? ""}>
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="vaccinated" value="1" defaultChecked={filters.vaccinated} className="h-4 w-4 accent-brand-500" />
            Vaccinated only
          </label>
        </>
      )}

      {type === "supply" && (
        <div>
          <Label htmlFor="f-cond">Condition</Label>
          <Select id="f-cond" name="condition" defaultValue={filters.condition ?? ""}>
            <option value="">New & used</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </Select>
        </div>
      )}

      {type !== "adoption" && (
        <div>
          <Label>Price (৳)</Label>
          <div className="flex items-center gap-2">
            <Input name="min" type="number" min={0} placeholder="Min" defaultValue={filters.minPrice} aria-label="Minimum price" />
            <span className="text-muted">–</span>
            <Input name="max" type="number" min={0} placeholder="Max" defaultValue={filters.maxPrice} aria-label="Maximum price" />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="f-div">Division</Label>
        <Select id="f-div" name="division" defaultValue={filters.division ?? ""}>
          <option value="">All of Bangladesh</option>
          {Object.keys(DIVISIONS).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="f-dist">District</Label>
        <Select id="f-dist" name="district" defaultValue={filters.district ?? ""}>
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="verified" value="1" defaultChecked={filters.verified} className="h-4 w-4 accent-brand-500" />
        Verified sellers only
      </label>
    </div>
  );
}

export function Filters(props: Props) {
  const activeCount = [
    props.filters.category,
    props.filters.breed,
    props.filters.gender,
    props.filters.vaccinated,
    props.filters.condition,
    props.filters.minPrice,
    props.filters.maxPrice,
    props.filters.division,
    props.filters.district,
    props.filters.verified,
    !props.fixedType && props.filters.type,
  ].filter((v) => v !== undefined && v !== false && v !== "").length;

  const actions = (
    <div className="flex gap-2 pt-2">
      <Button type="submit" className="flex-1">Apply filters</Button>
      <Link href={props.filters.q ? `${props.basePath}?q=${encodeURIComponent(props.filters.q)}` : props.basePath} className={buttonClass("outline")}>
        Reset
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <form action={props.basePath} className="sticky top-24 rounded-[var(--radius-card)] border border-line bg-white p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </p>
          <FilterFields {...props} />
          {actions}
        </form>
      </aside>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <BottomSheet label={`Filters${activeCount > 0 ? ` (${activeCount})` : ""}`} title="Filters">
          <form action={props.basePath}>
            <FilterFields {...props} />
            {actions}
          </form>
        </BottomSheet>
      </div>
    </>
  );
}

export function SortSelect({ value }: { value?: string }) {
  return (
    <AutoSubmitSelect name="sort" defaultValue={value ?? "newest"} aria-label="Sort listings">
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
      <option value="relevance">Best match</option>
    </AutoSubmitSelect>
  );
}
