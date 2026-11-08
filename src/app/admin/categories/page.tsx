import { db } from "@/db";
import type { Category } from "@/db/types";
import { saveCategoryAction } from "@/actions/admin";
import { Badge, Input, Select, buttonClass } from "@/components/ui";

export default async function AdminCategoriesPage() {
  const all = await db.category.findMany({ orderBy: [{ listingType: "asc" }, { position: "asc" }, { name: "asc" }] });
  const parents = all.filter((c) => !c.parentId);

  return (
    <div className="space-y-6">
      <details className="rounded-2xl border border-line bg-white p-4">
        <summary className="cursor-pointer font-semibold">+ Add category</summary>
        <CategoryForm parents={parents} />
      </details>

      <div className="space-y-2">
        {parents.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white">
            <CategoryRow category={p} parents={parents} />
            {all
              .filter((c) => c.parentId === p.id)
              .map((c) => (
                <div key={c.id} className="border-t border-line pl-6">
                  <CategoryRow category={c} parents={parents} />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ category: c, parents }: { category: Category; parents: Category[] }) {
  return (
    <details className="p-3">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{c.name}</span>
        <span className="text-xs text-muted">/{c.slug}</span>
        <Badge className="capitalize">{c.listingType}</Badge>
        {c.allowedConditions.map((x) => (
          <Badge key={x} tone="gray">{x}</Badge>
        ))}
        {c.businessOnly && <Badge tone="amber">business only</Badge>}
        {c.requiresExpiry && <Badge tone="red">expiry required</Badge>}
        {!c.isActive && <Badge tone="red">hidden</Badge>}
      </summary>
      <CategoryForm category={c} parents={parents} />
    </details>
  );
}

function CategoryForm({ category: c, parents }: { category?: Category; parents: Category[] }) {
  return (
    <form action={saveCategoryAction} className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Input name="name" defaultValue={c?.name} placeholder="Name" required />
      <Input name="nameBn" defaultValue={c?.nameBn ?? ""} placeholder="নাম (Bangla)" />
      <Input name="slug" defaultValue={c?.slug} placeholder="slug (auto)" />
      <Input name="icon" defaultValue={c?.icon ?? ""} placeholder="icon key (e.g. food)" />
      <Select name="parentId" defaultValue={c?.parentId ?? ""}>
        <option value="">— Top level —</option>
        {parents
          .filter((p) => p.id !== c?.id)
          .map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </Select>
      <Select name="listingType" defaultValue={c?.listingType ?? "supply"}>
        <option value="supply">Supply</option>
        <option value="cat">Cat</option>
        <option value="adoption">Adoption</option>
      </Select>
      <Input name="position" type="number" defaultValue={c?.position ?? 0} placeholder="Position" />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1">
          <input type="checkbox" name="allowedConditions" value="new" defaultChecked={c?.allowedConditions.includes("new")} /> New
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" name="allowedConditions" value="used" defaultChecked={c?.allowedConditions.includes("used")} /> Used
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <label className="flex items-center gap-1">
          <input type="checkbox" name="businessOnly" defaultChecked={c?.businessOnly} /> Business only
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" name="requiresExpiry" defaultChecked={c?.requiresExpiry} /> Requires expiry date
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} /> Visible
        </label>
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <button className={buttonClass("primary", "sm")}>{c ? "Save" : "Create"}</button>
      </div>
    </form>
  );
}
