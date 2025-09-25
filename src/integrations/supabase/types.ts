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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contents: {
        Row: {
          created_at: string | null
          duration: number | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          original_filename: string
          status: string | null
          thumbnail_path: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          original_filename: string
          status?: string | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          original_filename?: string
          status?: string | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          license_id: string | null
          new_status: string | null
          performed_by: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          license_id?: string | null
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          license_id?: string | null
          new_status?: string | null
          performed_by?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_actions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_actions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          license_type: string
          max_players: number | null
          notes: string | null
          start_date: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          license_type: string
          max_players?: number | null
          notes?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          license_type?: string
          max_players?: number | null
          notes?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_commands: {
        Row: {
          command_type: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          max_retries: number | null
          payload: Json | null
          player_id: string | null
          response: Json | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          command_type: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json | null
          player_id?: string | null
          response?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          command_type?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          max_retries?: number | null
          payload?: Json | null
          player_id?: string | null
          response?: Json | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_commands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_commands_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_heartbeats: {
        Row: {
          cpu_usage: number | null
          current_content: string | null
          disk_usage: number | null
          error_message: string | null
          id: string
          memory_usage: number | null
          metadata: Json | null
          network_status: Json | null
          player_id: string | null
          status: string
          timestamp: string | null
        }
        Insert: {
          cpu_usage?: number | null
          current_content?: string | null
          disk_usage?: number | null
          error_message?: string | null
          id?: string
          memory_usage?: number | null
          metadata?: Json | null
          network_status?: Json | null
          player_id?: string | null
          status: string
          timestamp?: string | null
        }
        Update: {
          cpu_usage?: number | null
          current_content?: string | null
          disk_usage?: number | null
          error_message?: string | null
          id?: string
          memory_usage?: number | null
          metadata?: Json | null
          network_status?: Json | null
          player_id?: string | null
          status?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_heartbeats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_logs: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          level: string | null
          log_type: string
          message: string
          metadata: Json | null
          player_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          log_type: string
          message: string
          metadata?: Json | null
          player_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          level?: string | null
          log_type?: string
          message?: string
          metadata?: Json | null
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_logs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          api_key: string
          assigned_playlist_id: string | null
          created_at: string | null
          group_name: string | null
          hardware_info: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_heartbeat: string | null
          last_sync: string | null
          location: string | null
          mac_address: unknown | null
          name: string
          os_info: string | null
          player_version: string | null
          status: string | null
          sync_status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key: string
          assigned_playlist_id?: string | null
          created_at?: string | null
          group_name?: string | null
          hardware_info?: string | null
          id: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_heartbeat?: string | null
          last_sync?: string | null
          location?: string | null
          mac_address?: unknown | null
          name: string
          os_info?: string | null
          player_version?: string | null
          status?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key?: string
          assigned_playlist_id?: string | null
          created_at?: string | null
          group_name?: string | null
          hardware_info?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_heartbeat?: string | null
          last_sync?: string | null
          location?: string | null
          mac_address?: unknown | null
          name?: string
          os_info?: string | null
          player_version?: string | null
          status?: string | null
          sync_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_assigned_playlist_id_fkey"
            columns: ["assigned_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_contents: {
        Row: {
          content_id: string | null
          created_at: string | null
          duration_override: number | null
          id: string
          order_index: number
          playlist_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          duration_override?: number | null
          id?: string
          order_index?: number
          playlist_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          duration_override?: number | null
          id?: string
          order_index?: number
          playlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlist_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_contents_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          total_duration: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          is_master: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          is_master?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          phone?: string | null
          updated_at?: string | null
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
