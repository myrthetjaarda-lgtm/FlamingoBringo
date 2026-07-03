export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bring_claims: {
        Row: {
          created_at: string
          event_id: string
          has_this: boolean
          id: string
          item_id: string
          qty: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          has_this?: boolean
          id?: string
          item_id: string
          qty?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          has_this?: boolean
          id?: string
          item_id?: string
          qty?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bring_items: {
        Row: {
          category: string
          claimed_by: string | null
          created_at: string
          created_by: string | null
          emoji: string
          event_id: string
          has_this: boolean
          id: string
          ingredients: string | null
          is_byo: boolean
          name: string
          qty_needed: number
          quantity: string | null
          required: boolean
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          emoji?: string
          event_id: string
          has_this?: boolean
          id?: string
          ingredients?: string | null
          is_byo?: boolean
          name: string
          qty_needed?: number
          quantity?: string | null
          required?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          emoji?: string
          event_id?: string
          has_this?: boolean
          id?: string
          ingredients?: string | null
          is_byo?: boolean
          name?: string
          qty_needed?: number
          quantity?: string | null
          required?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bring_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_contributions: {
        Row: {
          amount: number
          created_at: string
          event_id: string
          gift_id: string
          id: string
          is_buyer: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          event_id: string
          gift_id: string
          id?: string
          is_buyer?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_id?: string
          gift_id?: string
          id?: string
          is_buyer?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_items: {
        Row: {
          created_at: string
          created_by: string | null
          emoji: string
          event_id: string
          id: string
          name: string
          note: string | null
          price: number | null
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          event_id: string
          id?: string
          name: string
          note?: string | null
          price?: number | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          event_id?: string
          id?: string
          name?: string
          note?: string | null
          price?: number | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      date_options: {
        Row: {
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          option_date: string
          time_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          option_date: string
          time_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          option_date?: string
          time_label?: string | null
        }
        Relationships: []
      }
      date_votes: {
        Row: {
          availability: string
          created_at: string
          event_id: string
          id: string
          option_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string
          created_at?: string
          event_id: string
          id?: string
          option_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string
          created_at?: string
          event_id?: string
          id?: string
          option_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "date_options"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string | null
          group_id: string | null
          id: string
          location: string | null
          name: string
          organizer_id: string
          prizes: string | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          group_id?: string | null
          id?: string
          location?: string | null
          name: string
          organizer_id: string
          prizes?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          group_id?: string | null
          id?: string
          location?: string | null
          name?: string
          organizer_id?: string
          prizes?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          owner_id: string
          privacy: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          name: string
          owner_id: string
          privacy?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          owner_id?: string
          privacy?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          id: string
          thread_id: string
          thread_type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          edited_at?: string | null
          id?: string
          thread_id: string
          thread_type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          thread_id?: string
          thread_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability_status: string
          avatar_url: string | null
          bike_scooter_provider: string | null
          bio: string | null
          created_at: string
          default_location: string | null
          dietary: string[]
          display_name: string
          driving_license: boolean
          emoji_avatar: string
          equipment: string[]
          facebook: string | null
          id: string
          instagram: string | null
          interests: string[]
          neighborhood: string | null
          owns_car: boolean
          phone: string | null
          rideshare_provider: string | null
          show_phone: boolean
          social_mode: string
          transit_passes: string[]
          updated_at: string
          vehicle_items: Json
          vehicle_parking_address: string | null
          vehicle_parking_note: string | null
        }
        Insert: {
          availability_status?: string
          avatar_url?: string | null
          bike_scooter_provider?: string | null
          bio?: string | null
          created_at?: string
          default_location?: string | null
          dietary?: string[]
          display_name?: string
          driving_license?: boolean
          emoji_avatar?: string
          equipment?: string[]
          facebook?: string | null
          id: string
          instagram?: string | null
          interests?: string[]
          neighborhood?: string | null
          owns_car?: boolean
          phone?: string | null
          rideshare_provider?: string | null
          show_phone?: boolean
          social_mode?: string
          transit_passes?: string[]
          updated_at?: string
          vehicle_items?: Json
          vehicle_parking_address?: string | null
          vehicle_parking_note?: string | null
        }
        Update: {
          availability_status?: string
          avatar_url?: string | null
          bike_scooter_provider?: string | null
          bio?: string | null
          created_at?: string
          default_location?: string | null
          dietary?: string[]
          display_name?: string
          driving_license?: boolean
          emoji_avatar?: string
          equipment?: string[]
          facebook?: string | null
          id?: string
          instagram?: string | null
          interests?: string[]
          neighborhood?: string | null
          owns_car?: boolean
          phone?: string | null
          rideshare_provider?: string | null
          show_phone?: boolean
          social_mode?: string
          transit_passes?: string[]
          updated_at?: string
          vehicle_items?: Json
          vehicle_parking_address?: string | null
          vehicle_parking_note?: string | null
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          arrival_time: string | null
          created_at: string
          event_id: string
          id: string
          note: string | null
          relationship_label: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          relationship_label?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          relationship_label?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_event_organizer: { Args: { _event_id: string }; Returns: boolean }
      is_group_admin: { Args: { _group_id: string }; Returns: boolean }
      is_group_member: { Args: { _group_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
