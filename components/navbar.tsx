import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";

export function Navbar({ initialQuery }: { initialQuery: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[#1877f2]"
          aria-label="Marketplace home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-sm">
            <Store size={21} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="hidden text-[19px] font-bold tracking-tight text-slate-900 sm:inline">
            Marketplace
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <SearchBar initialQuery={initialQuery} />
        </div>
        <Button
          href="/listings/new"
          size="small"
          className="shrink-0 rounded-full sm:h-10 sm:px-4 sm:text-sm"
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden sm:inline">Create listing</span>
          <span className="sm:hidden">Sell</span>
        </Button>
      </div>
    </header>
  );
}
