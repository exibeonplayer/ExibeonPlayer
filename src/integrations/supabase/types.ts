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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_daily: {
        Row: {
          connection_losses: number | null
          content_played_count: number | null
          created_at: string | null
          date: string
          id: string
          player_id: string
          uptime_seconds: number | null
        }
        Insert: {
          connection_losses?: number | null
          content_played_count?: number | null
          created_at?: string | null
          date: string
          id?: string
          player_id: string
          uptime_seconds?: number | null
        }
        Update: {
          connection_losses?: number | null
          content_played_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          player_id?: string
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      license_actions: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          license_id: string
          performed_by: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          license_id: string
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          license_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_actions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          max_players: number
          start_date: string | null
          status: Database["public"]["Enums"]["license_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          max_players?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          max_players?: number
          start_date?: string | null
          status?: Database["public"]["Enums"]["license_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          file_url: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_commands: {
        Row: {
          command: string
          created_at: string | null
          executed_at: string | null
          id: string
          payload: Json | null
          player_id: string
          status: string | null
        }
        Insert: {
          command: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          payload?: Json | null
          player_id: string
          status?: string | null
        }
        Update: {
          command?: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          payload?: Json | null
          player_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_commands_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          message: string | null
          metadata: Json | null
          player_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type: string
          message?: string | null
          metadata?: Json | null
          player_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          message?: string | null
          metadata?: Json | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          player_id: string
          playlist_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          player_id: string
          playlist_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          player_id?: string
          playlist_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_schedules_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_schedules_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      player_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          player_id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          player_id: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          player_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_tokens_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          code: string
          connection_losses: number | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_heartbeat: string | null
          location: string | null
          name: string
          status: Database["public"]["Enums"]["player_status"] | null
          updated_at: string | null
          uptime_seconds: number | null
          user_id: string
        }
        Insert: {
          code: string
          connection_losses?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_heartbeat?: string | null
          location?: string | null
          name: string
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string | null
          uptime_seconds?: number | null
          user_id: string
        }
        Update: {
          code?: string
          connection_losses?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_heartbeat?: string | null
          location?: string | null
          name?: string
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string | null
          uptime_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          created_at: string | null
          display_order: number
          duration_override_seconds: number | null
          id: string
          media_file_id: string
          playlist_id: string
        }
        Insert: {
          created_at?: string | null
          display_order: number
          duration_override_seconds?: number | null
          id?: string
          media_file_id: string
          playlist_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          duration_override_seconds?: number | null
          id?: string
          media_file_id?: string
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          public_url: string | null
          slug: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          public_url?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          public_url?: string | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          is_master: boolean | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          id: string
          is_master?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_master?: boolean | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator" | "master"
      content_type: "video" | "image"
      license_status: "active" | "expired" | "suspended"
      player_status:
        | "online"
        | "offline"
        | "alert"
        | "maintenance"
        | "never_accessed"
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
      app_role: ["admin", "user", "moderator", "master"],
      content_type: ["video", "image"],
      license_status: ["active", "expired", "suspended"],
      player_status: [
        "online",
        "offline",
        "alert",
        "maintenance",
        "never_accessed",
      ],
    },
  },
} as const
