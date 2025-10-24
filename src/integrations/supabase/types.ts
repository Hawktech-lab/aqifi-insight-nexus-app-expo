export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      data_streams: {
        Row: {
          created_at: string
          data_count: number | null
          earnings_rate: number | null
          id: string
          is_enabled: boolean | null
          last_sync_at: string | null
          stream_type: Database["public"]["Enums"]["data_stream_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_count?: number | null
          earnings_rate?: number | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          stream_type: Database["public"]["Enums"]["data_stream_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_count?: number | null
          earnings_rate?: number | null
          id?: string
          is_enabled?: boolean | null
          last_sync_at?: string | null
          stream_type?: Database["public"]["Enums"]["data_stream_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_stream_configs: {
        Row: {
          id: string
          stream_type: string
          config_key: string
          config_value: string
          default_value: string
          min_value: string | null
          max_value: string | null
          unit: string | null
          description: string | null
          is_editable: boolean
          is_active: boolean
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          stream_type: string
          config_key: string
          config_value: string
          default_value: string
          min_value?: string | null
          max_value?: string | null
          unit?: string | null
          description?: string | null
          is_editable?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          stream_type?: string
          config_key?: string
          config_value?: string
          default_value?: string
          min_value?: string | null
          max_value?: string | null
          unit?: string | null
          description?: string | null
          is_editable?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_stream_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      config_change_history: {
        Row: {
          id: string
          config_id: string
          old_value: string | null
          new_value: string | null
          changed_by: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          config_id: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          old_value?: string | null
          new_value?: string | null
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "config_change_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "data_stream_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "config_change_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          created_at: string
          expires_at: string
          config_version: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          created_at?: string
          expires_at: string
          config_version?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          created_at?: string
          expires_at?: string
          config_version?: string | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      earnings_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          points: number | null
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number | null
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number | null
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_submissions: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          postal_code: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          date_of_birth: string
          first_name: string
          id?: string
          last_name: string
          phone_number?: string
          postal_code: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
          postal_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          first_name: string | null
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          last_name: string | null
          profile_completion_percentage: number | null
          role: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_name?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          last_name?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          reward_amount: number | null
          reward_points: number | null
          status: Database["public"]["Enums"]["survey_status"] | null
          title: string
          typeform_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          title: string
          typeform_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          title?: string
          typeform_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          reward_amount: number | null
          reward_points: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          reward_amount?: number | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          connection_address: string | null
          connection_name: string
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_address?: string | null
          connection_name: string
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_address?: string | null
          connection_name?: string
          connection_type?: Database["public"]["Enums"]["connection_type"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_surveys: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          response_data: Json | null
          reward_earned: number | null
          status: Database["public"]["Enums"]["survey_status"] | null
          survey_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          response_data?: Json | null
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          survey_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          response_data?: Json | null
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          survey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_surveys_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          reward_earned: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          reward_earned?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      connection_type: "wallet" | "health_kit" | "google_fit" | "email"
      data_stream_type:
        | "steps"
        | "device_metadata"
        | "email_metadata"
        | "wifi"
        | "spatial"
        | "location"
        | "behavioral"
      kyc_status: "pending" | "verified" | "rejected"
      survey_status: "available" | "completed" | "expired"
      task_status: "available" | "completed" | "expired"
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
      connection_type: ["wallet", "health_kit", "google_fit", "email"],
      data_stream_type: [
        "steps",
        "device_metadata",
        "email_metadata",
        "wifi",
        "spatial",
        "location",
        "behavioral",
      ],
      kyc_status: ["pending", "verified", "rejected"],
      survey_status: ["available", "completed", "expired"],
      task_status: ["available", "completed", "expired"],
    },
  },
} as const
