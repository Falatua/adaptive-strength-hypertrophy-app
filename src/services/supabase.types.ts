/**
 * Checked-in browser contract for the ForgePath Supabase surface used by this app.
 * Keep this file aligned with versioned migrations. It intentionally omits tables
 * the browser does not query or mutate.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ForgePathDatabase = {
  public: {
    Tables: {
      forgepath_devices: {
        Row: {
          id: string
          user_id: string
          display_name: string
          platform: string
          app_version: string
          schema_version: number
          last_seen_at: string
        }
        Insert: {
          id: string
          user_id: string
          display_name: string
          platform: string
          app_version: string
          schema_version: number
          last_seen_at: string
        }
        Update: Partial<ForgePathDatabase['public']['Tables']['forgepath_devices']['Insert']>
        Relationships: []
      }
      forgepath_state_snapshots: {
        Row: {
          user_id: string
          payload: Json
          version: number
          updated_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      push_forgepath_snapshot: {
        Args: {
          p_event_id: string
          p_device_id: string
          p_base_version: number
          p_device_sequence: number
          p_schema_version: number
          p_app_version: string
          p_rule_version: string
          p_checksum: string
          p_occurred_at: string
          p_timezone: string
          p_payload: Json
        }
        Returns: Json
      }
      reset_forgepath_data: {
        Args: { p_confirmation: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
