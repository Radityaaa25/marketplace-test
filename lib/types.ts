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
};

export type ListingInsert = Omit<
  Listing,
  "id" | "created_at" | "updated_at" | "location"
> &
  Partial<Pick<Listing, "updated_at" | "location">>;

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
