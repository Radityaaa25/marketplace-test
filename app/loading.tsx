export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="h-[72px] border-b border-slate-200 bg-white" />
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl bg-white shadow-sm"
            >
              <div className="aspect-square animate-pulse bg-slate-200" />
              <div className="space-y-2 p-3">
                <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
