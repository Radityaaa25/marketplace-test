"use client";

import { Grid2X2, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ListingView = "grid" | "list";

export function ViewToggle({
  view,
  onChange,
}: {
  view: ListingView;
  onChange: (view: ListingView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Listing view"
      className="hidden items-center rounded-xl border border-slate-200 bg-white p-1 sm:flex"
    >
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={view === "grid"}
        onClick={() => onChange("grid")}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition",
          view === "grid"
            ? "bg-blue-50 text-[#1877f2]"
            : "text-slate-500 hover:bg-slate-50",
        )}
      >
        <Grid2X2 size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition",
          view === "list"
            ? "bg-blue-50 text-[#1877f2]"
            : "text-slate-500 hover:bg-slate-50",
        )}
      >
        <List size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
