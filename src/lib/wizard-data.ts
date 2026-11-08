import "server-only";
import { getCategories, getLocations } from "./queries";
import type { WizardCategory, WizardLocation } from "./wizard-types";

export async function getWizardData() {
  const [cats, locs] = await Promise.all([getCategories(), getLocations()]);
  const categories: WizardCategory[] = cats.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    name: c.name,
    listingType: c.listingType,
    allowedConditions: c.allowedConditions,
    businessOnly: c.businessOnly,
    requiresExpiry: c.requiresExpiry,
  }));
  const locations: WizardLocation[] = locs.map((l) => ({ id: l.id, division: l.division, district: l.district, area: l.area }));
  return { categories, locations };
}
