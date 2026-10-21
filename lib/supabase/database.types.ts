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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          baseline_value: number | null
          completed_at: string | null
          created_at: string
          id: string
          restaurant_id: string
          starts_on: string | null
          status: string
          target_description: string
          target_value: number | null
          theme_id: string
          title: string
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          restaurant_id: string
          starts_on?: string | null
          status?: string
          target_description: string
          target_value?: number | null
          theme_id: string
          title: string
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          restaurant_id?: string
          starts_on?: string | null
          status?: string
          target_description?: string
          target_value?: number | null
          theme_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_theme_id_restaurant_id_fkey"
            columns: ["theme_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_code: string | null
          id: string
          import_id: string
          model: string | null
          restaurant_id: string
          status: string
          validation_passed: boolean | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          import_id: string
          model?: string | null
          restaurant_id: string
          status?: string
          validation_passed?: boolean | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          id?: string
          import_id?: string
          model?: string | null
          restaurant_id?: string
          status?: string
          validation_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_import_id_restaurant_id_fkey"
            columns: ["import_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "review_imports"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "analysis_runs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_analysis_quota: {
        Row: {
          daily_count: number
          day: string
          id: boolean
          minute: string
          minute_count: number
        }
        Insert: {
          daily_count?: number
          day: string
          id?: boolean
          minute: string
          minute_count?: number
        }
        Update: {
          daily_count?: number
          day?: string
          id?: boolean
          minute?: string
          minute_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reply_drafts: {
        Row: {
          analysis_run_id: string
          approved_at: string | null
          content: string
          created_at: string
          id: string
          restaurant_id: string
          review_id: string
          status: string
          updated_at: string
          verification_question: string
        }
        Insert: {
          analysis_run_id: string
          approved_at?: string | null
          content: string
          created_at?: string
          id?: string
          restaurant_id: string
          review_id: string
          status?: string
          updated_at?: string
          verification_question?: string
        }
        Update: {
          analysis_run_id?: string
          approved_at?: string | null
          content?: string
          created_at?: string
          id?: string
          restaurant_id?: string
          review_id?: string
          status?: string
          updated_at?: string
          verification_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "reply_drafts_analysis_run_id_restaurant_id_fkey"
            columns: ["analysis_run_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "reply_drafts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reply_drafts_review_id_restaurant_id_fkey"
            columns: ["review_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id", "restaurant_id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          facts: string
          id: string
          name: string
          owner_id: string
          reply_tone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          facts?: string
          id?: string
          name: string
          owner_id: string
          reply_tone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          facts?: string
          id?: string
          name?: string
          owner_id?: string
          reply_tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_imports: {
        Row: {
          created_at: string
          id: string
          label: string
          period_end: string
          period_start: string
          restaurant_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          period_end: string
          period_start: string
          restaurant_id: string
          source: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          period_end?: string
          period_start?: string
          restaurant_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_imports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          external_id: string
          id: string
          import_id: string
          language: string | null
          rating: number
          restaurant_id: string
          reviewed_at: string
          text: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          import_id: string
          language?: string | null
          rating: number
          restaurant_id: string
          reviewed_at: string
          text: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          import_id?: string
          language?: string | null
          rating?: number
          restaurant_id?: string
          reviewed_at?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_import_id_restaurant_id_fkey"
            columns: ["import_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "review_imports"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          analysis_run_id: string
          confidence: number
          created_at: string
          evidence: Json
          frequency_count: number
          id: string
          kind: string
          priority_score: number
          restaurant_id: string
          severity: number
          suggested_action: string
          title: string
        }
        Insert: {
          analysis_run_id: string
          confidence: number
          created_at?: string
          evidence: Json
          frequency_count: number
          id?: string
          kind: string
          priority_score: number
          restaurant_id: string
          severity: number
          suggested_action: string
          title: string
        }
        Update: {
          analysis_run_id?: string
          confidence?: number
          created_at?: string
          evidence?: Json
          frequency_count?: number
          id?: string
          kind?: string
          priority_score?: number
          restaurant_id?: string
          severity?: number
          suggested_action?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_analysis_run_id_restaurant_id_fkey"
            columns: ["analysis_run_id", "restaurant_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id", "restaurant_id"]
          },
          {
            foreignKeyName: "themes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_review_import: {
        Args: {
          import_label: string
          import_source: string
          imported_reviews: Json
          restaurant_facts: string
          restaurant_name: string
          restaurant_reply_tone: string
        }
        Returns: string
      }
      reserve_demo_analysis: { Args: never; Returns: boolean }
      save_analysis_result: {
        Args: {
          analyzed_themes: Json
          drafted_replies: Json
          elapsed_ms: number
          model_name: string
          target_run: string
        }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
