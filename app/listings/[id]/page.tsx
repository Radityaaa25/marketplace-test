import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Mail, MapPin, Tag } from "lucide-react";
import { MessageSellerDialog } from "@/components/message-seller-dialog";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { formatPostedDate, formatPrice } from "@/lib/constants";
import { getListingById } from "@/lib/listings";

type ListingPageProps = {
  params: Promise<{ id: string }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function findListing(id: string) {
  if (!uuidPattern.test(id)) {
    return null;
  }

  const result = await getListingById(id);
  if (result.error) {
    throw new Error(`Unable to load listing: ${result.error}`);
  }
  return result.data;
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await findListing(id);
  if (!listing) {
    return { title: "Listing not found" };
  }

  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: [{ url: listing.image_url, alt: listing.title }],
      type: "article",
    },
  };
}

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await findListing(id);
  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery="" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Marketplace
        </Link>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] lg:gap-7">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-sm sm:aspect-[1.25/1] lg:aspect-[1.15/1]">
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {formatPrice(listing.price)}
              </p>
              <h1 className="mt-2 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                {listing.title}
              </h1>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Tag size={15} aria-hidden="true" />
                  {listing.category}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} aria-hidden="true" />
                  Listed {formatPostedDate(listing.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden="true" />
                  {listing.location}
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {listing.description}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">Seller</h2>
              <p className="mt-2 inline-flex items-center gap-2 break-all text-sm text-slate-600">
                <Mail size={16} className="shrink-0" aria-hidden="true" />
                {listing.seller_email}
              </p>
              <div className="mt-5">
                <MessageSellerDialog
                  listingId={listing.id}
                  listingTitle={listing.title}
                  sellerEmail={listing.seller_email}
                />
              </div>
            </section>
          </div>
        </div>
        <div className="mt-8">
          <Button href="/" variant="secondary">
            <ArrowLeft size={17} aria-hidden="true" />
            Browse more listings
          </Button>
        </div>
      </main>
    </div>
  );
}
