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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          opay_reference: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          opay_reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          opay_reference?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      power_bank_types: {
        Row: {
          capacity_mah: number
          category: string
          created_at: string
          id: string
          name: string
          price_per_day: number
          price_per_hour: number
          target_devices: string
          updated_at: string
        }
        Insert: {
          capacity_mah: number
          category: string
          created_at?: string
          id?: string
          name: string
          price_per_day: number
          price_per_hour: number
          target_devices: string
          updated_at?: string
        }
        Update: {
          capacity_mah?: number
          category?: string
          created_at?: string
          id?: string
          name?: string
          price_per_day?: number
          price_per_hour?: number
          target_devices?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_updates: {
        Row: {
          created_at: string
          created_by: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          is_active: boolean
          message: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          message: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          message?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          base_price: number | null
          cancellation_deadline: string | null
          created_at: string
          discounts: number | null
          end_time: string | null
          id: string
          is_advance_booking: boolean | null
          late_fee: number | null
          loyalty_discount: number | null
          peak_hour_surcharge: number | null
          power_bank_type_id: string | null
          rental_duration_hours: number | null
          rental_type: string | null
          scheduled_start_time: string | null
          security_deposit: number | null
          start_time: string
          station_id: string
          status: string
          surcharges: number | null
          total_amount: number | null
          updated_at: string
          user_id: string
          weekend_premium: number | null
        }
        Insert: {
          base_price?: number | null
          cancellation_deadline?: string | null
          created_at?: string
          discounts?: number | null
          end_time?: string | null
          id?: string
          is_advance_booking?: boolean | null
          late_fee?: number | null
          loyalty_discount?: number | null
          peak_hour_surcharge?: number | null
          power_bank_type_id?: string | null
          rental_duration_hours?: number | null
          rental_type?: string | null
          scheduled_start_time?: string | null
          security_deposit?: number | null
          start_time?: string
          station_id: string
          status?: string
          surcharges?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          weekend_premium?: number | null
        }
        Update: {
          base_price?: number | null
          cancellation_deadline?: string | null
          created_at?: string
          discounts?: number | null
          end_time?: string | null
          id?: string
          is_advance_booking?: boolean | null
          late_fee?: number | null
          loyalty_discount?: number | null
          peak_hour_surcharge?: number | null
          power_bank_type_id?: string | null
          rental_duration_hours?: number | null
          rental_type?: string | null
          scheduled_start_time?: string | null
          security_deposit?: number | null
          start_time?: string
          station_id?: string
          status?: string
          surcharges?: number | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          weekend_premium?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rentals_power_bank_type_id_fkey"
            columns: ["power_bank_type_id"]
            isOneToOne: false
            referencedRelation: "power_bank_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          power_bank_type_id: string
          station_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          power_bank_type_id: string
          station_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          power_bank_type_id?: string
          station_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_power_bank_type_id_fkey"
            columns: ["power_bank_type_id"]
            isOneToOne: false
            referencedRelation: "power_bank_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      station_inventory: {
        Row: {
          available_units: number
          created_at: string
          id: string
          power_bank_type_id: string
          reserved_units: number
          station_id: string
          total_units: number
          updated_at: string
        }
        Insert: {
          available_units?: number
          created_at?: string
          id?: string
          power_bank_type_id: string
          reserved_units?: number
          station_id: string
          total_units?: number
          updated_at?: string
        }
        Update: {
          available_units?: number
          created_at?: string
          id?: string
          power_bank_type_id?: string
          reserved_units?: number
          station_id?: string
          total_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_inventory_power_bank_type_id_fkey"
            columns: ["power_bank_type_id"]
            isOneToOne: false
            referencedRelation: "power_bank_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_inventory_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          price_per_hour: number
          total_power_banks: number
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          price_per_hour?: number
          total_power_banks?: number
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          price_per_hour?: number
          total_power_banks?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          payment_reference: string | null
          rental_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          rental_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          rental_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_loyalty: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          loyalty_tier: string | null
          total_bookings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          loyalty_tier?: string | null
          total_bookings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          loyalty_tier?: string | null
          total_bookings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payment_method: string
          power_bank_type_id: string
          station_id: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          power_bank_type_id: string
          station_id: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          power_bank_type_id?: string
          station_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_power_bank_type_id_fkey"
            columns: ["power_bank_type_id"]
            isOneToOne: false
            referencedRelation: "power_bank_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rental_pricing: {
        Args: {
          power_bank_type_id: string
          rental_duration_hours: number
          rental_type: string
          scheduled_start_time?: string
          user_id?: string
        }
        Returns: Json
      }
      expire_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_power_banks: {
        Args: { station_id: string }
        Returns: number
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "customer" | "admin"
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
    Enums: {
      user_role: ["customer", "admin"],
    },
  },
} as const
