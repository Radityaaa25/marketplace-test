export type ListingCategory =
  | "Vehicles"
  | "Property Rentals"
  | "Electronics"
  | "Home & Garden"
  | "Clothing"
  | "Hobbies"
  | "Family"
  | "Free Stuff"
  | "Other";

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  seller_email: string;
  image_url: string;
  location: string;
  created_at: string;
  updated_at: string;
  status: "available" | "sold";
  sold_at: string | null;
};

export type ListingInsert = Omit<
  Listing,
  "id" | "created_at" | "updated_at" | "location" | "status" | "sold_at"
> &
  Partial<Pick<Listing, "updated_at" | "location" | "status" | "sold_at">>;

export type Message = {
  id: string;
  listing_id: string;
  buyer_name: string;
  buyer_email: string;
  seller_email: string;
  message: string;
  created_at: string;
};

export type MessageInsert = Omit<Message, "id" | "created_at">;

export type Seller = {
  id: string;
  email: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  listing_id: string | null;
  seller_email: string | null;
  stripe_account_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_total: number | null;
  application_fee_amount: number | null;
  currency: string;
  buyer_email: string | null;
  status: "pending" | "paid" | "needs_refund" | "expired";
  created_at: string;
  paid_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: Listing;
        Insert: ListingInsert & { id?: string; created_at?: string };
        Update: Partial<ListingInsert>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert & { id?: string; created_at?: string };
        Update: Partial<MessageInsert>;
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      sellers: {
        Row: Seller;
        Insert: Omit<Seller, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Seller, "id" | "created_at">>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at" | "paid_at"> & {
          id?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Omit<Order, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
