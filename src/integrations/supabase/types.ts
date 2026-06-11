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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          budget_limit: number
          color: string
          created_at: string
          icon: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          budget_limit?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name: string
          user_id: string
        }
        Update: {
          budget_limit?: number
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          bank: Database["public"]["Enums"]["bank_type"] | null
          category_id: string | null
          created_at: string
          frequency: string | null
          id: string
          is_payment_record: boolean | null
          is_recurring: boolean
          last_payment_date: string | null
          name: string
          user_id: string
        }
        Insert: {
          amount: number
          bank?: Database["public"]["Enums"]["bank_type"] | null
          category_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_payment_record?: boolean | null
          is_recurring?: boolean
          last_payment_date?: string | null
          name: string
          user_id: string
        }
        Update: {
          amount?: number
          bank?: Database["public"]["Enums"]["bank_type"] | null
          category_id?: string | null
          created_at?: string
          frequency?: string | null
          id?: string
          is_payment_record?: boolean | null
          is_recurring?: boolean
          last_payment_date?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_payments_tracking: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          month: number
          paid_date: string
          payment_type: string
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          month: number
          paid_date: string
          payment_type: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          month?: number
          paid_date?: string
          payment_type?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_reminders_completed: {
        Row: {
          completed_date: string
          created_at: string | null
          id: string
          month: number
          reminder_type: string
          user_id: string
          year: number
        }
        Insert: {
          completed_date: string
          created_at?: string | null
          id?: string
          month: number
          reminder_type: string
          user_id: string
          year: number
        }
        Update: {
          completed_date?: string
          created_at?: string | null
          id?: string
          month?: number
          reminder_type?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      monthly_savings: {
        Row: {
          amount: number
          bank: string
          created_at: string
          id: string
          month: number
          note: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          bank: string
          created_at?: string
          id?: string
          month: number
          note?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          bank?: string
          created_at?: string
          id?: string
          month?: number
          note?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          budget_alerts: boolean
          budget_threshold: number
          created_at: string
          daily_reminder: boolean
          daily_reminder_time: string
          goal_reminders: boolean
          id: string
          recurring_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_alerts?: boolean
          budget_threshold?: number
          created_at?: string
          daily_reminder?: boolean
          daily_reminder_time?: string
          goal_reminders?: boolean
          id?: string
          recurring_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_alerts?: boolean
          budget_threshold?: number
          created_at?: string
          daily_reminder?: boolean
          daily_reminder_time?: string
          goal_reminders?: boolean
          id?: string
          recurring_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_tokens: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          last_used_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          monthly_income: number
          rent: number
          savings_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          monthly_income?: number
          rent?: number
          savings_goal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          monthly_income?: number
          rent?: number
          savings_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_goals: {
        Row: {
          created_at: string
          current_amount: number
          id: string
          name: string
          status: string | null
          target_amount: number
          target_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          id?: string
          name: string
          status?: string | null
          target_amount: number
          target_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          id?: string
          name?: string
          status?: string | null
          target_amount?: number
          target_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_banks: {
        Row: {
          bank: Database["public"]["Enums"]["bank_type"]
          created_at: string
          id: string
          initial_balance: number
          is_active: boolean
          user_id: string
        }
        Insert: {
          bank: Database["public"]["Enums"]["bank_type"]
          created_at?: string
          id?: string
          initial_balance?: number
          is_active?: boolean
          user_id: string
        }
        Update: {
          bank?: Database["public"]["Enums"]["bank_type"]
          created_at?: string
          id?: string
          initial_balance?: number
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bank_type: "santander" | "lacaixa" | "ing" | "revolut" | "bbva"
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
      bank_type: ["santander", "lacaixa", "ing", "revolut", "bbva"],
    },
  },
} as const
