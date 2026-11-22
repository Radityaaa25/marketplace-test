"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MessageSellerDialog({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors: Record<string, string> = {};
    if (buyerName.trim().length < 1 || buyerName.trim().length > 100) {
      nextErrors.buyerName = "Enter your name (up to 100 characters).";
    }
    if (!emailPattern.test(buyerEmail.trim())) {
      nextErrors.buyerEmail = "Enter a valid email address.";
    }
    if (message.trim().length < 1 || message.trim().length > 1000) {
      nextErrors.message = "Message must be between 1 and 1,000 characters.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSending(true);
    try {
      const { error } = await getSupabaseClient().from("messages").insert({
        listing_id: listingId,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        message: message.trim(),
      });

      if (error) {
        setSubmitError(
          `Your message could not be saved: ${error.message}. Make sure this listing still exists.`,
        );
        return;
      }

      setSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Your message could not be sent. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setTimeout(() => {
        setSent(false);
        setSubmitError(null);
        setErrors({});
      }, 150);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Send size={16} aria-hidden="true" />
          Message Seller
        </Button>
      </DialogTrigger>
      <DialogContent>
        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={29} aria-hidden="true" />
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Message sent
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-slate-500">
              Your message was saved. The seller can reply to the email address
              you provided.
            </DialogDescription>
            <Button className="mt-6 w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogTitle className="pr-8 text-xl font-bold text-slate-900">
              Message the seller
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">
              Ask about “{listingTitle}”. Your message goes directly to the
              seller.
            </DialogDescription>
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="buyer-name" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Your name
                </label>
                <Input
                  id="buyer-name"
                  autoComplete="name"
                  value={buyerName}
                  maxLength={100}
                  onChange={(event) => setBuyerName(event.target.value)}
                  aria-invalid={Boolean(errors.buyerName)}
                  aria-describedby={errors.buyerName ? "buyer-name-error" : undefined}
                />
                {errors.buyerName && (
                  <p id="buyer-name-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.buyerName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="buyer-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Your email
                </label>
                <Input
                  id="buyer-email"
                  type="email"
                  autoComplete="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  aria-invalid={Boolean(errors.buyerEmail)}
                  aria-describedby={errors.buyerEmail ? "buyer-email-error" : undefined}
                />
                {errors.buyerEmail && (
                  <p id="buyer-email-error" role="alert" className="mt-1 text-xs text-red-600">
                    {errors.buyerEmail}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="buyer-message" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Message
                </label>
                <Textarea
                  id="buyer-message"
                  value={message}
                  maxLength={1000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Hi! Is this still available?"
                  className="min-h-28"
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "buyer-message-error" : undefined}
                />
                <div className="flex items-start justify-between gap-2">
                  {errors.message && (
                    <p id="buyer-message-error" role="alert" className="mt-1 text-xs text-red-600">
                      {errors.message}
                    </p>
                  )}
                  <span className="ml-auto mt-1 text-xs text-slate-400">
                    {message.length}/1,000
                  </span>
                </div>
              </div>
              {submitError && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <Button type="submit" disabled={isSending} className="w-full">
                {isSending ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} aria-hidden="true" />
                    Send message
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-slate-400">
                About: {listingTitle}
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
