export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bring_claims: {
        Row: {
          created_at: string;
          event_id: string;
          has_this: boolean;
          id: string;
          item_id: string;
          qty: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          has_this?: boolean;
          id?: string;
          item_id: string;
          qty?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          has_this?: boolean;
          id?: string;
          item_id?: string;
          qty?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      bring_items: {
        Row: {
          category: string;
          claimed_by: string | null;
          created_at: string;
          created_by: string | null;
          emoji: string;
          event_id: string;
          has_this: boolean;
          id: string;
          ingredients: string | null;
          is_byo: boolean;
          name: string;
          qty_needed: number;
          quantity: string | null;
          required: boolean;
          status: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          claimed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id: string;
          has_this?: boolean;
          id?: string;
          ingredients?: string | null;
          is_byo?: boolean;
          name: string;
          qty_needed?: number;
          quantity?: string | null;
          required?: boolean;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          claimed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id?: string;
          has_this?: boolean;
          id?: string;
          ingredients?: string | null;
          is_byo?: boolean;
          name?: string;
          qty_needed?: number;
          quantity?: string | null;
          required?: boolean;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bring_items_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          created_at: string;
          created_by: string | null;
          emoji: string;
          event_id: string;
          id: string;
          note: string | null;
          paid_by: string;
          receipt_path: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id: string;
          id?: string;
          note?: string | null;
          paid_by: string;
          receipt_path?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id?: string;
          id?: string;
          note?: string | null;
          paid_by?: string;
          receipt_path?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_shares: {
        Row: {
          amount: number;
          created_at: string;
          event_id: string;
          expense_id: string;
          id: string;
          settled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          event_id: string;
          expense_id: string;
          id?: string;
          settled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          event_id?: string;
          expense_id?: string;
          id?: string;
          settled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_contributions: {
        Row: {
          amount: number;
          created_at: string;
          event_id: string;
          gift_id: string;
          id: string;
          is_buyer: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          created_at?: string;
          event_id: string;
          gift_id: string;
          id?: string;
          is_buyer?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          event_id?: string;
          gift_id?: string;
          id?: string;
          is_buyer?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      gift_items: {
        Row: {
          created_at: string;
          created_by: string | null;
          emoji: string;
          event_id: string;
          id: string;
          name: string;
          note: string | null;
          price: number | null;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id: string;
          id?: string;
          name: string;
          note?: string | null;
          price?: number | null;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          emoji?: string;
          event_id?: string;
          id?: string;
          name?: string;
          note?: string | null;
          price?: number | null;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gift_items_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      date_options: {
        Row: {
          created_at: string;
          created_by: string | null;
          event_id: string;
          id: string;
          option_date: string;
          time_label: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          event_id: string;
          id?: string;
          option_date: string;
          time_label?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          event_id?: string;
          id?: string;
          option_date?: string;
          time_label?: string | null;
        };
        Relationships: [];
      };
      date_votes: {
        Row: {
          availability: string;
          created_at: string;
          event_id: string;
          id: string;
          option_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          availability?: string;
          created_at?: string;
          event_id: string;
          id?: string;
          option_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          availability?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          option_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "date_votes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "date_options";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          away_score: number | null;
          away_team: string | null;
          created_at: string;
          description: string | null;
          event_type: string | null;
          group_id: string | null;
          home_score: number | null;
          home_team: string | null;
          id: string;
          location: string | null;
          name: string;
          organizer_id: string;
          prizes: string | null;
          starts_at: string | null;
          updated_at: string;
        };
        Insert: {
          away_score?: number | null;
          away_team?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string | null;
          group_id?: string | null;
          home_score?: number | null;
          home_team?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          organizer_id: string;
          prizes?: string | null;
          starts_at?: string | null;
          updated_at?: string;
        };
        Update: {
          away_score?: number | null;
          away_team?: string | null;
          created_at?: string;
          description?: string | null;
          event_type?: string | null;
          group_id?: string | null;
          home_score?: number | null;
          home_team?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          organizer_id?: string;
          prizes?: string | null;
          starts_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          emoji: string;
          id: string;
          name: string;
          owner_id: string;
          privacy: string;
          tagline: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          emoji?: string;
          id?: string;
          name: string;
          owner_id: string;
          privacy?: string;
          tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          emoji?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          privacy?: string;
          tagline?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          edited_at: string | null;
          id: string;
          thread_id: string;
          thread_type: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          thread_id: string;
          thread_type: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          edited_at?: string | null;
          id?: string;
          thread_id?: string;
          thread_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          availability_status: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          default_location: string | null;
          dietary: string[];
          display_name: string;
          emoji_avatar: string;
          equipment: string[];
          facebook: string | null;
          iban: string | null;
          id: string;
          instagram: string | null;
          interests: string[];
          neighborhood: string | null;
          payment_note: string | null;
          paypal: string | null;
          phone: string | null;
          show_phone: boolean;
          social_mode: string;
          updated_at: string;
        };
        Insert: {
          availability_status?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          default_location?: string | null;
          dietary?: string[];
          display_name?: string;
          emoji_avatar?: string;
          equipment?: string[];
          facebook?: string | null;
          iban?: string | null;
          id: string;
          instagram?: string | null;
          interests?: string[];
          neighborhood?: string | null;
          payment_note?: string | null;
          paypal?: string | null;
          phone?: string | null;
          show_phone?: boolean;
          social_mode?: string;
          updated_at?: string;
        };
        Update: {
          availability_status?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          default_location?: string | null;
          dietary?: string[];
          display_name?: string;
          emoji_avatar?: string;
          equipment?: string[];
          facebook?: string | null;
          iban?: string | null;
          id?: string;
          instagram?: string | null;
          interests?: string[];
          neighborhood?: string | null;
          payment_note?: string | null;
          paypal?: string | null;
          phone?: string | null;
          show_phone?: boolean;
          social_mode?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rsvps: {
        Row: {
          arrival_time: string | null;
          created_at: string;
          event_id: string;
          id: string;
          note: string | null;
          relationship_label: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          arrival_time?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          note?: string | null;
          relationship_label?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          arrival_time?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          note?: string | null;
          relationship_label?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_expense: { Args: { _expense_id: string }; Returns: boolean };
      is_event_organizer: { Args: { _event_id: string }; Returns: boolean };
      is_group_admin: { Args: { _group_id: string }; Returns: boolean };
      is_group_member: { Args: { _group_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
