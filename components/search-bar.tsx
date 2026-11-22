"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (pathname !== "/" && !value.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(
        pathname === "/" ? window.location.search : "",
      );
      const query = value.trim();
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      const search = params.toString();
      router.replace(search ? `/?${search}` : "/", { scroll: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname, router, value]);

  return (
    <label className="flex h-10 w-full items-center gap-2.5 rounded-full bg-slate-100 px-3.5 text-slate-500 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-200 sm:max-w-[520px]">
      <Search size={18} className="shrink-0" aria-hidden="true" />
      <input
        aria-label="Search listings"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search Marketplace"
        className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="rounded-full p-1 transition hover:bg-slate-200"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </label>
  );
}
