import { useEffect, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Section } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type VehicleItem = { id: string; label: string; date: string | null };

export function VehicleCard() {
  const { profile, user, refreshProfile } = useAuth();
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [itemLabel, setItemLabel] = useState("");
  const [itemDate, setItemDate] = useState("");

  useEffect(() => {
    setAddress(profile?.vehicle_parking_address ?? "");
    setNote(profile?.vehicle_parking_note ?? "");
  }, [profile?.vehicle_parking_address, profile?.vehicle_parking_note]);

  if (!user || !profile?.owns_car) return null;

  const items = profile.vehicle_items ?? [];

  const saveParking = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        vehicle_parking_address: address.trim().slice(0, 160) || null,
        vehicle_parking_note: note.trim().slice(0, 160) || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message || "Couldn't save parking spot");
      return;
    }
    await refreshProfile();
    toast.success("Parking spot saved");
  };

  const addItem = async () => {
    const label = itemLabel.trim().slice(0, 60);
    if (!label) return;
    const next: VehicleItem[] = [
      ...items,
      { id: crypto.randomUUID(), label, date: itemDate || null },
    ];
    const { error } = await supabase
      .from("profiles")
      .update({ vehicle_items: next })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message || "Couldn't add item");
      return;
    }
    await refreshProfile();
    setItemLabel("");
    setItemDate("");
    setAdding(false);
  };

  const removeItem = async (id: string) => {
    const next = items.filter((i) => i.id !== id);
    const { error } = await supabase
      .from("profiles")
      .update({ vehicle_items: next })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message || "Couldn't remove item");
      return;
    }
    await refreshProfile();
  };

  return (
    <Section
      title="Vehicle on file"
      subtitle="Add your car's TUV, insurance and tax dates to keep them off your back."
    >
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Where is it parked?
          </p>
          <div className="space-y-1.5">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={160}
              placeholder="Street, number, city"
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={160}
              placeholder="Note (floor, spot number…)"
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            <button
              onClick={saveParking}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Save
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <ul className="space-y-1.5 border-t border-border/60 pt-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {item.label}
                  {item.date && (
                    <span className="text-xs text-muted-foreground"> · {item.date}</span>
                  )}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.label}`}
                  className="shrink-0 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <div className="space-y-1.5 border-t border-border/60 pt-3">
            <input
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              maxLength={60}
              placeholder="e.g. TÜV, insurance, tax"
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            <input
              type="date"
              value={itemDate}
              onChange={(e) => setItemDate(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-coral"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setAdding(false)}
                className="flex-1 rounded-2xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                className="flex-1 rounded-2xl bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/60 py-2.5 text-xs font-semibold text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add vehicle item
          </button>
        )}
      </div>
    </Section>
  );
}
