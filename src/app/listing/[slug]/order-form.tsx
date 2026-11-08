"use client";

import { useActionState, useState } from "react";
import { Truck } from "lucide-react";
import { createOrderAction } from "@/actions/orders";
import { Button, Input, Label, Select, Textarea } from "@/components/ui";
import { FormMessage, SubmitButton } from "@/components/submit-button";
import { formatBDT } from "@/lib/utils";

const DISTRICTS = ["Dhaka", "Chattogram", "Gazipur", "Narayanganj", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Cumilla", "Other"];

export function OrderForm({
  listingId,
  price,
  stock,
  defaultName,
  defaultPhone,
}: {
  listingId: string;
  price: number;
  stock: number;
  defaultName: string;
  defaultPhone: string;
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [state, action] = useActionState(createOrderAction, undefined);

  if (state?.ok) return <FormMessage state={state} />;

  if (!open) {
    return (
      <div id="order">
        <Button variant="teal" size="lg" className="w-full" onClick={() => setOpen(true)}>
          <Truck className="h-5 w-5" /> Order — Cash on delivery
        </Button>
      </div>
    );
  }

  return (
    <form id="order" action={action} className="space-y-3 rounded-2xl bg-stone-50 p-4">
      <p className="font-semibold">Cash on delivery</p>
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <Label htmlFor="o-qty">Quantity</Label>
        <Select id="o-qty" name="quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {Array.from({ length: Math.min(stock, 10) }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="o-name">Name</Label>
          <Input id="o-name" name="name" required defaultValue={defaultName} />
        </div>
        <div>
          <Label htmlFor="o-phone">Phone</Label>
          <Input id="o-phone" name="phone" required inputMode="tel" defaultValue={defaultPhone} placeholder="01XXXXXXXXX" />
        </div>
      </div>
      <div>
        <Label htmlFor="o-district">District</Label>
        <Select id="o-district" name="district" required defaultValue="Dhaka">
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="o-line">Delivery address</Label>
        <Textarea id="o-line" name="line" required className="min-h-16" placeholder="House, road, area" />
      </div>
      <div>
        <Label htmlFor="o-note">Note (optional)</Label>
        <Input id="o-note" name="note" />
      </div>
      <p className="flex justify-between border-t border-line pt-3 text-sm">
        <span>Total (excl. delivery)</span>
        <span className="font-bold">{formatBDT(price * qty)}</span>
      </p>
      <FormMessage state={state} />
      <SubmitButton variant="teal" className="w-full">Place order</SubmitButton>
    </form>
  );
}
