"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CATEGORIES } from "@/lib/constants";
import { getSupabaseClient } from "@/lib/supabase";
import type { ListingCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FieldName =
  | "title"
  | "description"
  | "price"
  | "sellerEmail"
  | "category"
  | "photo";
type FormErrors = Partial<Record<FieldName, string>>;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhoto(file: File | null): string | undefined {
  if (!file) {
    return "Choose a photo for your listing.";
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Photo must be 5 MB or smaller.";
  }
}

function FieldError({ children }: { children?: string }) {
  if (!children) {
    return null;
  }
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {children}
    </p>
  );
}

export function ListingForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [location, setLocation] = useState("Palo Alto, CA");
  const [category, setCategory] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function clearFieldError(field: FieldName) {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    const error = validatePhoto(selected);
    if (error) {
      setPhoto(null);
      setErrors((previous) => ({ ...previous, photo: error }));
      return;
    }

    setPhoto(selected);
    clearFieldError("photo");
  }

  function removePhoto() {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    clearFieldError("photo");
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (title.trim().length < 3 || title.trim().length > 100) {
      next.title = "Title must be between 3 and 100 characters.";
    }
    if (description.trim().length < 10 || description.trim().length > 1000) {
      next.description = "Description must be between 10 and 1,000 characters.";
    }
    const parsedPrice = Number(price);
    if (price.trim() === "" || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      next.price = "Enter a valid price of $0 or more.";
    }
    if (!emailPattern.test(sellerEmail.trim())) {
      next.sellerEmail = "Enter a valid email address.";
    }
    if (!CATEGORIES.some((item) => item === category)) {
      next.category = "Choose a category.";
    }
    const photoError = validatePhoto(photo);
    if (photoError) {
      next.photo = photoError;
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!photo) {
      return;
    }

    setIsSubmitting(true);
    let uploadedPath: string | null = null;
    try {
      const supabase = getSupabaseClient();
      const safeFileName = photo.name.replace(/[^\w.-]/g, "_");
      uploadedPath = `${crypto.randomUUID()}-${safeFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(uploadedPath, photo, {
          cacheControl: "3600",
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        setSubmitError(`Photo upload failed: ${uploadError.message}`);
        return;
      }

      const { data: imageData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(uploadedPath);
      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          seller_email: sellerEmail.trim(),
          category: category as ListingCategory,
          image_url: imageData.publicUrl,
          location: location.trim() || "Palo Alto, CA",
        })
        .select("id")
        .single();

      if (insertError) {
        const { error: cleanupError } = await supabase.storage
          .from("listing-images")
          .remove([uploadedPath]);
        if (cleanupError) {
          console.error("Unable to clean up an unused listing photo:", cleanupError);
        }
        setSubmitError(`Listing could not be saved: ${insertError.message}`);
        return;
      }

      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await getSupabaseClient()
          .storage.from("listing-images").remove([uploadedPath]);
        if (cleanupError) {
          console.error("Unable to clean up an unused listing photo:", cleanupError);
        }
      }
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong while saving.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="listing-photo" className="mb-2 block text-sm font-semibold text-slate-800">
          Photos <span className="text-red-500">*</span>
        </label>
        {previewUrl ? (
          <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image
              src={previewUrl}
              alt="Preview of your listing photo"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              aria-label="Remove photo"
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow transition hover:bg-white"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="listing-photo"
            className="flex min-h-44 max-w-md cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-[#1877f2] hover:bg-blue-50/40"
          >
            <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-[#1877f2]">
              <ImagePlus size={23} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Add a photo
            </span>
            <span className="mt-1 text-xs text-slate-500">
              JPG, PNG, or WebP · up to 5 MB
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1877f2]">
              <Upload size={14} aria-hidden="true" />
              Choose file
            </span>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="listing-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="sr-only"
          aria-describedby={errors.photo ? "photo-error" : undefined}
        />
        <div id="photo-error">
          <FieldError>{errors.photo}</FieldError>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-800">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          maxLength={100}
          onChange={(event) => {
            setTitle(event.target.value);
            clearFieldError("title");
          }}
          placeholder="What are you selling?"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        <div id="title-error">
          <FieldError>{errors.title}</FieldError>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-800">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          value={description}
          maxLength={1000}
          onChange={(event) => {
            setDescription(event.target.value);
            clearFieldError("description");
          }}
          placeholder="Share the details buyers should know..."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        <div className="flex items-start justify-between gap-3">
          <div id="description-error">
            <FieldError>{errors.description}</FieldError>
          </div>
          <span className="ml-auto mt-1.5 text-xs text-slate-400">
            {description.length}/1,000
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-800">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              $
            </span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                clearFieldError("price");
              }}
              placeholder="0.00"
              className="pl-7"
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "price-error" : undefined}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Enter 0 if it’s free.</p>
          <div id="price-error">
            <FieldError>{errors.price}</FieldError>
          </div>
        </div>
        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-800">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              clearFieldError("category");
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1877f2] focus:ring-4 focus:ring-blue-100"
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div id="category-error">
            <FieldError>{errors.category}</FieldError>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="seller-email" className="mb-2 block text-sm font-semibold text-slate-800">
          Seller email <span className="text-red-500">*</span>
        </label>
        <Input
          id="seller-email"
          type="email"
          autoComplete="email"
          value={sellerEmail}
          onChange={(event) => {
            setSellerEmail(event.target.value);
            clearFieldError("sellerEmail");
          }}
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.sellerEmail)}
          aria-describedby={errors.sellerEmail ? "seller-email-error" : undefined}
        />
        <div id="seller-email-error">
          <FieldError>{errors.sellerEmail}</FieldError>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="mb-2 block text-sm font-semibold text-slate-800">
          Location
        </label>
        <Input
          id="location"
          value={location}
          maxLength={255}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Palo Alto, CA"
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
            Publishing…
          </>
        ) : (
          "Publish listing"
        )}
      </Button>
      <p className="text-xs leading-5 text-slate-500">
        By publishing, you agree to communicate respectfully and accurately
        describe your item.
      </p>
    </form>
  );
}
